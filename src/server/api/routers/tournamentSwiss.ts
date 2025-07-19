import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentSwissRouter = createTRPCRouter({
  generateSwissPairings: protectedProcedure
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
          message: "Only the creator can generate pairings",
        });
      }

      if (tournament.format !== "swiss") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      if (tournament.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament must be active to generate pairings",
        });
      }

      // Import Swiss pairing algorithm
      const { generateSwissPairings } = await import("@/lib/swissPairing");

      const participants = tournament.participants.map((p) => ({
        id: p.userId,
        name: p.user.name || "Unknown",
      }));

      const matches = tournament.rounds
        .flatMap((r) => r.matches)
        .map((m) => ({
          id: m.id,
          round:
            tournament.rounds.find((r) => r.id === m.roundId)?.roundNumber || 0,
          player1Id: m.player1Id || undefined,
          player2Id: m.player2Id || undefined,
          winnerId: m.winnerId || undefined,
          status: m.winnerId ? "COMPLETED" : "SCHEDULED",
        }));

      const currentRound = Math.max(...matches.map((m) => m.round || 0), 0) + 1;

      const pairings = generateSwissPairings(
        participants,
        matches,
        currentRound,
      );

      // Create new round
      const newRound = await ctx.db.tournamentRound.create({
        data: {
          tournamentId: input.tournamentId,
          roundNumber: currentRound,
        },
      });

      // Create new matches for the next round
      const createdMatches = [];
      for (let i = 0; i < pairings.length; i++) {
        const pairing = pairings[i];
        if (pairing && pairing.player1Id && pairing.player2Id) {
          const match = await ctx.db.tournamentMatch.create({
            data: {
              roundId: newRound.id,
              player1Id: pairing.player1Id,
              player2Id: pairing.player2Id,
            },
          });
          createdMatches.push(match);
        }
      }

      return { success: true, matches: createdMatches, round: currentRound };
    }),

  getSwissStandings: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
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

      if (tournament.format !== "swiss") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      // Import Swiss completion logic
      const { calculateSwissStandings } = await import("@/lib/swissPairing");

      const participants = tournament.participants.map((p) => ({
        id: p.userId,
        name: p.user.name || "Unknown",
      }));

      const matches = tournament.rounds
        .flatMap((r) => r.matches)
        .map((m) => ({
          id: m.id,
          round:
            tournament.rounds.find((r) => r.id === m.roundId)?.roundNumber || 0,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          winnerId: m.winnerId || undefined,
          status: m.winnerId ? "COMPLETED" : "SCHEDULED",
        }));

      const standings = calculateSwissStandings(participants, matches);

      return { standings };
    }),

  completeSwissTournament: protectedProcedure
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
          message: "Only the creator can complete the tournament",
        });
      }

      if (tournament.format !== "swiss") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      if (tournament.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament must be active to complete",
        });
      }

      // Import Swiss completion logic
      const { calculateSwissPlacements } = await import("@/lib/swissPairing");

      const participants = tournament.participants.map((p) => ({
        id: p.userId,
        name: p.user.name || "Unknown",
      }));

      const matches = tournament.rounds
        .flatMap((r) => r.matches)
        .map((m) => ({
          id: m.id,
          round:
            tournament.rounds.find((r) => r.id === m.roundId)?.roundNumber || 0,
          player1Id: m.player1Id,
          player2Id: m.player2Id,
          winnerId: m.winnerId || undefined,
          status: m.winnerId ? "COMPLETED" : "SCHEDULED",
        }));

      // Check if tournament is complete
      if (!isSwissTournamentComplete(participants, matches)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament is not ready to be completed",
        });
      }

      // Calculate final placements
      const placements = calculateSwissPlacements(participants, matches);
      const winner = placements[0];

      if (!winner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No winner could be determined",
        });
      }

      // Create tournament results for all participants
      for (let i = 0; i < placements.length; i++) {
        const placement = placements[i];
        if (placement) {
          await ctx.db.tournamentResult.create({
            data: {
              tournamentId: input.tournamentId,
              userId: placement.participant.id,
              placement: i + 1,
              wins: placement.wins || 0,
              losses: placement.losses || 0,
              draws: 0,
              points: placement.points || 0,
            },
          });
        }
      }

      // Update tournament status
      await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: "completed",
          endDate: new Date(),
        },
      });

      return { success: true, winnerId: winner.participant.id, placements };
    }),

  startSwissTournament: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the creator can start the tournament
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: { user: true },
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
          message: "Only the creator can start this tournament",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already started or completed",
        });
      }

      if (tournament.format !== "swiss") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      // Create first round
      const firstRound = await ctx.db.tournamentRound.create({
        data: {
          tournamentId: input.id,
          roundNumber: 1,
        },
      });

      // Create initial matches for round 1 (random pairings)
      const participants = tournament.participants.map((p) => p.user);
      const shuffled = [...participants].sort(() => Math.random() - 0.5);

      const matches = [];
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const player1 = shuffled[i];
        const player2 = shuffled[i + 1];

        if (player1 && player2) {
          const match = await ctx.db.tournamentMatch.create({
            data: {
              roundId: firstRound.id,
              player1Id: player1.id,
              player2Id: player2.id,
            },
          });
          matches.push(match);
        }
      }

      // Update tournament status
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: { status: "active" },
      });

      return { success: true, matches };
    }),
});

// Helper function to check if Swiss tournament is complete
function isSwissTournamentComplete(
  participants: any[],
  matches: any[],
): boolean {
  const totalRounds = Math.ceil(Math.log2(participants.length));
  const completedRounds = Math.max(...matches.map((m) => m.round || 0), 0);

  return completedRounds >= totalRounds;
}
