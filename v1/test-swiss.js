// Test the Swiss pairing algorithm
import {
  calculateSwissPlacements,
  calculateSwissStandings,
  generateSwissPairings,
} from "./src/lib/swissPairing.js";

// Test data
const participants = [
  { id: "user1", name: "Alice" },
  { id: "user2", name: "Bob" },
  { id: "user3", name: "Charlie" },
  { id: "user4", name: "David" },
];

const matches = [
  {
    id: "m1",
    round: 1,
    player1Id: "user1",
    player2Id: "user2",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "m2",
    round: 1,
    player1Id: "user3",
    player2Id: "user4",
    winnerId: "user3",
    status: "COMPLETED",
  },
  {
    id: "m3",
    round: 2,
    player1Id: "user1",
    player2Id: "user3",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "m4",
    round: 2,
    player1Id: "user2",
    player2Id: "user4",
    winnerId: "user2",
    status: "COMPLETED",
  },
];

console.log("=== Swiss Algorithm Test ===");
console.log("Participants:", participants.length);
console.log("Matches:", matches.length);

const standings = calculateSwissStandings(participants, matches);
console.log("Standings:", JSON.stringify(standings, null, 2));

const placements = calculateSwissPlacements(participants, matches);
console.log("Final placements:", JSON.stringify(placements, null, 2));

const round3Pairings = generateSwissPairings(participants, matches, 3);
console.log("Round 3 pairings:", JSON.stringify(round3Pairings, null, 2));

console.log("=== Test Complete ===");
