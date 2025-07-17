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
          message: "Only the organizer can generate pairings",
        });
      }

      if (tournament.bracketType !== "SWISS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      if (!tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament must be started first",
        });
      }

      // Import Swiss pairing algorithm
      const { generateSwissPairings } = await import("@/lib/swissPairing");

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

      const currentRound = Math.max(...matches.map((m) => m.round || 0), 0) + 1;
      const pairings = generateSwissPairings(
        participants,
        matches,
        currentRound,
      );

      // Create new matches for the next round
      const createdMatches = [];
      for (let i = 0; i < pairings.length; i++) {
        const pairing = pairings[i];
        if (pairing && pairing.player1Id && pairing.player2Id) {
          const match = await ctx.db.match.create({
            data: {
              tournamentId: input.tournamentId,
              player1Id: pairing.player1Id,
              player2Id: pairing.player2Id,
              round: currentRound,
              position: i + 1,
              status: "SCHEDULED",
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
          matches: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.bracketType !== "SWISS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      const { calculateSwissStandings } = await import("@/lib/swissPairing");

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

      const standings = calculateSwissStandings(participants, matches);

      return standings.map((standing) => ({
        participant: {
          id: standing.participant.id,
          name: standing.participant.name,
        },
        wins: standing.wins,
        losses: standing.losses,
        draws: standing.draws,
        points: standing.points,
        opponents: standing.opponents,
      }));
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

      if (tournament.bracketType !== "SWISS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
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

      // Import Swiss completion logic
      const { isSwissTournamentComplete, calculateSwissPlacements } =
        await import("@/lib/swissPairing");

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

      // Create tournament result record
      const result = await ctx.db.tournamentResult.create({
        data: {
          tournamentId: input.tournamentId,
          winnerId: winner.participant.id,
        },
      });

      // Create top 8 placements
      const top8Placements = placements.slice(0, 8).map((placement, index) => ({
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

  startSwissTournament: protectedProcedure
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

      if (tournament.bracketType !== "SWISS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for Swiss tournaments",
        });
      }

      // Create initial matches for round 1 (random pairings)
      const participants = tournament.participants.map((p) => p.user);
      const shuffled = [...participants].sort(() => Math.random() - 0.5);

      const matches = [];
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const player1 = shuffled[i];
        const player2 = shuffled[i + 1];

        if (player1 && player2) {
          const match = await ctx.db.match.create({
            data: {
              tournamentId: input.id,
              player1Id: player1.id,
              player2Id: player2.id,
              round: 1,
              position: Math.floor(i / 2) + 1,
              status: "SCHEDULED",
            },
          });
          matches.push(match);
        }
      }

      // Set tournament as started
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: { started: true },
      });

      return { success: true, matches };
    }),
});
