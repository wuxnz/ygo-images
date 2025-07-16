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
      [participants[i], participants[j]] = [
        participants[j],
        participants[i],
      ] as [User, User];
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

  if (bracketType === "SWISS") {
    return generateSwissBracket(tournament);
  }

  if (bracketType === "ROUND_ROBIN") {
    return generateRoundRobinBracket(tournament);
  }

  return matches;
}

function generateSwissBracket(
  tournament: Tournament & { participants: User[] },
): MatchData[] {
  const participants = [...tournament.participants];
  const matches: MatchData[] = [];

  if (participants.length < 2) {
    return matches; // Need at least 2 participants
  }

  // Calculate number of rounds for Swiss tournament
  // Standard formula: log2(participants) rounded up, with min 3 and max 9 rounds
  const numParticipants = participants.length;
  let numRounds = Math.ceil(Math.log2(numParticipants));

  // Ensure reasonable bounds
  numRounds = Math.max(3, Math.min(numRounds, 9));

  // For Swiss tournaments, we create matches round by round
  // Round 1: Random pairing
  const shuffledParticipants = [...participants];
  for (let i = shuffledParticipants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledParticipants[i], shuffledParticipants[j]] = [
      shuffledParticipants[j],
      shuffledParticipants[i],
    ] as [User, User];
  }

  // Create Round 1 matches
  const matchesInRound = Math.floor(numParticipants / 2);
  for (let i = 0; i < matchesInRound; i++) {
    const player1 = shuffledParticipants[i * 2];
    const player2 = shuffledParticipants[i * 2 + 1];

    if (player1 && player2) {
      matches.push({
        tournamentId: tournament.id,
        round: 1,
        position: i + 1,
        player1Id: player1.id,
        player2Id: player2.id,
        status: "SCHEDULED",
      });
    }
  }

  // Handle odd number of participants (bye)
  if (numParticipants % 2 !== 0) {
    const byePlayer = shuffledParticipants[numParticipants - 1];
    if (byePlayer) {
      matches.push({
        tournamentId: tournament.id,
        round: 1,
        position: matchesInRound + 1,
        player1Id: byePlayer.id,
        player2Id: null,
        status: "BYE",
      });
    }
  }

  // For Swiss, we don't pre-generate all rounds like elimination brackets
  // Instead, we generate matches round by round based on standings
  return matches;
}

function generateRoundRobinBracket(
  tournament: Tournament & { participants: User[] },
): MatchData[] {
  const participants = [...tournament.participants];
  const matches: MatchData[] = [];

  if (participants.length < 2) {
    return matches; // Need at least 2 participants
  }

  // Import the Round Robin pairing function
  const { generateRoundRobinPairings } = require("./roundRobinPairing");

  // Convert participants to the format expected by roundRobinPairing
  const participantData = participants.map((p, index) => ({
    id: p.id,
    name: p.name || `Player ${index + 1}`,
  }));

  // Generate all pairings
  const pairings = generateRoundRobinPairings(participantData);

  // Convert pairings to MatchData format
  pairings.forEach((pairing: any, index: number) => {
    matches.push({
      tournamentId: tournament.id,
      round: pairing.round,
      position: index + 1,
      player1Id: pairing.player1Id,
      player2Id: pairing.player2Id,
      status: "SCHEDULED",
    });
  });

  return matches;
}
