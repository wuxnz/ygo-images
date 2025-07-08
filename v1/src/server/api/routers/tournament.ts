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
});
