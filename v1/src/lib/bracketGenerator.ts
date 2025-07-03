import { type Tournament, type User } from "@prisma/client";

interface MatchData {
  tournamentId: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  status: string;
}

export function generateBracket(
  tournament: Tournament & { participants: User[] },
  bracketType: string,
): MatchData[] {
  const participants = [...tournament.participants];
  const matches: MatchData[] = [];

  if (bracketType === "SINGLE_ELIMINATION") {
    const numParticipants = participants.length;
    if (numParticipants < 2) {
      return matches; // Need at least 2 participants
    }

    // Calculate the number of rounds needed
    const numRounds = Math.ceil(Math.log2(numParticipants));

    // Shuffle participants for fairness
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    // Round 1: Create matches for first round
    const firstRoundMatches = Math.ceil(numParticipants / 2);

    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = participants[i * 2] || null;
      const player2 = participants[i * 2 + 1] || null; // may be undefined if odd number of participants

      matches.push({
        tournamentId: tournament.id,
        round: 1,
        position: i + 1,
        player1Id: player1?.id || null,
        player2Id: player2?.id || null,
        status: player2 ? "SCHEDULED" : "BYE", // BYE if no second player
      });
    }

    // Create subsequent rounds (empty matches to be filled as tournament progresses)
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);

      for (let position = 1; position <= matchesInRound; position++) {
        matches.push({
          tournamentId: tournament.id,
          round: round,
          position: position,
          player1Id: null,
          player2Id: null,
          status: "SCHEDULED",
        });
      }
    }
  }

  if (bracketType === "DOUBLE_ELIMINATION") {
    // TODO: Implement double elimination bracket generation
    // For now, fall back to single elimination
    return generateBracket(tournament, "SINGLE_ELIMINATION");
  }

  return matches;
}
