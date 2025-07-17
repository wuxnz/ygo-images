import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
// MatchStatus enum is not needed - using string literals

export const tournamentRoundRobinRouter = createTRPCRouter({
  startRoundRobinTournament: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the organizer/creator can start the tournament
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

      if (tournament.organizerId !== ctx.session.user.id) {
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

      if (tournament.bracketType !== "ROUND_ROBIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Round Robin tournaments",
        });
      }

      // Import Round Robin pairing algorithm
      const { generateRoundRobinPairings } = await import(
        "@/lib/roundRobinPairing"
      );

      const participants = tournament.participants.map((p) => ({
        id: p.userId,
        name: p.user.name || "Unknown",
      }));

      const pairings = generateRoundRobinPairings(participants);

      // Create all matches for the tournament
      const createdMatches = [];
      for (let i = 0; i < pairings.length; i++) {
        const pairing = pairings[i];
        if (pairing && pairing.player1Id && pairing.player2Id) {
          const match = await ctx.db.match.create({
            data: {
              tournamentId: input.id,
              player1Id: pairing.player1Id,
              player2Id: pairing.player2Id,
              round: pairing.round,
              position: i + 1,
              status: "SCHEDULED",
            },
          });
          createdMatches.push(match);
        }
      }

      // Set tournament as started
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: {
          started: true,
        },
      });

      return {
        success: true,
        matches: createdMatches,
        totalRounds: Math.max(...pairings.map((p) => p.round)),
      };
    }),

  // Removed duplicate getRoundRobinStandings procedure
  // Standings calculation is handled client-side in RoundRobinBracket component

  completeRoundRobinTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
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

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can complete the tournament",
        });
      }

      if (tournament.bracketType !== "ROUND_ROBIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Round Robin tournaments",
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

      // Import Round Robin completion logic
      const { isRoundRobinTournamentComplete, calculateRoundRobinPlacements } =
        await import("@/lib/roundRobinPairing");

      const participants = tournament.participants.map((p) => ({
        id: p.userId,
        name: p.user.name || "Unknown",
      }));

      const matches = tournament.matches.map((m) => ({
        id: m.id,
        round: m.round,
        player1Id: m.player1Id || undefined,
        player2Id: m.player2Id || undefined,
        winnerId: m.winnerId || undefined,
        status: m.status,
      }));

      // Check if tournament is complete
      if (!isRoundRobinTournamentComplete(participants, matches)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament is not ready to be completed",
        });
      }

      // Calculate final placements
      const placements = calculateRoundRobinPlacements(participants, matches);
      const winner = placements[0];

      if (!winner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No winner could be determined",
        });
      }

      // Create tournament result record
      const result = await ctx.db.tournamentResult.create({
        data: {
          tournamentId: input.tournamentId,
          winnerId: winner.participant.id,
        },
      });

      // Create top 8 placements
      const top8Placements = placements.slice(0, 8).map((placement) => ({
        tournamentResultId: result.id,
        userId: placement.participant.id,
      }));

      for (const placement of top8Placements) {
        await ctx.db.tournamentResultTop8User.create({
          data: placement,
        });
      }

      // Mark tournament as completed
      const completedTournament = await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          completed: true,
          winnerId: winner.participant.id,
        },
      });

      return { success: true, winnerId: winner.participant.id, placements };
    }),

  getRoundRobinMatches: publicProcedure
    .input(z.object({ tournamentId: z.string(), round: z.number() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          matches: {
            where: { round: input.round },
            include: {
              player1: true,
              player2: true,
              winner: true,
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

      return tournament.matches.map((match) => ({
        id: match.id,
        round: match.round,
        player1Id: match.player1Id || "",
        player2Id: match.player2Id || "",
        player1: { name: match.player1?.name || "Unknown" },
        player2: { name: match.player2?.name || "Unknown" },
        winnerId: match.winnerId,
        status: match.status,
      }));
    }),
});
