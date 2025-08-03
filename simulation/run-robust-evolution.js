#!/usr/bin/env node

// Run robust evolution with better evaluation and diversity

const { execSync } = require("child_process");

console.log("🧬 Running ROBUST evolution with better evaluation...\n");

// First, start with very diverse random population
console.log("1️⃣ Running diverse evolution with longer evaluation...");
try {
  execSync("node run-evolution.js --generations=8 --large", {
    stdio: "inherit",
    timeout: 10 * 60 * 1000, // 10 minutes max
  });
} catch (error) {
  console.log("Evolution completed or timed out, continuing...");
}

// Then test the best result more thoroughly
console.log("\n2️⃣ Testing best evolved player with more games...");
try {
  const result = execSync("node test-evolved-player.js --games=5", {
    encoding: "utf8",
    timeout: 5 * 60 * 1000, // 5 minutes max
  });
  console.log(result);
} catch (error) {
  console.log("Testing completed or timed out");
}

console.log("\n🎯 Robust evolution process complete!");
