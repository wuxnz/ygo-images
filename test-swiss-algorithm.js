#!/usr/bin/env node

/**
 * Swiss Tournament Algorithm Test Script
 * This script tests the Swiss pairing algorithm in isolation
 */

const {
  generateSwissPairings,
  calculateSwissStandings,
  isSwissTournamentComplete,
  calculateSwissPlacements,
} = require("./src/lib/swissPairing");

// Test data
const testParticipants = [
  { id: "user1", name: "Alice" },
  { id: "user2", name: "Bob" },
  { id: "user3", name: "Charlie" },
  { id: "user4", name: "David" },
  { id: "user5", name: "Eve" },
  { id: "user6", name: "Frank" },
  { id: "user7", name: "Grace" },
  { id: "user8", name: "Henry" },
];

// Test 1: Initial pairings (Round 1)
console.log("=== Test 1: Initial Pairings (Round 1) ===");
const round1Pairings = generateSwissPairings(testParticipants, [], 1);
console.log("Round 1 pairings:", round1Pairings);

// Test 2: After Round 1 with some results
console.log("\n=== Test 2: After Round 1 Results ===");
const round1Matches = [
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
    round: 1,
    player1Id: "user5",
    player2Id: "user6",
    winnerId: "user5",
    status: "COMPLETED",
  },
  {
    id: "m4",
    round: 1,
    player1Id: "user7",
    player2Id: "user8",
    winnerId: "user7",
    status: "COMPLETED",
  },
];

const standingsAfterRound1 = calculateSwissStandings(
  testParticipants,
  round1Matches,
);
console.log("Standings after Round 1:", standingsAfterRound1);

const round2Pairings = generateSwissPairings(
  testParticipants,
  round1Matches,
  2,
);
console.log("Round 2 pairings:", round2Pairings);

// Test 3: After Round 2 with more results
console.log("\n=== Test 3: After Round 2 Results ===");
const round2Matches = [
  ...round1Matches,
  {
    id: "m5",
    round: 2,
    player1Id: "user1",
    player2Id: "user3",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "m6",
    round: 2,
    player1Id: "user5",
    player2Id: "user7",
    winnerId: "user5",
    status: "COMPLETED",
  },
  {
    id: "m7",
    round: 2,
    player1Id: "user2",
    player2Id: "user4",
    winnerId: "user2",
    status: "COMPLETED",
  },
  {
    id: "m8",
    round: 2,
    player1Id: "user6",
    player2Id: "user8",
    winnerId: "user6",
    status: "COMPLETED",
  },
];

const standingsAfterRound2 = calculateSwissStandings(
  testParticipants,
  round2Matches,
);
console.log("Standings after Round 2:", standingsAfterRound2);

const round3Pairings = generateSwissPairings(
  testParticipants,
  round2Matches,
  3,
);
console.log("Round 3 pairings:", round3Pairings);

// Test 4: Tournament completion check
console.log("\n=== Test 4: Tournament Completion Check ===");
const allMatches = [
  ...round2Matches,
  {
    id: "m9",
    round: 3,
    player1Id: "user1",
    player2Id: "user5",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "m10",
    round: 3,
    player1Id: "user3",
    player2Id: "user2",
    winnerId: "user3",
    status: "COMPLETED",
  },
  {
    id: "m11",
    round: 3,
    player1Id: "user7",
    player2Id: "user6",
    winnerId: "user7",
    status: "COMPLETED",
  },
  {
    id: "m12",
    round: 3,
    player1Id: "user4",
    player2Id: "user8",
    winnerId: "user4",
    status: "COMPLETED",
  },
];

const isComplete = isSwissTournamentComplete(testParticipants, allMatches);
console.log("Is tournament complete?", isComplete);

// Test 5: Final placements
console.log("\n=== Test 5: Final Placements ===");
const finalPlacements = calculateSwissPlacements(testParticipants, allMatches);
console.log("Final placements:", finalPlacements);

// Test 6: Edge case - odd number of players
console.log("\n=== Test 6: Odd Number of Players ===");
const oddParticipants = testParticipants.slice(0, 7);
const oddRound1Pairings = generateSwissPairings(oddParticipants, [], 1);
console.log("Round 1 pairings with 7 players:", oddRound1Pairings);

// Test 7: Tiebreaker scenarios
console.log("\n=== Test 7: Tiebreaker Test ===");
const tiebreakerMatches = [
  {
    id: "t1",
    round: 1,
    player1Id: "user1",
    player2Id: "user2",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "t2",
    round: 1,
    player1Id: "user3",
    player2Id: "user4",
    winnerId: "user3",
    status: "COMPLETED",
  },
  {
    id: "t3",
    round: 1,
    player1Id: "user5",
    player2Id: "user6",
    winnerId: "user5",
    status: "COMPLETED",
  },
  {
    id: "t4",
    round: 1,
    player1Id: "user7",
    player2Id: "user8",
    winnerId: "user7",
    status: "COMPLETED",
  },
  {
    id: "t5",
    round: 2,
    player1Id: "user1",
    player2Id: "user3",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "t6",
    round: 2,
    player1Id: "user5",
    player2Id: "user7",
    winnerId: "user5",
    status: "COMPLETED",
  },
  {
    id: "t7",
    round: 2,
    player1Id: "user2",
    player2Id: "user4",
    winnerId: "user2",
    status: "COMPLETED",
  },
  {
    id: "t8",
    round: 2,
    player1Id: "user6",
    player2Id: "user8",
    winnerId: "user6",
    status: "COMPLETED",
  },
  {
    id: "t9",
    round: 3,
    player1Id: "user1",
    player2Id: "user5",
    winnerId: "user1",
    status: "COMPLETED",
  },
  {
    id: "t10",
    round: 3,
    player1Id: "user3",
    player2Id: "user2",
    winnerId: "user3",
    status: "COMPLETED",
  },
  {
    id: "t11",
    round: 3,
    player1Id: "user7",
    player2Id: "user6",
    winnerId: "user7",
    status: "COMPLETED",
  },
  {
    id: "t12",
    round: 3,
    player1Id: "user4",
    player2Id: "user8",
    winnerId: "user4",
    status: "COMPLETED",
  },
];

const tiebreakerPlacements = calculateSwissPlacements(
  testParticipants,
  tiebreakerMatches,
);
console.log("Tiebreaker placements:", tiebreakerPlacements);

console.log("\n=== All Tests Completed ===");
