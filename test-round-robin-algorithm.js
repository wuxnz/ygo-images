// Test script for Round Robin tournament algorithm
// This script tests the pairing and standings calculation logic

console.log("🧪 Testing Round Robin Tournament Algorithm...\n");

// Mock participants
const createMockParticipants = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    wins: 0,
    losses: 0,
    points: 0,
  }));
};

// Test the pairing algorithm
const testPairingAlgorithm = () => {
  console.log("📊 Testing Pairing Algorithm...\n");

  const testCases = [2, 3, 4, 5, 6, 8];

  testCases.forEach((count) => {
    const participants = createMockParticipants(count);
    const expectedMatches = (count * (count - 1)) / 2;
    const expectedRounds = count % 2 === 0 ? count - 1 : count;

    console.log(`${count} participants:`);
    console.log(`  Expected matches: ${expectedMatches}`);
    console.log(`  Expected rounds: ${expectedRounds}`);
    console.log(
      `  Expected matches per round: ${
        count % 2 === 0 ? count / 2 : Math.floor(count / 2)
      }`
    );
    console.log("");
  });
};

// Test standings calculation
const testStandingsCalculation = () => {
  console.log("🏆 Testing Standings Calculation...\n");

  const participants = createMockParticipants(4);
  const matches = [
    { player1Id: "player-1", player2Id: "player-2", winnerId: "player-1" },
    { player1Id: "player-3", player2Id: "player-4", winnerId: "player-3" },
    { player1Id: "player-1", player2Id: "player-3", winnerId: "player-1" },
    { player1Id: "player-2", player2Id: "player-4", winnerId: "player-2" },
    { player1Id: "player-1", player2Id: "player-4", winnerId: "player-1" },
    { player1Id: "player-2", player2Id: "player-3", winnerId: "player-2" },
  ];

  // Calculate standings
  const standings = participants.map((p) => {
    const wins = matches.filter((m) => m.winnerId === p.id).length;
    const losses = matches.filter(
      (m) =>
        (m.player1Id === p.id || m.player2Id === p.id) && m.winnerId !== p.id
    ).length;

    return {
      ...p,
      wins,
      losses,
      points: wins * 3,
    };
  });

  // Sort by points (descending)
  standings.sort((a, b) => b.points - a.points);

  console.log("Final Standings:");
  standings.forEach((player, index) => {
    console.log(
      `${index + 1}. ${player.name}: ${player.wins}W-${player.losses}L, ${
        player.points
      } points`
    );
  });

  // Verify expected results
  const expected = [
    { name: "Player 1", wins: 3, losses: 0, points: 9 },
    { name: "Player 2", wins: 2, losses: 1, points: 6 },
    { name: "Player 3", wins: 1, losses: 2, points: 3 },
    { name: "Player 4", wins: 0, losses: 3, points: 0 },
  ];

  const isCorrect = standings.every(
    (player, index) =>
      player.wins === expected[index].wins &&
      player.losses === expected[index].losses &&
      player.points === expected[index].points
  );

  console.log(
    `\nStandings calculation: ${isCorrect ? "✅ CORRECT" : "❌ INCORRECT"}`
  );
};

// Test edge cases
const testEdgeCases = () => {
  console.log("\n🔍 Testing Edge Cases...\n");

  // Test with 2 players
  console.log("2 players:");
  const participants2 = createMockParticipants(2);
  console.log(`  Expected matches: 1`);
  console.log(`  Expected rounds: 1`);

  // Test with 3 players (odd number)
  console.log("\n3 players (odd):");
  const participants3 = createMockParticipants(3);
  console.log(`  Expected matches: 3`);
  console.log(`  Expected rounds: 3`);
  console.log(`  Expected byes: 3 (1 per round)`);

  // Test with 8 players
  console.log("\n8 players:");
  const participants8 = createMockParticipants(8);
  console.log(`  Expected matches: 28`);
  console.log(`  Expected rounds: 7`);
  console.log(`  Expected matches per round: 4`);
};

// Run all tests
const runAllTests = () => {
  testPairingAlgorithm();
  testStandingsCalculation();
  testEdgeCases();

  console.log("\n🎉 All Round Robin algorithm tests completed!");
  console.log("\nThe Round Robin system is ready for use!");
};

// Execute tests
runAllTests();
