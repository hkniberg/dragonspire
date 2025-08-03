#!/usr/bin/env node

// Test diverse genome archetypes to avoid local optima

const genomeArchetypes = {
  "economic-specialist": {
    combatRiskTolerance: 0.2, // Very risk-averse
    economicFocus: 0.9, // Almost pure economic focus
    territorialAggression: 0.7, // Still want tiles
    explorationAggression: 0.3, // Low risk exploration
    famePathWeight: 0.1, // Minimal fame focus
    goldPathWeight: 0.6, // Gold victory path
    territorialPathWeight: 0.25, // Some territorial
    combatPathWeight: 0.05, // Avoid combat
    defensivePosture: 0.8, // Very defensive
    dragonTimingAggression: 0.3, // Wait for good conditions
    safetyMarginPreference: 0.8, // Want big safety margins
  },

  "combat-aggressive": {
    combatRiskTolerance: 0.8, // High risk tolerance
    economicFocus: 0.3, // Some economic base
    territorialAggression: 0.8, // Very aggressive
    explorationAggression: 0.7, // Risk-taking exploration
    famePathWeight: 0.2, // Some fame
    goldPathWeight: 0.1, // Minimal gold
    territorialPathWeight: 0.2, // Some territory
    combatPathWeight: 0.5, // Combat victory focus
    defensivePosture: 0.2, // Very aggressive
    dragonTimingAggression: 0.8, // Go early and often
    safetyMarginPreference: 0.2, // Low safety margins
  },

  "territorial-expander": {
    combatRiskTolerance: 0.5, // Moderate combat
    economicFocus: 0.6, // Strong economic base
    territorialAggression: 0.9, // Maximum territorial focus
    explorationAggression: 0.4, // Moderate exploration
    famePathWeight: 0.1, // Minimal fame
    goldPathWeight: 0.2, // Some gold
    territorialPathWeight: 0.6, // Territorial victory
    combatPathWeight: 0.1, // Minimal combat focus
    defensivePosture: 0.6, // Somewhat defensive
    dragonTimingAggression: 0.4, // Moderate timing
    safetyMarginPreference: 0.7, // Want safety
  },

  "explorer-fame": {
    combatRiskTolerance: 0.6, // Willing to fight for fame
    economicFocus: 0.4, // Moderate economics
    territorialAggression: 0.3, // Low territorial focus
    explorationAggression: 0.9, // Maximum exploration
    famePathWeight: 0.7, // Fame victory focus
    goldPathWeight: 0.1, // Minimal gold
    territorialPathWeight: 0.1, // Minimal territory
    combatPathWeight: 0.1, // Minimal combat
    defensivePosture: 0.3, // Aggressive exploration
    dragonTimingAggression: 0.6, // Moderate timing
    safetyMarginPreference: 0.4, // Moderate safety
  },

  "balanced-generalist": {
    combatRiskTolerance: 0.5, // Moderate in all
    economicFocus: 0.5,
    territorialAggression: 0.5,
    explorationAggression: 0.5,
    famePathWeight: 0.25, // Equal focus on all paths
    goldPathWeight: 0.25,
    territorialPathWeight: 0.25,
    combatPathWeight: 0.25,
    defensivePosture: 0.5,
    dragonTimingAggression: 0.5,
    safetyMarginPreference: 0.5,
  },
};

async function testArchetype(name, genome, games = 3) {
  console.log(`\n🧬 Testing ${name} archetype (${games} games):`);

  // Create temporary genome file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `test-${name}-${timestamp}.json`;

  const genomeData = {
    timestamp: new Date().toISOString(),
    fitness: 0,
    gamesPlayed: 0,
    winRate: 0,
    averagePlacement: 0,
    genome: genome,
  };

  require("fs").writeFileSync(`best-genomes/${filename}`, JSON.stringify(genomeData, null, 2));

  let totalPlacement = 0;
  let wins = 0;

  for (let i = 1; i <= games; i++) {
    console.log(`  Game ${i}/${games}...`);

    try {
      const { execSync } = require("child_process");
      const result = execSync(
        `node run-test.js --turns 15 --p1 evolved:${filename} --p2 random --p3 random --p4 random --gold 3 --food 1 --wood 1 --ore 1`,
        { encoding: "utf8", timeout: 60000 },
      );

      // Parse placement from output
      const placementMatch =
        result.match(/Alice.*?placement.*?(\d+)/i) ||
        result.match(/Final.*?Alice.*?(\d+)/i) ||
        result.match(/Alice.*?(\d+)(?:st|nd|rd|th)/i);

      let placement = 4; // Default to worst
      if (placementMatch) {
        placement = parseInt(placementMatch[1]);
      } else if (result.includes("Alice") && result.includes("win")) {
        placement = 1;
        wins++;
      }

      totalPlacement += placement;
      console.log(
        `    Result: ${placement}${placement === 1 ? "st (WIN!)" : placement === 2 ? "nd" : placement === 3 ? "rd" : "th"}`,
      );
    } catch (error) {
      console.log(`    Result: 4th (error/timeout)`);
      totalPlacement += 4;
    }
  }

  const avgPlacement = totalPlacement / games;
  const winRate = wins / games;

  console.log(`📊 ${name} Results: ${winRate * 100}% wins, ${avgPlacement.toFixed(1)} avg placement`);

  // Clean up temporary file
  require("fs").unlinkSync(`best-genomes/${filename}`);

  return { winRate, avgPlacement, wins, totalPlacement };
}

async function main() {
  console.log("🔬 Testing diverse genome archetypes to explore strategy space...\n");
  console.log("Each archetype will play 3 games vs random opponents\n");

  const results = {};

  for (const [name, genome] of Object.entries(genomeArchetypes)) {
    results[name] = await testArchetype(name, genome, 3);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 ARCHETYPE COMPARISON:");
  console.log("=".repeat(60));

  // Sort by performance
  const sorted = Object.entries(results).sort((a, b) => {
    const aScore = a[1].winRate * 10 + (5 - a[1].avgPlacement);
    const bScore = b[1].winRate * 10 + (5 - b[1].avgPlacement);
    return bScore - aScore;
  });

  sorted.forEach(([name, result], index) => {
    const score = result.winRate * 10 + (5 - result.avgPlacement);
    console.log(
      `${index + 1}. ${name.padEnd(20)} | ${(result.winRate * 100).toFixed(0)}% wins | ${result.avgPlacement.toFixed(1)} avg | Score: ${score.toFixed(1)}`,
    );
  });

  console.log("\n🎯 Best performing archetype can be used to seed evolution with better starting points!");
}

main().catch(console.error);
