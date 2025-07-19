import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentResultsRouter = createTRPCRouter({
  getTournamentResults: publicProcedure
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
          rounds: {
            include: {
              matches: {
                include: {
                  player1: true,
                  player2: true,
                  winner: true,
                },
              },
            },
          },
          results: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.results.length === 0) {
        return null;
      }

      // Get all results for this tournament
      const allResults = await ctx.db.tournamentResult.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          user: true,
        },
        orderBy: { placement: "asc" },
      });

      // Get top 8 results
      const top8Results = allResults.slice(0, 8);

      const enhancedTop8Users = top8Results.map((result) => {
        const participant = tournament.participants.find(
          (p) => p.userId === result.userId,
        );
        return {
          ...result,
          user: result.user,
          deck: participant?.deck || null,
        };
      });

      return {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          format: tournament.format,
          status: tournament.status,
          endDate: tournament.endDate,
          size: tournament.participants.length,
        },
        winner: enhancedTop8Users[0],
        top8: enhancedTop8Users,
        allResults: allResults.map((r) => ({
          ...r,
          user: r.user,
        })),
      };
    }),

  getUserTournamentResults: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.tournamentResult.findMany({
        where: { userId: input.userId },
        include: {
          tournament: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return results.map((result) => ({
        id: result.id,
        placement: result.placement,
        wins: result.wins,
        losses: result.losses,
        draws: result.draws,
        points: result.points,
        tournament: {
          id: result.tournament.id,
          name: result.tournament.name,
          format: result.tournament.format,
          startDate: result.tournament.startDate,
          status: result.tournament.status,
        },
      }));
    }),

  getTop8Results: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.tournamentResult.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          user: true,
        },
        orderBy: { placement: "asc" },
        take: 8,
      });

      return results.map((result) => ({
        placement: result.placement,
        user: result.user,
        wins: result.wins,
        losses: result.losses,
        draws: result.draws,
        points: result.points,
      }));
    }),

  getTop8Deck: publicProcedure
    .input(z.object({ tournamentId: z.string(), placement: z.number() }))
    .query(async ({ input, ctx }) => {
      const { tournamentId, placement } = input;

      // Get the tournament result for the specific placement
      const result = await ctx.db.tournamentResult.findFirst({
        where: {
          tournamentId,
          placement,
        },
        include: {
          user: true,
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No result found for this placement",
        });
      }

      // Get the participant record to find their deck
      const participant = await ctx.db.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: result.userId,
          },
        },
        include: {
          deck: true,
        },
      });

      if (!participant || !participant.deck) {
        return {
          placement: result.placement,
          user: result.user,
          deck: null,
        };
      }

      return {
        placement: result.placement,
        user: result.user,
        deck: participant.deck,
      };
    }),

  // Helper function to calculate top 8 placements for any tournament format
  calculateTop8Placements: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          rounds: {
            include: {
              matches: true,
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

      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the creator can calculate placements",
        });
      }

      if (tournament.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament must be completed to calculate placements",
        });
      }

      // Import placement calculation logic based on format
      let placements: any[] = [];

      if (tournament.format === "round_robin") {
        const { calculateRoundRobinPlacements } = await import(
          "@/lib/roundRobinPairing"
        );

        const participants = tournament.participants.map((p) => ({
          id: p.userId,
          name: p.user.name || "Unknown",
        }));

        const allMatches = tournament.rounds.flatMap((r) => r.matches);
        const matches = allMatches.map((m) => ({
          id: m.id,
          round:
            tournament.rounds.find((r) => r.id === m.roundId)?.roundNumber || 0,
          player1Id: m.player1Id || undefined,
          player2Id: m.player2Id || undefined,
          winnerId: m.winnerId || undefined,
          status: m.winnerId ? "COMPLETED" : "SCHEDULED",
        }));

        placements = calculateRoundRobinPlacements(participants, matches);
      } else if (tournament.format === "swiss") {
        const { calculateSwissPlacements } = await import("@/lib/swissPairing");

        const participants = tournament.participants.map((p) => ({
          id: p.userId,
          name: p.user.name || "Unknown",
        }));

        const allMatches = tournament.rounds.flatMap((r) => r.matches);
        const matches = allMatches.map((m) => ({
          id: m.id,
          round:
            tournament.rounds.find((r) => r.id === m.roundId)?.roundNumber || 0,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          winnerId: m.winnerId || undefined,
          status: m.winnerId ? "COMPLETED" : "SCHEDULED",
        }));

        placements = calculateSwissPlacements(participants, matches);
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported tournament format for placement calculation",
        });
      }

      // Create tournament results for all participants
      for (let i = 0; i < placements.length; i++) {
        const placement = placements[i];
        await ctx.db.tournamentResult.create({
          data: {
            tournamentId: input.tournamentId,
            userId: placement.participant.id,
            placement: i + 1,
            wins: placement.wins || 0,
            losses: placement.losses || 0,
            draws: placement.draws || 0,
            points: placement.points || 0,
          },
        });
      }

      return placements.slice(0, 8);
    }),
});
