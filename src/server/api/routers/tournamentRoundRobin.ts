import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentRoundRobinRouter = createTRPCRouter({
  startRoundRobinTournament: protectedProcedure
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

      if (tournament.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already started",
        });
      }

      if (tournament.format !== "round_robin") {
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

      // Create all rounds and matches for the tournament
      const roundsMap = new Map<number, string>();

      for (let i = 0; i < pairings.length; i++) {
        const pairing = pairings[i];
        if (pairing && pairing.player1Id && pairing.player2Id) {
          // Create round if it doesn't exist
          if (!roundsMap.has(pairing.round)) {
            const round = await ctx.db.tournamentRound.create({
              data: {
                tournamentId: input.id,
                roundNumber: pairing.round,
              },
            });
            roundsMap.set(pairing.round, round.id);
          }

          const roundId = roundsMap.get(pairing.round)!;

          await ctx.db.tournamentMatch.create({
            data: {
              roundId,
              player1Id: pairing.player1Id,
              player2Id: pairing.player2Id,
            },
          });
        }
      }

      // Update tournament status
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: {
          status: "in_progress",
        },
      });

      return {
        success: true,
        totalRounds: Math.max(...pairings.map((p) => p.round)),
      };
    }),

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

      if (tournament.format !== "round_robin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Round Robin tournaments",
        });
      }

      if (tournament.status !== "in_progress") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament is not in progress",
        });
      }

      // Import Round Robin completion logic
      const { isRoundRobinTournamentComplete, calculateRoundRobinPlacements } =
        await import("@/lib/roundRobinPairing");

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

      // Create tournament result records for top 8 placements
      const top8Placements = placements.slice(0, 8).map((placement, index) => ({
        tournamentId: input.tournamentId,
        userId: placement.participant.id,
        placement: index + 1,
        points: placement.points,
        wins: placement.wins,
        losses: placement.losses,
      }));

      for (const placement of top8Placements) {
        await ctx.db.tournamentResult.create({
          data: placement,
        });
      }

      // Mark tournament as completed
      await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: "completed",
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
          rounds: {
            where: { roundNumber: input.round },
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
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      const round = tournament.rounds[0];
      if (!round) {
        return [];
      }

      return round.matches.map((match) => ({
        id: match.id,
        round: input.round,
        player1Id: match.player1Id || "",
        player2Id: match.player2Id || "",
        player1: { name: match.player1?.name || "Unknown" },
        player2: { name: match.player2?.name || "Unknown" },
        winnerId: match.winnerId,
        status: match.winnerId ? "COMPLETED" : "SCHEDULED",
      }));
    }),
});
