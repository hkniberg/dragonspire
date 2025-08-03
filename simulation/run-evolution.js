#!/usr/bin/env node

// Lords of Doomspire Evolution Runner
// Simple wrapper that delegates to the TypeScript runner

const { execSync } = require("child_process");

function runEvolution() {
  // Parse command line arguments
  const populationSize = process.argv.includes("--large") ? 50 : 20;
  const gamesPerGeneration = process.argv.includes("--fast") ? 10 : 25;
  const maxGenerations = parseInt(process.argv.find((arg) => arg.startsWith("--generations="))?.split("=")[1]) || 10;
  const loadFromFile = process.argv.find((arg) => arg.startsWith("--load="))?.split("=")[1];

  // Build the command to run the TypeScript evolution
  let command = `npx tsx evolution-runner.ts`;
  command += ` --populationSize=${populationSize}`;
  command += ` --gamesPerGeneration=${gamesPerGeneration}`;
  command += ` --maxGenerations=${maxGenerations}`;
  if (loadFromFile) {
    command += ` --load=${loadFromFile}`;
  }

  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Evolution failed:", error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log("Lords of Doomspire Evolution Runner\n");
  console.log("Usage: node run-evolution.js [options]\n");
  console.log("Options:");
  console.log("  --fast              Run fewer games per generation (10 instead of 25)");
  console.log("  --large             Use larger population (50 instead of 20)");
  console.log("  --generations=N     Set max generations (default: 10)");
  console.log("  --load=filename     Continue evolution from saved population file");
  console.log("  --help              Show this help message");
  console.log("\nExamples:");
  console.log("  node run-evolution.js --fast --generations=5");
  console.log("  node run-evolution.js --load=evolution-2024-01-01T12-00-00.json --generations=20");
}

if (process.argv.includes("--help")) {
  showUsage();
  process.exit(0);
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n🛑 Evolution interrupted by user");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\n💥 Uncaught exception:", error);
  process.exit(1);
});

// Run the evolution
runEvolution();
