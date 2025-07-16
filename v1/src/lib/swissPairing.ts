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

interface SwissStanding {
  participant: Participant;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  opponents: string[];
}

export interface SwissPairing {
  player1Id: string;
  player2Id: string;
  round: number;
}

/**
 * Calculate current standings based on completed matches
 */
export function calculateSwissStandings(
  participants: Participant[],
  matches: Match[],
): SwissStanding[] {
  const standings = new Map<string, SwissStanding>();

  // Initialize standings for all participants
  participants.forEach((participant) => {
    standings.set(participant.id, {
      participant,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      opponents: [],
    });
  });

  // Process completed matches
  matches.forEach((match) => {
    if (match.status === "COMPLETED" && match.winnerId) {
      const player1Standing = standings.get(match.player1Id || "");
      const player2Standing = standings.get(match.player2Id || "");

      if (player1Standing && player2Standing) {
        // Add to opponents list
        player1Standing.opponents.push(match.player2Id || "");
        player2Standing.opponents.push(match.player1Id || "");

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
 * Generate Swiss pairings for the next round
 * Uses the Swiss system pairing algorithm:
 * 1. Players are grouped by score (number of wins)
 * 2. Within each group, players are paired based on their current standings
 * 3. Players don't play against the same opponent twice
 */
export function generateSwissPairings(
  participants: Participant[],
  matches: Match[],
  round: number,
): SwissPairing[] {
  const standings = calculateSwissStandings(participants, matches);

  // Filter out participants who have dropped or are inactive
  const activeParticipants = standings.filter((s) => s.losses < 3); // Drop after 3 losses

  // Group participants by score (number of wins)
  const scoreGroups = new Map<number, SwissStanding[]>();
  activeParticipants.forEach((standing) => {
    const score = standing.wins;
    if (!scoreGroups.has(score)) {
      scoreGroups.set(score, []);
    }
    scoreGroups.get(score)!.push(standing);
  });

  const pairings: SwissPairing[] = [];
  const usedParticipants = new Set<string>();

  // Process score groups from highest to lowest
  const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

  for (const score of sortedScores) {
    const group = scoreGroups.get(score) || [];
    const available = group.filter(
      (s) => !usedParticipants.has(s.participant.id),
    );

    // Sort by tiebreakers (opponent strength, etc.)
    available.sort((a, b) => {
      // Sort by opponent win percentage
      const aOpponentWins = a.opponents.reduce((sum, oppId) => {
        const opp = standings.find((s) => s.participant.id === oppId);
        return sum + (opp?.wins || 0);
      }, 0);
      const bOpponentWins = b.opponents.reduce((sum, oppId) => {
        const opp = standings.find((s) => s.participant.id === oppId);
        return sum + (opp?.wins || 0);
      }, 0);

      return bOpponentWins - aOpponentWins;
    });

    // Pair participants within this score group
    for (let i = 0; i < available.length - 1; i += 2) {
      const player1 = available[i];
      const player2 = available[i + 1];

      // Check if they've played before
      const hasPlayedBefore = matches.some(
        (match) =>
          match.player1Id &&
          match.player2Id &&
          ((match.player1Id === player1.participant.id &&
            match.player2Id === player2.participant.id) ||
            (match.player1Id === player2.participant.id &&
              match.player2Id === player1.participant.id)),
      );

      if (!hasPlayedBefore) {
        pairings.push({
          player1Id: player1.participant.id,
          player2Id: player2.participant.id,
          round,
        });
        usedParticipants.add(player1.participant.id);
        usedParticipants.add(player2.participant.id);
      }
    }

    // Handle odd number of players (give bye)
    if (available.length % 2 === 1) {
      const unpaired = available.find(
        (s) => !usedParticipants.has(s.participant.id),
      );
      if (unpaired) {
        // Find a player from a lower score group to give a bye
        const lowerGroups = sortedScores.filter((s) => s < score);
        for (const lowerScore of lowerGroups) {
          const lowerGroup = scoreGroups.get(lowerScore) || [];
          const lowerAvailable = lowerGroup.filter(
            (s) => !usedParticipants.has(s.participant.id),
          );

          if (lowerAvailable.length > 0) {
            const opponent = lowerAvailable[0];
            pairings.push({
              player1Id: unpaired.participant.id,
              player2Id: opponent.participant.id,
              round,
            });
            usedParticipants.add(unpaired.participant.id);
            usedParticipants.add(opponent.participant.id);
            break;
          }
        }
      }
    }
  }

  return pairings;
}

/**
 * Check if a Swiss tournament is complete
 * Tournament ends when:
 * 1. All players have played the required number of rounds, OR
 * 2. Only one player remains undefeated, OR
 * 3. Maximum rounds reached (ceil(log2(participants)) + 2)
 */
export function isSwissTournamentComplete(
  participants: Participant[],
  matches: Match[],
  maxRounds?: number,
): boolean {
  if (participants.length <= 1) return true;

  const standings = calculateSwissStandings(participants, matches);
  const activeParticipants = standings.filter((s) => s.losses < 3);

  // Calculate maximum rounds
  const calculatedMaxRounds =
    maxRounds || Math.ceil(Math.log2(participants.length)) + 2;

  // Check if maximum rounds reached
  const currentRound = Math.max(...matches.map((m) => m.round || 0), 0);
  if (currentRound >= calculatedMaxRounds) return true;

  // Check if only one undefeated player remains
  const undefeated = standings.filter((s) => s.losses === 0);
  if (undefeated.length === 1 && activeParticipants.length <= 2) return true;

  // Check if all remaining players have played each other
  const possiblePairings = generateSwissPairings(
    participants,
    matches,
    currentRound + 1,
  );
  return possiblePairings.length === 0;
}

/**
 * Calculate final tournament placements
 */
export function calculateSwissPlacements(
  participants: Participant[],
  matches: Match[],
): Array<{
  participant: Participant;
  rank: number;
  wins: number;
  losses: number;
  points: number;
}> {
  const standings = calculateSwissStandings(participants, matches);

  return standings.map((standing, index) => ({
    participant: standing.participant,
    rank: index + 1,
    wins: standing.wins,
    losses: standing.losses,
    points: standing.points,
  }));
}
