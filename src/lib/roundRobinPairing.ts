import { Prisma } from "@prisma/client";

interface Participant {
  id: string;
  name: string;
}

interface Match {
  id: string;
  round: number;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  status: string;
}

interface RoundRobinStanding {
  participant: Participant;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  matchesPlayed: number;
}

export interface RoundRobinPairing {
  player1Id: string;
  player2Id: string;
  round: number;
}

/**
 * Calculate current standings based on completed matches
 */
export function calculateRoundRobinStandings(
  participants: Participant[],
  matches: Match[],
): RoundRobinStanding[] {
  const standings = new Map<string, RoundRobinStanding>();

  // Initialize standings for all participants
  participants.forEach((participant) => {
    standings.set(participant.id, {
      participant,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      matchesPlayed: 0,
    });
  });

  // Process completed matches
  matches.forEach((match) => {
    if (match.status === "COMPLETED" && match.winnerId) {
      const player1Standing = standings.get(match.player1Id || "");
      const player2Standing = standings.get(match.player2Id || "");

      if (player1Standing && player2Standing) {
        player1Standing.matchesPlayed += 1;
        player2Standing.matchesPlayed += 1;

        // Update win/loss records
        if (match.winnerId === match.player1Id) {
          player1Standing.wins += 1;
          player1Standing.points += 3;
          player2Standing.losses += 1;
        } else if (match.winnerId === match.player2Id) {
          player2Standing.wins += 1;
          player2Standing.points += 3;
          player1Standing.losses += 1;
        }
      }
    }
  });

  return Array.from(standings.values()).sort((a, b) => {
    // Sort by points (descending)
    if (b.points !== a.points) return b.points - a.points;
    // Then by wins (descending)
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Then by losses (ascending)
    return a.losses - b.losses;
  });
}

/**
 * Generate all Round Robin pairings for the tournament
 * Uses the circle method (round-robin algorithm) to ensure everyone plays everyone once
 */
export function generateRoundRobinPairings(
  participants: Participant[],
): RoundRobinPairing[] {
  if (participants.length < 2) {
    return [];
  }

  const pairings: RoundRobinPairing[] = [];
  const players = [...participants.map((p) => p.id)];

  // If odd number of players, add a dummy player for byes
  const hasDummy = players.length % 2 !== 0;
  if (hasDummy) {
    players.push("dummy");
  }

  const numRounds = players.length - 1;
  const matchesPerRound = players.length / 2;

  // Generate pairings for each round
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const player1 = players[match];
      const player2 = players[players.length - 1 - match];

      // Skip dummy player matches
      if (player1 !== "dummy" && player2 !== "dummy") {
        pairings.push({
          player1Id: player1!,
          player2Id: player2!,
          round: round + 1,
        });
      }
    }

    // Rotate players (except the first one)
    players.splice(1, 0, players.pop()!);
  }

  return pairings;
}

/**
 * Check if a Round Robin tournament is complete
 * Tournament is complete when all players have played each other once
 */
export function isRoundRobinTournamentComplete(
  participants: Participant[],
  matches: Match[],
): boolean {
  if (participants.length < 2) return true;

  const totalMatches = (participants.length * (participants.length - 1)) / 2;
  const completedMatches = matches.filter(
    (m) => m.status === "COMPLETED",
  ).length;

  return completedMatches >= totalMatches;
}

/**
 * Calculate final tournament placements
 */
export function calculateRoundRobinPlacements(
  participants: Participant[],
  matches: Match[],
): Array<{
  participant: Participant;
  rank: number;
  wins: number;
  losses: number;
  points: number;
  matchesPlayed: number;
}> {
  const standings = calculateRoundRobinStandings(participants, matches);

  return standings.map((standing, index) => ({
    participant: standing.participant,
    rank: index + 1,
    wins: standing.wins,
    losses: standing.losses,
    points: standing.points,
    matchesPlayed: standing.matchesPlayed,
  }));
}

/**
 * Get the current round number based on completed matches
 */
export function getCurrentRound(
  participants: Participant[],
  matches: Match[],
): number {
  if (matches.length === 0) return 0;

  const maxRound = Math.max(...matches.map((m) => m.round || 1), 0);
  const totalRounds =
    participants.length % 2 === 0
      ? participants.length - 1
      : participants.length;

  return Math.min(maxRound, totalRounds);
}

/**
 * Get matches for a specific round
 */
export function getMatchesForRound(matches: Match[], round: number): Match[] {
  return matches.filter((match) => match.round === round);
}
