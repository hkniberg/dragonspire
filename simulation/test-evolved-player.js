#!/usr/bin/env node

// Lords of Doomspire - Test Evolved Player
// Quick script to test an evolved genome against other AI types

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function showUsage() {
  console.log("Lords of Doomspire - Test Evolved Player\n");
  console.log("Usage: node test-evolved-player.js <genome-file> [options]\n");
  console.log("Arguments:");
  console.log("  genome-file         Filename of the evolved genome (from best-genomes/ directory)");
  console.log("\nOptions:");
  console.log("  --opponent=TYPE     Opponent type: random, claude, tactical, evolutionary (default: random)");
  console.log("  --turns=N           Number of turns to run (default: complete game)");
  console.log("  --games=N           Number of games to run (default: 1)");
  console.log("\nExamples:");
  console.log("  node test-evolved-player.js best-genome-2024-01-01T12-00-00.json");
  console.log("  node test-evolved-player.js my-genome.json --opponent=claude --turns=10");
  console.log("  node test-evolved-player.js my-genome.json --games=5 --opponent=tactical");
}

async function testEvolvedPlayer() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  const genomeFile = args[0];
  const opponent = args.find((arg) => arg.startsWith("--opponent="))?.split("=")[1] || "random";
  const turns = args.find((arg) => arg.startsWith("--turns="))?.split("=")[1];
  const games = parseInt(args.find((arg) => arg.startsWith("--games="))?.split("=")[1]) || 1;

  // Validate genome file exists
  const genomePath = path.join(process.cwd(), "best-genomes", genomeFile);
  if (!fs.existsSync(genomePath)) {
    console.error(`❌ Genome file not found: best-genomes/${genomeFile}`);
    console.log("\nAvailable genomes:");
    try {
      const genomeDir = path.join(process.cwd(), "best-genomes");
      const files = fs.readdirSync(genomeDir).filter((f) => f.endsWith(".json"));
      files.forEach((file) => console.log(`  ${file}`));
    } catch (error) {
      console.log("  (No genomes directory found)");
    }
    process.exit(1);
  }

  console.log(`🧬 Testing evolved player: ${genomeFile}`);
  console.log(`🤖 Against opponent: ${opponent}`);
  console.log(`🎮 Number of games: ${games}`);
  if (turns) {
    console.log(`⏱️  Turns per game: ${turns}`);
  }
  console.log();

  for (let gameNum = 1; gameNum <= games; gameNum++) {
    console.log(`\n=== Game ${gameNum}/${games} ===`);

    try {
      let command = `npx tsx src/cli/CLIRunner.ts`;

      // Add max rounds limit for testing (50 rounds default)
      command += ` --max-rounds 50`;

      // Add turns option if specified
      if (turns) {
        command += ` --turns ${turns}`;
      }

      // Set up players: evolved vs 3 opponents
      command += ` p1=evolved:${genomeFile}`;
      command += ` p2=${opponent}`;
      command += ` p3=${opponent}`;
      command += ` p4=${opponent}`;

      console.log(`Running: ${command.replace(/npx tsx src\/cli\/CLIRunner.ts/, "game")}`);

      execSync(command, { stdio: "inherit" });
    } catch (error) {
      console.error(`❌ Game ${gameNum} failed:`, error.message);
    }
  }

  console.log(`\n✅ Testing complete! Ran ${games} game(s) with evolved player vs ${opponent}`);
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n🛑 Testing interrupted by user");
  process.exit(0);
});

// Run the testing
testEvolvedPlayer().catch((error) => {
  console.error("\n💥 Testing failed:", error);
  process.exit(1);
});
