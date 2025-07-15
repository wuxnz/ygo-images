import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { MatchStatus, Prisma } from "@prisma/client";

export const tournamentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        size: z.number(),
        bracketType: z.string(),
        rules: z.string(),
        prize: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID is missing in session",
        });
      }

      // Ensure system user exists in database
      const { ensureSystemUser } = await import("../../ensureSystemUser");
      await ensureSystemUser();

      const tournament = await ctx.db.tournament.create({
        data: {
          ...input,
          organizerId: ctx.session.user.id,
          creatorId: ctx.session.user.id,
        },
      });
      return tournament;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tournament.findMany({
      include: {
        participants: true,
        organizer: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
          organizer: true,
        },
      });
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      return tournament;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        size: z.number().optional(),
        bracketType: z.string().optional(),
        rules: z.string().optional(),
        prize: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
      });
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can update this tournament",
        });
      }
      return await ctx.db.tournament.update({
        where: { id: input.id },
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Delete all TournamentParticipant records for this tournament
      await ctx.db.tournamentParticipant.deleteMany({
        where: { tournamentId: input.id },
      });
    }),
  setDeck: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await ctx.db.tournamentParticipant.findFirst({
        where: {
          tournamentId: input.tournamentId,
          userId: ctx.session.user.id,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only participants can select decks",
        });
      }

      return ctx.db.tournamentParticipant.update({
        where: { id: participant.id },
        data: { deckId: input.deckId },
      });
    }),
  getParticipantDecks: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only organizers can view participant decks",
        });
      }

      return tournament.participants
        .filter((p) => p.deckId)
        .map((p) => ({
          userId: p.userId,
          userName: p.user.name,
          deckId: p.deckId,
          deckName: p.deck?.name,
        }));
    }),

  join: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournamentParticipant.create({
        data: {
          tournament: { connect: { id: input.tournamentId } },
          user: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          participants: {
            disconnect: { id: ctx.session.user.id },
          },
        },
      });
    }),

  start: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the organizer/creator can start the tournament
      const tournament = (await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: { user: true },
          },
        },
      })) as Prisma.TournamentGetPayload<{
        include: { participants: { include: { user: true } } };
      }>;
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      if (
        tournament.organizerId !== ctx.session.user.id &&
        tournament.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can start this tournament",
        });
      }
      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already started",
        });
      }

      // Randomize participants
      const shuffledParticipants = [...tournament.participants].sort(
        () => Math.random() - 0.5,
      );
      // Use bracketGenerator to generate matches
      const { generateBracket } = await import("@/lib/bracketGenerator");
      const matches = generateBracket(
        {
          ...tournament,
          participants: tournament.participants.map((p) => p.user),
        },
        tournament.bracketType,
      );
      console.log("Bracket matches to create:", matches);

      // Create matches in DB
      for (const match of matches) {
        const created = await ctx.db.match.create({
          data: {
            ...match,
            status: match.status as MatchStatus,
          },
        });
        console.log("Created match:", created);
      }

      // Set tournament as started
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: { started: true },
      });

      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the organizer/creator can complete the tournament
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
          matches: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (
        tournament.organizerId !== ctx.session.user.id &&
        tournament.creatorId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can complete this tournament",
        });
      }

      if (!tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament has not started",
        });
      }

      if (tournament.completed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already completed",
        });
      }

      // Check if all matches are completed
      const allMatchesCompleted = tournament.matches.every(
        (match) => match.status === "COMPLETED",
      );

      if (!allMatchesCompleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "All matches must be completed before finishing the tournament",
        });
      }

      // Find the winner (the player who won the final match)
      // The final match is in the last round
      const maxRound = Math.max(...tournament.matches.map((m) => m.round));
      const finalMatch = tournament.matches.find(
        (match) => match.round === maxRound,
      );

      if (!finalMatch || !finalMatch.winnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Final match winner not determined",
        });
      }

      const winner = tournament.participants.find(
        (p) => p.userId === finalMatch.winnerId,
      );

      if (!winner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Winner not found in participants",
        });
      }

      // Calculate top 8 placements
      const top8Placements = calculateTop8Placements(tournament);

      // Create tournament result record
      await ctx.db.tournamentResult.create({
        data: {
          tournamentId: input.id,
          winnerId: winner.userId,
          totalParticipants: tournament.participants.length,
          top8: {
            create: top8Placements,
          },
        },
      });

      // Mark tournament as completed
      const completedTournament = await ctx.db.tournament.update({
        where: { id: input.id },
        data: {
          completed: true,
          winnerId: winner.userId,
        },
      });

      return { success: true, winnerId: winner.userId };
    }),

  kickParticipant: protectedProcedure
    .input(z.object({ tournamentId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can kick participants",
        });
      }

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot kick participants after tournament has started",
        });
      }

      // Remove participant
      await ctx.db.tournamentParticipant.deleteMany({
        where: {
          tournamentId: input.tournamentId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  banParticipant: protectedProcedure
    .input(z.object({ tournamentId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can ban participants",
        });
      }

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban participants after tournament has started",
        });
      }

      // Remove participant (ban is just removal - they can't rejoin)
      await ctx.db.tournamentParticipant.deleteMany({
        where: {
          tournamentId: input.tournamentId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),
});

