#!/usr/bin/env tsx

// Lords of Doomspire Evolution Runner (TypeScript version)
// Runs evolutionary AI training with save/load functionality

import { EvolutionManager } from "./src/players/EvolutionManager";

interface EvolutionArgs {
  populationSize: number;
  gamesPerGeneration: number;
  maxGenerations: number;
  loadFromFile?: string;
}

function parseArgs(): EvolutionArgs {
  const args = process.argv.slice(2);

  return {
    populationSize: parseInt(args.find(arg => arg.startsWith("--populationSize="))?.split("=")[1] || "20"),
    gamesPerGeneration: parseInt(args.find(arg => arg.startsWith("--gamesPerGeneration="))?.split("=")[1] || "25"),
    maxGenerations: parseInt(args.find(arg => arg.startsWith("--maxGenerations="))?.split("=")[1] || "10"),
    loadFromFile: args.find(arg => arg.startsWith("--load="))?.split("=")[1],
  };
}

async function runSingleGame(manager: EvolutionManager, gameNumber: number): Promise<void> {
  try {
    await manager.runGame(gameNumber);
  } catch (error) {
    console.error(`\nError in game ${gameNumber}:`, error);
  }
}

async function runEvolution(): Promise<void> {
  console.log("🧬 Starting Lords of Doomspire Evolution...\n");

  const { populationSize, gamesPerGeneration, maxGenerations, loadFromFile } = parseArgs();

  console.log(`Population Size: ${populationSize}`);
  console.log(`Games per Generation: ${gamesPerGeneration}`);
  console.log(`Max Generations: ${maxGenerations}`);
  if (loadFromFile) {
    console.log(`Loading from: ${loadFromFile}`);
  }
  console.log();

  let manager: EvolutionManager;
  if (loadFromFile) {
    try {
      manager = await EvolutionManager.loadEvolutionResults(loadFromFile);
    } catch (error) {
      console.error(`❌ Failed to load evolution file ${loadFromFile}:`, (error as Error).message);
      console.log("🆕 Starting with fresh population instead...");
      manager = new EvolutionManager(populationSize, 0.15, 0.2);
    }
  } else {
    manager = new EvolutionManager(populationSize, 0.15, 0.2);
  }

  for (let generation = 0; generation < maxGenerations; generation++) {
    console.log(`\n=== Generation ${generation + 1} ===`);

    // Run games for this generation
    const startTime = Date.now();
    const gamePromises: Promise<void>[] = [];

    for (let game = 0; game < gamesPerGeneration; game++) {
      gamePromises.push(runSingleGame(manager, generation * gamesPerGeneration + game));
    }

    // Run games in parallel (but limit concurrency to avoid overwhelming the system)
    const batchSize = 4;
    for (let i = 0; i < gamePromises.length; i += batchSize) {
      const batch = gamePromises.slice(i, i + batchSize);
      await Promise.all(batch);

      // Progress indicator
      const completed = Math.min(i + batchSize, gamePromises.length);
      process.stdout.write(`\rGames completed: ${completed}/${gamesPerGeneration}`);
    }

    const gameTime = Date.now() - startTime;
    console.log(`\nGames completed in ${(gameTime / 1000).toFixed(1)}s`);

    // Get statistics
    const stats = manager.getStats();
    console.log(`Best Fitness: ${stats.bestFitness.toFixed(2)}`);
    console.log(`Average Fitness: ${stats.averageFitness.toFixed(2)}`);
    console.log(`Population Diversity: ${stats.populationDiversity.toFixed(3)}`);

    // Show best performers
    const best = manager.getBestGenomes(3);
    console.log("\nTop 3 Genomes:");
    best.forEach((perf, index) => {
      console.log(
        `${index + 1}. Fitness: ${perf.fitness.toFixed(2)}, ` +
        `Win Rate: ${((perf.wins / perf.gamesPlayed) * 100).toFixed(1)}%, ` +
        `Avg Placement: ${perf.averagePlacement.toFixed(2)}`,
      );

      // Show genome characteristics
      const g = perf.genome;
      console.log(
        `   Combat: ${g.combatRiskTolerance.toFixed(2)}, ` +
        `Economic: ${g.economicFocus.toFixed(2)}, ` +
        `Territorial: ${g.territorialAggression.toFixed(2)}, ` +
        `Exploration: ${g.explorationAggression.toFixed(2)}`,
      );
      console.log(
        `   Victory Focus - Fame: ${g.famePathWeight.toFixed(2)}, ` +
        `Gold: ${g.goldPathWeight.toFixed(2)}, ` +
        `Territorial: ${g.territorialPathWeight.toFixed(2)}, ` +
        `Combat: ${g.combatPathWeight.toFixed(2)}`,
      );
      console.log(
        `   Dragon Timing: ${g.dragonTimingAggression.toFixed(2)}, ` +
        `Safety Margin: ${g.safetyMarginPreference.toFixed(2)}, ` +
        `Defensive: ${g.defensivePosture.toFixed(2)}`,
      );
    });

    // Evolve population for next generation
    if (generation < maxGenerations - 1) {
      console.log("\n🧬 Evolving population...");
      manager.evolvePopulation();
    }
  }

  console.log("\n✅ Evolution complete!");

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFilename = `evolution-${timestamp}.json`;
  const genomeFilename = `best-genome-${timestamp}.json`;

  try {
    await manager.saveEvolutionResults(resultsFilename);
    await manager.saveBestGenome(genomeFilename);

    console.log("\n🏆 Final best genome:");
    const finalBest = manager.getBestGenomes(1)[0];
    if (finalBest) {
      console.log(`  Fitness: ${finalBest.fitness.toFixed(2)}`);
      console.log(`  Win Rate: ${(finalBest.wins / finalBest.gamesPlayed * 100).toFixed(1)}%`);
      console.log(`  Games Played: ${finalBest.gamesPlayed}`);
      console.log(`  Average Placement: ${finalBest.averagePlacement.toFixed(2)}`);
      console.log("\n📄 Use this genome in your games:");
      console.log(`  npx tsx src/cli/CLIRunner.ts p1=evolved:${genomeFilename} p2=random p3=claude`);
      console.log(`  node test-evolved-player.js ${genomeFilename} --opponent=claude`);
    }
  } catch (error) {
    console.error("\n❌ Failed to save results:", error);
  }
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
runEvolution().catch((error) => {
  console.error("\n💥 Evolution failed:", error);
  process.exit(1);
});