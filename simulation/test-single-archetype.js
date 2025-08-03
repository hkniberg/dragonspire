#!/usr/bin/env node

// Debug a single archetype in detail

const fs = require("fs");

const testGenome = {
  combatRiskTolerance: 0.5,
  economicFocus: 0.8,
  territorialAggression: 0.6,
  explorationAggression: 0.3,
  famePathWeight: 0.2,
  goldPathWeight: 0.5,
  territorialPathWeight: 0.2,
  combatPathWeight: 0.1,
  defensivePosture: 0.7,
  dragonTimingAggression: 0.4,
  safetyMarginPreference: 0.6,
};

// Create test genome file
const genomeData = {
  timestamp: new Date().toISOString(),
  fitness: 0,
  gamesPlayed: 0,
  winRate: 0,
  averagePlacement: 0,
  genome: testGenome,
};

const filename = "debug-genome.json";
fs.writeFileSync(`best-genomes/${filename}`, JSON.stringify(genomeData, null, 2));

console.log("🐛 Running detailed debug of evolutionary player...\n");

try {
  const { execSync } = require("child_process");
  const result = execSync(
    `node run-test.js --single-turn --p1 evolved:${filename} --p2 random --p3 random --p4 random`,
    { encoding: "utf8" },
  );

  console.log("FULL OUTPUT:");
  console.log("=".repeat(80));
  console.log(result);
} catch (error) {
  console.log("ERROR OCCURRED:");
  console.log(error.message);
  if (error.stdout) {
    console.log("\nSTDOUT:");
    console.log(error.stdout);
  }
  if (error.stderr) {
    console.log("\nSTDERR:");
    console.log(error.stderr);
  }
} finally {
  // Clean up
  fs.unlinkSync(`best-genomes/${filename}`);
}