// Helper function to calculate top 8 placements
function calculateTop8Placements(tournament: any) {
  const matches = tournament.matches;
  const participants = tournament.participants;

  // Build placement array
  const placementMap = new Map<number, { userId: string; deckId?: string }>();

  // 1st place: winner of final match
  const maxRound = Math.max(...matches.map((m: any) => m.round));
  const finalMatch = matches.find(
    (m: any) => m.round === maxRound && m.status === "COMPLETED",
  );
  const winnerId = finalMatch?.winnerId;

  if (winnerId) {
    const winnerParticipant = participants.find(
      (p: any) => p.userId === winnerId,
    );
    placementMap.set(1, {
      userId: winnerId,
      deckId: winnerParticipant?.deckId,
    });
  }

  // 2nd place: loser of final match
  if (finalMatch?.winnerId && finalMatch.player1Id && finalMatch.player2Id) {
    const secondPlaceId =
      finalMatch.winnerId === finalMatch.player1Id
        ? finalMatch.player2Id
        : finalMatch.player1Id;
    const secondParticipant = participants.find(
      (p: any) => p.userId === secondPlaceId,
    );
    if (secondParticipant) {
      placementMap.set(2, {
        userId: secondPlaceId,
        deckId: secondParticipant.deckId,
      });
    }
  }

  // Semi-finalists (3rd-4th)
  const semiFinalMatches = matches.filter((m: any) => m.round === maxRound - 1);
  const semiFinalists: string[] = [];

  semiFinalMatches.forEach((match: any) => {
    if (match.status === "COMPLETED" && match.winnerId) {
      const loserId =
        match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (loserId) semiFinalists.push(loserId);
    }
  });

  semiFinalists.forEach((userId, index) => {
    const participant = participants.find((p: any) => p.userId === userId);
    if (participant) {
      placementMap.set(index + 3, { userId, deckId: participant.deckId });
    }
  });

  // Quarter-finalists (5th-8th) for 16+ player tournaments
  if (tournament.size >= 16) {
    const quarterFinalMatches = matches.filter(
      (m: any) => m.round === maxRound - 2,
    );
    const quarterFinalists: string[] = [];

    quarterFinalMatches.forEach((match: any) => {
      if (match.status === "COMPLETED" && match.winnerId) {
        const loserId =
          match.winnerId === match.player1Id
            ? match.player2Id
            : match.player1Id;
        if (loserId) quarterFinalists.push(loserId);
      }
    });

    quarterFinalists.forEach((userId, index) => {
      const participant = participants.find((p: any) => p.userId === userId);
      if (participant) {
        placementMap.set(index + 5, { userId, deckId: participant.deckId });
      }
    });
  }

  // Convert to array format for database
  const top8Placements = [];
  for (let i = 1; i <= 8; i++) {
    const placement = placementMap.get(i);
    if (placement) {
      top8Placements.push({
        placement: i,
        userId: placement.userId,
        deckId: placement.deckId,
      });
    }
  }

  return top8Placements;
}
