// Simple runner for the Lords of Doomspire simulation
const { execSync } = require("child_process");

function runSingleTurn(extraArgs = []) {
  console.log("🎮 Running single turn test...\n");
  try {
    const argsStr = extraArgs.length > 0 ? ` ${extraArgs.join(" ")}` : "";
    execSync(
      `./node_modules/.bin/tsx src/cli/CLIRunner.ts --single-turn${argsStr}`,
      {
        stdio: "inherit",
      }
    );
  } catch (error) {
    console.error("❌ Failed to run single turn test");
    process.exit(1);
  }
}

function runCompleteGame(extraArgs = []) {
  console.log("🎮 Running complete game simulation...\n");
  try {
    const argsStr = extraArgs.length > 0 ? ` ${extraArgs.join(" ")}` : "";
    execSync(`./node_modules/.bin/tsx src/cli/CLIRunner.ts${argsStr}`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to run complete game simulation");
    process.exit(1);
  }
}

function runSpecificTurns(numTurns, extraArgs = []) {
  console.log(`🎮 Running ${numTurns} turn(s) simulation...\n`);
  try {
    const argsStr = extraArgs.length > 0 ? ` ${extraArgs.join(" ")}` : "";
    execSync(
      `./node_modules/.bin/tsx src/cli/CLIRunner.ts --turns ${numTurns}${argsStr}`,
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

// Find player arguments (p1=random, p2=claude, etc.)
const playerArgs = args.filter((arg) => arg.match(/^p[1-4]=(random|claude)$/));

// Find other arguments (like --max-rounds)
const otherArgs = args.filter((arg, index) => {
  // Skip command flags and their values
  if (
    arg === "--single-turn" ||
    arg === "-s" ||
    arg === "--complete" ||
    arg === "-c" ||
    arg === "--turns" ||
    arg === "-t"
  )
    return false;
  // Skip turn number value
  if (args[index - 1] === "--turns" || args[index - 1] === "-t") return false;
  // Skip player arguments (already extracted)
  if (arg.match(/^p[1-4]=(random|claude)$/)) return false;
  return true;
});

const allExtraArgs = [...playerArgs, ...otherArgs];

if (args.includes("--single-turn") || args.includes("-s")) {
  runSingleTurn(allExtraArgs);
} else if (args.includes("--complete") || args.includes("-c")) {
  runCompleteGame(allExtraArgs);
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

  runSpecificTurns(numTurns, allExtraArgs);
} else {
  console.log("🎮 Lords of Doomspire Simulation Runner\n");
  console.log("Usage:");
  console.log("  node run-test.js --single-turn   # Test one turn");
  console.log("  node run-test.js --turns X       # Run X turns");
  console.log("  node run-test.js --complete      # Run complete game");
  console.log("  npm run test-turn                # Test one turn");
  console.log("  npm run simulate                 # Run complete game");
  console.log("\nAdditional Options:");
  console.log(
    "  --max-rounds N                   # Set maximum rounds for complete games"
  );
  console.log("\nPlayer Configuration:");
  console.log(
    "  p1=random p2=claude p3=random p4=claude  # Specify player types"
  );
  console.log("  Available types: random, claude");
  console.log("  Default: All players are 'random' if not specified");
  console.log("\nEnvironment Setup:");
  console.log("  Create a .env file with: ANTHROPIC_API_KEY=your_api_key_here");
  console.log("  This is required when using claude players");
  console.log("\nExamples:");
  console.log(
    "  node run-test.js --turns 3                          # 3 turns, all random players"
  );
  console.log(
    "  node run-test.js --single-turn p1=claude            # 1 turn, Player 1 is Claude AI"
  );
  console.log(
    "  node run-test.js --complete p1=random p2=claude     # Complete game, mixed players"
  );
  console.log(
    "  node run-test.js --complete --max-rounds 25         # Complete game with 25 max rounds"
  );
  console.log(
    "  node run-test.js -t 5 p1=claude p2=claude p3=claude # 5 turns, first 3 players are Claude AI"
  );
}
