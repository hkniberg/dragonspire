#!/usr/bin/env node

// Create a diverse seed population to avoid local optima

const fs = require("fs");

// Strategic archetypes based on our analysis
const strategicSeeds = {
  "economic-powerhouse": {
    combatRiskTolerance: 0.4,
    economicFocus: 0.9,
    territorialAggression: 0.8,
    explorationAggression: 0.2,
    famePathWeight: 0.1,
    goldPathWeight: 0.7,
    territorialPathWeight: 0.15,
    combatPathWeight: 0.05,
    defensivePosture: 0.7,
    dragonTimingAggression: 0.6, // More aggressive timing
    safetyMarginPreference: 0.3, // Lower safety margin
  },

  "adaptive-trader": {
    combatRiskTolerance: 0.5,
    economicFocus: 0.7,
    territorialAggression: 0.6,
    explorationAggression: 0.4,
    famePathWeight: 0.2,
    goldPathWeight: 0.5,
    territorialPathWeight: 0.2,
    combatPathWeight: 0.1,
    defensivePosture: 0.5,
    dragonTimingAggression: 0.7, // Aggressive endgame
    safetyMarginPreference: 0.4,
  },

  "exploration-specialist": {
    combatRiskTolerance: 0.6,
    economicFocus: 0.4,
    territorialAggression: 0.3,
    explorationAggression: 0.8,
    famePathWeight: 0.6,
    goldPathWeight: 0.1,
    territorialPathWeight: 0.2,
    combatPathWeight: 0.1,
    defensivePosture: 0.3,
    dragonTimingAggression: 0.8, // Very aggressive
    safetyMarginPreference: 0.2,
  },

  "territorial-expander": {
    combatRiskTolerance: 0.5,
    economicFocus: 0.6,
    territorialAggression: 0.9,
    explorationAggression: 0.3,
    famePathWeight: 0.1,
    goldPathWeight: 0.2,
    territorialPathWeight: 0.6,
    combatPathWeight: 0.1,
    defensivePosture: 0.6,
    dragonTimingAggression: 0.5,
    safetyMarginPreference: 0.6,
  },

  "combat-opportunist": {
    combatRiskTolerance: 0.7,
    economicFocus: 0.3,
    territorialAggression: 0.7,
    explorationAggression: 0.6,
    famePathWeight: 0.3,
    goldPathWeight: 0.1,
    territorialPathWeight: 0.1,
    combatPathWeight: 0.5,
    defensivePosture: 0.3,
    dragonTimingAggression: 0.8,
    safetyMarginPreference: 0.3,
  },

  "balanced-adaptive": {
    combatRiskTolerance: 0.5,
    economicFocus: 0.5,
    territorialAggression: 0.5,
    explorationAggression: 0.5,
    famePathWeight: 0.25,
    goldPathWeight: 0.25,
    territorialPathWeight: 0.25,
    combatPathWeight: 0.25,
    defensivePosture: 0.5,
    dragonTimingAggression: 0.6, // Slightly aggressive timing
    safetyMarginPreference: 0.4,
  },
};

// Generate additional random variations
function generateRandomVariation(baseGenome, variation = 0.1) {
  const varied = { ...baseGenome };

  Object.keys(varied).forEach((key) => {
    if (Math.random() < 0.5) {
      // 50% chance to vary each parameter
      const change = (Math.random() - 0.5) * variation * 2; // ±variation
      varied[key] = Math.max(0, Math.min(1, varied[key] + change));
    }
  });

  // Renormalize victory path weights
  const totalWeight =
    varied.famePathWeight + varied.goldPathWeight + varied.territorialPathWeight + varied.combatPathWeight;
  if (totalWeight > 0) {
    varied.famePathWeight /= totalWeight;
    varied.goldPathWeight /= totalWeight;
    varied.territorialPathWeight /= totalWeight;
    varied.combatPathWeight /= totalWeight;
  }

  return varied;
}

console.log("🌱 Creating diverse seed population...\n");

const seedPopulation = [];

// Add base archetypes
Object.entries(strategicSeeds).forEach(([name, genome]) => {
  seedPopulation.push({
    name,
    genome,
    source: "archetype",
  });
  console.log(`✅ Added ${name} archetype`);
});

// Add variations of each archetype
Object.entries(strategicSeeds).forEach(([name, genome]) => {
  for (let i = 1; i <= 3; i++) {
    const variation = generateRandomVariation(genome, 0.15);
    seedPopulation.push({
      name: `${name}-var${i}`,
      genome: variation,
      source: "variation",
    });
  }
  console.log(`✅ Added 3 variations of ${name}`);
});

// Add some completely random genomes
for (let i = 1; i <= 10; i++) {
  const pathWeights = [Math.random(), Math.random(), Math.random(), Math.random()];
  const sum = pathWeights.reduce((a, b) => a + b, 0);
  const normalizedWeights = pathWeights.map((w) => w / sum);

  const randomGenome = {
    combatRiskTolerance: 0.2 + Math.random() * 0.6,
    economicFocus: Math.random(),
    territorialAggression: Math.random(),
    explorationAggression: Math.random(),
    famePathWeight: normalizedWeights[0],
    goldPathWeight: normalizedWeights[1],
    territorialPathWeight: normalizedWeights[2],
    combatPathWeight: normalizedWeights[3],
    defensivePosture: Math.random(),
    dragonTimingAggression: Math.random(),
    safetyMarginPreference: Math.random(),
  };

  seedPopulation.push({
    name: `random-${i}`,
    genome: randomGenome,
    source: "random",
  });
}
console.log(`✅ Added 10 random genomes`);

// Save seed population
const seedData = {
  timestamp: new Date().toISOString(),
  population: seedPopulation,
  totalSize: seedPopulation.length,
};

const filename = `seed-population-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
fs.writeFileSync(filename, JSON.stringify(seedData, null, 2));

console.log(`\n🎯 Created diverse seed population: ${seedPopulation.length} genomes`);
console.log(`📁 Saved to: ${filename}`);
console.log("\nArchetype distribution:");
console.log(`  - Strategic archetypes: 6`);
console.log(`  - Archetype variations: 18`);
console.log(`  - Random genomes: 10`);
console.log(`  - Total: ${seedPopulation.length}`);

console.log("\n💡 Use this with evolution: node run-evolution.js --load=" + filename);
