// Simple test runner for Round Robin functionality
const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Round Robin Tournament System...\n");

// Check if the Round Robin pairing file exists
const roundRobinPath = path.join(
  __dirname,
  "src",
  "lib",
  "roundRobinPairing.ts"
);
if (fs.existsSync(roundRobinPath)) {
  console.log("✅ Round Robin pairing file exists");
} else {
  console.log("❌ Round Robin pairing file missing");
}

// Check if the Round Robin router exists
const routerPath = path.join(
  __dirname,
  "src",
  "server",
  "api",
  "routers",
  "tournamentRoundRobin.ts"
);
if (fs.existsSync(routerPath)) {
  console.log("✅ Round Robin router exists");
} else {
  console.log("❌ Round Robin router missing");
}

// Check if the Round Robin component exists
const componentPath = path.join(
  __dirname,
  "src",
  "components",
  "RoundRobinBracket.tsx"
);
if (fs.existsSync(componentPath)) {
  console.log("✅ Round Robin component exists");
} else {
  console.log("❌ Round Robin component missing");
}

// Check if Round Robin is in the bracket generator
const bracketPath = path.join(__dirname, "src", "lib", "bracketGenerator.ts");
if (fs.existsSync(bracketPath)) {
  const content = fs.readFileSync(bracketPath, "utf8");
  if (content.includes("ROUND_ROBIN")) {
    console.log("✅ Round Robin supported in bracket generator");
  } else {
    console.log("❌ Round Robin not supported in bracket generator");
  }
} else {
  console.log("❌ Bracket generator missing");
}

// Check if Round Robin is in the tournament form
const schemaPath = path.join(__dirname, "prisma", "schema.prisma");
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, "utf8");
  if (content.includes("ROUND_ROBIN")) {
    console.log("✅ Round Robin supported in database schema");
  } else {
    console.log("❌ Round Robin not supported in database schema");
  }
}

// Check if Round Robin is in the main API router
const rootPath = path.join(__dirname, "src", "server", "api", "root.ts");
if (fs.existsSync(rootPath)) {
  const content = fs.readFileSync(rootPath, "utf8");
  if (content.includes("tournamentRoundRobin")) {
    console.log("✅ Round Robin router integrated in main API");
  } else {
    console.log("❌ Round Robin router not integrated in main API");
  }
}

console.log("\n🎉 Round Robin tournament system verification complete!");
console.log("\nNext steps:");
console.log("1. Run: npm run dev");
console.log("2. Create a test tournament with Round Robin format");
console.log("3. Follow the test guide in test-round-robin-tournament-flow.md");
