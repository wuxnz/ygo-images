import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { broadcastMatchUpdate } from "@/server/websocket/server";

// Helper function to advance winner to next round
async function advanceWinnerToNextRound(
  tournamentId: string,
  currentRound: number,
  currentPosition: number,
  winnerId: string,
) {
  // Find the next round match that this winner should advance to
  const nextRound = currentRound + 1;

  // In single elimination, position in next round is calculated as:
  // Math.ceil(currentPosition / 2)
  const nextPosition = Math.ceil(currentPosition / 2);

  // Find the next round match
  const nextMatch = await db.match.findFirst({
    where: {
      tournamentId: tournamentId,
      round: nextRound,
      position: nextPosition,
    },
  });

  if (nextMatch) {
    // Determine if winner goes to player1 or player2 slot
    // Odd positions (1, 3, 5...) go to player1, even positions (2, 4, 6...) go to player2
    const isPlayer1Slot = currentPosition % 2 === 1;

    await db.match.update({
      where: { id: nextMatch.id },
      data: isPlayer1Slot ? { player1Id: winnerId } : { player2Id: winnerId },
    });
  }
}

// Helper function to clear a specific advanced winner
async function clearAdvancedWinner(
  tournamentId: string,
  currentRound: number,
  currentPosition: number,
) {
  const nextRound = currentRound + 1;
  const nextPosition = Math.ceil(currentPosition / 2);

  const nextMatch = await db.match.findFirst({
    where: {
      tournamentId: tournamentId,
      round: nextRound,
      position: nextPosition,
    },
  });

  if (nextMatch) {
    const isPlayer1Slot = currentPosition % 2 === 1;

    // Clear the specific player slot and also reset the match if it was completed
    await db.match.update({
      where: { id: nextMatch.id },
      data: {
        ...(isPlayer1Slot ? { player1Id: null } : { player2Id: null }),
        // If this was the only player, reset the match
        winnerId: null,
        status: "SCHEDULED",
      },
    });

    // Recursively clear subsequent rounds
    if (nextMatch.winnerId) {
      await clearAdvancedWinner(tournamentId, nextRound, nextPosition);
    }
  }
}

// Helper function to clear all advanced winners from a round
async function clearAllAdvancedWinners(
  tournamentId: string,
  fromRound: number,
) {
  // Get all subsequent rounds and clear them
  const subsequentMatches = await db.match.findMany({
    where: {
      tournamentId: tournamentId,
      round: { gt: fromRound },
    },
  });

  if (subsequentMatches.length > 0) {
    await db.match.updateMany({
      where: {
        tournamentId: tournamentId,
        round: { gt: fromRound },
      },
      data: {
        player1Id: null,
        player2Id: null,
        winnerId: null,
        status: "SCHEDULED",
      },
    });
  }
}

export const matchRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        round: z.number(),
        position: z.number(),
        player1Id: z.string().optional(),
        player2Id: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.match.create({
        data: {
          tournamentId: input.tournamentId,
          round: input.round,
          position: input.position,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        player1Score: z.number().optional(),
        player2Score: z.number().optional(),
        winnerId: z.string().optional(),
        status: z
          .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "BYE"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const match = await db.match.update({
        where: { id: input.id },
        data: {
          player1Score: input.player1Score,
          player2Score: input.player2Score,
          winnerId: input.winnerId,
          status: input.status,
        },
      });

      // If match is completed and has a winner, advance to next round
      if (input.status === "COMPLETED" && input.winnerId) {
        await advanceWinnerToNextRound(
          match.tournamentId,
          match.round,
          match.position,
          input.winnerId,
        );
      }

      // Broadcast match update to WebSocket clients
      broadcastMatchUpdate(match);

      return match;
    }),

  advanceAllWinners: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      // Find all completed matches that have winners
      const completedMatches = await db.match.findMany({
        where: {
          tournamentId: input.tournamentId,
          status: "COMPLETED",
          winnerId: { not: null },
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      });

      // Advance each winner to the next round
      for (const match of completedMatches) {
        if (match.winnerId) {
          await advanceWinnerToNextRound(
            match.tournamentId,
            match.round,
            match.position,
            match.winnerId,
          );
        }
      }

      return {
        message: "All winners advanced",
        processedMatches: completedMatches.length,
      };
    }),

  reshuffleBracket: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      // Get tournament with participants
      const tournament = await db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: {
            include: { user: true },
          },
        },
      });

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Delete all existing matches
      await db.match.deleteMany({
        where: { tournamentId: input.tournamentId },
      });

      // Regenerate bracket with shuffled participants
      const { generateBracket } = await import("@/lib/bracketGenerator");
      const matches = generateBracket(
        {
          ...tournament,
          participants: tournament.participants.map((p) => p.user),
        },
        tournament.bracketType,
      );

      // Create new matches
      for (const match of matches) {
        await db.match.create({
          data: {
            ...match,
            status: match.status as any,
          },
        });
      }

      return { message: "Bracket reshuffled", newMatches: matches.length };
    }),

  resetMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ input }) => {
      const match = await db.match.update({
        where: { id: input.matchId },
        data: {
          winnerId: null,
          player1Score: null,
          player2Score: null,
          status: "SCHEDULED",
        },
      });

      // Also need to clear any matches in subsequent rounds that this winner was advanced to
      await clearAdvancedWinner(
        match.tournamentId,
        match.round,
        match.position,
      );

      return match;
    }),

  resetRound: protectedProcedure
    .input(z.object({ tournamentId: z.string(), round: z.number() }))
    .mutation(async ({ input }) => {
      // Reset all matches in the specified round
      const matches = await db.match.updateMany({
        where: {
          tournamentId: input.tournamentId,
          round: input.round,
        },
        data: {
          winnerId: null,
          player1Score: null,
          player2Score: null,
          status: "SCHEDULED",
        },
      });

      // Clear all subsequent rounds that these winners might have advanced to
      await clearAllAdvancedWinners(input.tournamentId, input.round);

      return {
        message: `Round ${input.round} reset`,
        updatedMatches: matches.count,
      };
    }),

  getByTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      return await db.match.findMany({
        where: { tournamentId: input.tournamentId },
        include: {
          player1: true,
          player2: true,
          winner: true,
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      });
    }),
});
