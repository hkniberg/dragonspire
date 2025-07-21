// Simple runner for the Lords of Doomspire simulation
const { execSync } = require("child_process");

function runSingleTurn() {
  console.log("🎮 Running single turn test...\n");
  try {
    execSync("./node_modules/.bin/tsx src/cli/CLIRunner.ts --single-turn", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to run single turn test");
    process.exit(1);
  }
}

function runCompleteGame() {
  console.log("🎮 Running complete game simulation...\n");
  try {
    execSync("./node_modules/.bin/tsx src/cli/CLIRunner.ts", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to run complete game simulation");
    process.exit(1);
  }
}

function runSpecificTurns(numTurns) {
  console.log(`🎮 Running ${numTurns} turn(s) simulation...\n`);
  try {
    execSync(
      `./node_modules/.bin/tsx src/cli/CLIRunner.ts --turns ${numTurns}`,
      {
        stdio: "inherit",
      }
    );
  } catch (error) {
    console.error(`❌ Failed to run ${numTurns} turn(s) simulation`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes("--single-turn") || args.includes("-s")) {
  runSingleTurn();
} else if (args.includes("--complete") || args.includes("-c")) {
  runCompleteGame();
} else if (args.includes("--turns") || args.includes("-t")) {
  const turnsIndex = args.findIndex((arg) => arg === "--turns" || arg === "-t");
  const numTurns = parseInt(args[turnsIndex + 1]);

  if (isNaN(numTurns) || numTurns < 1) {
    console.error(
      "❌ Invalid number of turns. Please provide a positive integer."
    );
    console.log("Example: node run-test.js --turns 5");
    process.exit(1);
  }

  runSpecificTurns(numTurns);
} else {
  console.log("🎮 Lords of Doomspire Simulation Runner\n");
  console.log("Usage:");
  console.log("  node run-test.js --single-turn   # Test one turn");
  console.log("  node run-test.js --turns X       # Run X turns");
  console.log("  node run-test.js --complete      # Run complete game");
  console.log("  npm run test-turn                # Test one turn");
  console.log("  npm run simulate                 # Run complete game");
  console.log("\nExamples:");
  console.log("  node run-test.js --turns 3       # Run 3 turns");
  console.log("  node run-test.js -t 5            # Run 5 turns");
}
