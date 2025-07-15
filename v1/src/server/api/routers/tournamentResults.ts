import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentResultsRouter = createTRPCRouter({
  // Save tournament results when tournament completes
  saveResults: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          matches: {
            include: {
              player1: true,
              player2: true,
              winner: true,
            },
          },
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

      // Check if user is the organizer
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can save tournament results",
        });
      }

      // Find the final match (should be the highest round)
      const maxRound = Math.max(...tournament.matches.map((m) => m.round));
      const finalMatch = tournament.matches.find(
        (m) => m.round === maxRound && m.status === "COMPLETED",
      );

      if (!finalMatch?.winnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament is not completed yet",
        });
      }

      // Calculate top 8 placements based on bracket structure
      const top8Placements = calculateTop8Placements(tournament);

      // Create tournament result
      const result = await ctx.db.tournamentResult.create({
        data: {
          tournamentId: input.tournamentId,
          winnerId: finalMatch.winnerId,
          totalParticipants: tournament.participants.length,
          top8: {
            create: top8Placements,
          },
        },
      });

      // Mark tournament as completed
      await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          completed: true,
          winnerId: finalMatch.winnerId,
        },
      });

      return result;
    }),

  // Get all completed tournaments
  getCompletedTournaments: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tournament.findMany({
      where: { completed: true },
      include: {
        winner: {
          select: { id: true, name: true, image: true },
        },
        results: {
          select: { totalParticipants: true, completedAt: true },
        },
      },
      orderBy: { endDate: "desc" },
    });
  }),

  // Get detailed tournament results
  getTournamentResults: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.tournamentResult.findUnique({
        where: { tournamentId: input.tournamentId },
        include: {
          tournament: true,
          winner: {
            select: { id: true, name: true, image: true },
          },
          top8: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
              deck: true,
            },
            orderBy: { placement: "asc" },
          },
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament results not found",
        });
      }

      return result;
    }),

  // Get top 8 deck details for a specific placement
  getTop8Deck: publicProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        placement: z.number().min(1).max(8),
      }),
    )
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.tournamentResult.findUnique({
        where: { tournamentId: input.tournamentId },
        include: {
          top8: {
            where: { placement: input.placement },
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
              deck: true,
            },
          },
        },
      });

      if (!result || result.top8.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Top 8 placement not found",
        });
      }

      return result.top8[0];
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
