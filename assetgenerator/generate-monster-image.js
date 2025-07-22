#!/usr/bin/env node

import { Anthropic } from "@anthropic-ai/sdk";
import { config } from "dotenv";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import OpenAI from "openai";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

const OPENAI_MODEL = "gpt-image-1";
const SIZE = "1024x1024"; // Landscape format for monsters
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-0";
const MAX_MONSTERS = 30; // For testing purposes

class MonsterImageGenerator {
  constructor() {
    // Check for required API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey) {
      console.error("❌ Error: OPENAI_API_KEY not found in .env file");
      process.exit(1);
    }

    if (!anthropicKey) {
      console.error("❌ Error: ANTHROPIC_API_KEY not found in .env file");
      process.exit(1);
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
    this.anthropic = new Anthropic({ apiKey: anthropicKey });

    // Load the image style template
    try {
      this.imageStyleTemplate = readFileSync(
        join(__dirname, "image-style.md"),
        "utf-8"
      );
    } catch (error) {
      console.error("❌ Error: Could not read image-style.md file");
      process.exit(1);
    }
  }

  // Helper function to convert monster name to filename
  monsterNameToFilename(monsterName) {
    return monsterName.toLowerCase().replace(/\s+/g, "-") + ".png";
  }

  // Load all monsters from monsterCards.ts
  loadMonstersFromFile() {
    try {
      const monsterCardsPath = join(
        __dirname,
        "..",
        "simulation",
        "src",
        "lib",
        "content",
        "monsterCards.ts"
      );
      const fileContent = readFileSync(monsterCardsPath, "utf-8");

      // Extract monster names using regex to find the MONSTERS array
      const monstersMatch = fileContent.match(
        /export const MONSTERS: Monster\[\] = \[([\s\S]*?)\];/
      );
      if (!monstersMatch) {
        throw new Error("Could not find MONSTERS array in monsterCards.ts");
      }

      // Extract monster names from the array
      const monstersArrayContent = monstersMatch[1];
      const nameMatches = monstersArrayContent.match(/name: '([^']+)'/g);

      if (!nameMatches) {
        throw new Error("Could not extract monster names from MONSTERS array");
      }

      const monsterNames = nameMatches.map((match) =>
        match.replace(/name: '([^']+)'/, "$1")
      );
      return monsterNames;
    } catch (error) {
      console.error(
        "❌ Error loading monsters from monsterCards.ts:",
        error.message
      );
      throw error;
    }
  }

  // Get existing monster images
  getExistingMonsterImages() {
    const monstersDir = join(
      __dirname,
      "..",
      "simulation",
      "public",
      "monsters"
    );

    if (!existsSync(monstersDir)) {
      return [];
    }

    try {
      const files = readdirSync(monstersDir);
      return files
        .filter((file) => file.endsWith(".png"))
        .map((file) => file.replace(".png", ""));
    } catch (error) {
      console.error("❌ Error reading monsters directory:", error.message);
      return [];
    }
  }

  // Find missing monster images
  findMissingMonsters() {
    const allMonsters = this.loadMonstersFromFile();
    const existingImages = this.getExistingMonsterImages();

    // Convert existing image names back to monster names for comparison
    const existingMonsterNames = existingImages.map((filename) => {
      // Convert filename back to monster name format
      return filename
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });

    const missingMonsters = allMonsters.filter((monster) => {
      const expectedFilename = this.monsterNameToFilename(monster).replace(
        ".png",
        ""
      );
      return !existingImages.includes(expectedFilename);
    });

    return missingMonsters;
  }

  async generatePromptWithClaude(monsterName) {
    const systemPrompt = `You are an expert at creating detailed image prompts for board game illustrations. 

Given a monster name and an image style template, create a specific, detailed image prompt that:
1. Replaces the placeholder in the template with monster-specific content
2. Maintains the hand-drawn cartoon style described
3. Makes the monster the central focus while keeping it appropriate for a board game tile
4. Ensures the monster fits the whimsical, storybook aesthetic

Focus on visual details like the monster's appearance, pose, environment, and how it interacts with the scene.`;

    const userMessage = `Monster name: "${monsterName}"

Image style template:
${this.imageStyleTemplate}

Please create a specific image prompt by replacing the "[insert main subject: ...]" placeholder with detailed monster content. Make the monster the clear focus while maintaining the described art style. Return only the final image prompt, no explanations.`;

    try {
      const response = await this.anthropic.messages.create({
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const prompt = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      return prompt.trim();
    } catch (error) {
      console.error("❌ Failed to generate prompt with Claude:", error.message);
      throw error;
    }
  }

  async generateImage(prompt, monsterName) {
    try {
      console.log(`🎨 Generating image for "${monsterName}"...`);

      const response = await this.openai.images.generate({
        model: OPENAI_MODEL,
        prompt: prompt,
        size: SIZE,
        quality: "medium",
      });

      const imageData = response.data[0];

      if (!imageData.b64_json) {
        throw new Error("No image data received from OpenAI");
      }

      // Use the standardized naming format
      const filename = this.monsterNameToFilename(monsterName);
      const filepath = join(
        __dirname,
        "..",
        "simulation",
        "public",
        "monsters",
        filename
      );

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageData.b64_json, "base64");
      writeFileSync(filepath, imageBuffer);

      console.log(`✅ "${monsterName}" image saved to: ${filename}`);

      return filepath;
    } catch (error) {
      console.error(
        `❌ Failed to generate image for "${monsterName}":`,
        error.message
      );
      throw error;
    }
  }

  async generate(monsterName) {
    try {
      console.log(`🐉 Generating image for monster: "${monsterName}"`);

      // Step 1: Generate specific prompt with Claude
      console.log("🤖 Creating detailed prompt with Claude...");
      const detailedPrompt = await this.generatePromptWithClaude(monsterName);

      console.log("\n📝 Generated prompt:");
      console.log("─".repeat(60));
      console.log(detailedPrompt);
      console.log("─".repeat(60));

      // Step 2: Generate image with OpenAI
      const imagePath = await this.generateImage(detailedPrompt, monsterName);

      return imagePath;
    } catch (error) {
      console.error("❌ Monster image generation failed:", error.message);
      throw error;
    }
  }

  async generateAll() {
    try {
      console.log("🔍 Finding missing monster images...");

      const missingMonsters = this.findMissingMonsters();

      if (missingMonsters.length === 0) {
        console.log("✅ All monster images already exist!");
        return;
      }

      console.log(`📋 Found ${missingMonsters.length} missing monsters:`);
      missingMonsters.forEach((monster) => console.log(`  - ${monster}`));

      // Apply MAX_MONSTERS limit for testing
      const monstersToGenerate = missingMonsters.slice(0, MAX_MONSTERS);

      if (monstersToGenerate.length < missingMonsters.length) {
        console.log(
          `⚠️  Limited to ${MAX_MONSTERS} monsters for testing (MAX_MONSTERS = ${MAX_MONSTERS})`
        );
        console.log("📝 Generating images for:");
        monstersToGenerate.forEach((monster) => console.log(`  - ${monster}`));
      }

      // Step 1: Generate all prompts in parallel
      console.log(
        `\n🤖 Generating ${monstersToGenerate.length} prompts in parallel...`
      );

      const promptPromises = monstersToGenerate.map(async (monsterName) => {
        try {
          console.log(`🤖 Creating prompt for "${monsterName}"...`);
          const prompt = await this.generatePromptWithClaude(monsterName);
          return { monster: monsterName, prompt, success: true };
        } catch (error) {
          console.error(
            `❌ Failed to generate prompt for ${monsterName}:`,
            error.message
          );
          return { monster: monsterName, success: false, error: error.message };
        }
      });

      const promptResults = await Promise.all(promptPromises);

      // Filter out failed prompts
      const successfulPrompts = promptResults.filter((r) => r.success);
      const failedPrompts = promptResults.filter((r) => !r.success);

      if (failedPrompts.length > 0) {
        console.log(`⚠️  ${failedPrompts.length} prompts failed to generate:`);
        failedPrompts.forEach((r) =>
          console.log(`  - ${r.monster}: ${r.error}`)
        );
      }

      if (successfulPrompts.length === 0) {
        console.log(
          "❌ No prompts were successfully generated. Aborting image generation."
        );
        return;
      }

      // Show generated prompts
      console.log(`\n📝 Generated prompts:`);
      successfulPrompts.forEach(({ monster, prompt }) => {
        console.log(`\n🐉 ${monster}:`);
        console.log("─".repeat(60));
        console.log(prompt);
        console.log("─".repeat(60));
      });

      // Step 2: Generate all images in parallel using the prompts
      console.log(
        `\n🎨 Generating ${successfulPrompts.length} images in parallel...`
      );

      const imagePromises = successfulPrompts.map(
        async ({ monster, prompt }) => {
          try {
            await this.generateImage(prompt, monster);
            return { monster, success: true };
          } catch (error) {
            console.error(
              `❌ Failed to generate image for ${monster}:`,
              error.message
            );
            return { monster, success: false, error: error.message };
          }
        }
      );

      const imageResults = await Promise.all(imagePromises);

      // Report final results
      const successful = imageResults.filter((r) => r.success);
      const failed = [
        ...failedPrompts,
        ...imageResults.filter((r) => !r.success),
      ];

      console.log("\n📊 Generation Results:");
      console.log(`✅ Successful: ${successful.length}`);
      successful.forEach((r) => console.log(`  - ${r.monster}`));

      if (failed.length > 0) {
        console.log(`❌ Failed: ${failed.length}`);
        failed.forEach((r) => console.log(`  - ${r.monster}: ${r.error}`));
      }
    } catch (error) {
      console.error("❌ Batch generation failed:", error.message);
      throw error;
    }
  }
}

// CLI Interface
function showUsage() {
  console.log(`
🐉 Doomspire Monster Image Generator

Usage:
  node generate-monster-image.js "Monster Name"     # Generate single monster
  node generate-monster-image.js --all              # Generate all missing monsters

Examples:
  node generate-monster-image.js "Fire Dragon"
  node generate-monster-image.js "Shadow Wolf"
  node generate-monster-image.js --all

The --all option will:
1. Load all monsters from simulation/src/lib/content/monsterCards.ts
2. Check existing images in simulation/public/monsters/
3. Generate missing monster images in parallel (limited by MAX_MONSTERS = ${MAX_MONSTERS})
4. Save images with format: <monster-name>.png

Requirements:
- OPENAI_API_KEY and ANTHROPIC_API_KEY in .env file
- image-style.md file in the same directory
    `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showUsage();
    return;
  }

  const generator = new MonsterImageGenerator();

  // Check for --all parameter
  if (args.includes("--all")) {
    try {
      await generator.generateAll();
    } catch (error) {
      console.error("❌ Batch generation failed:", error.message);
      process.exit(1);
    }
    return;
  }

  // Single monster generation
  const monsterName = args[0];

  if (!monsterName) {
    console.error("❌ Error: Please provide a monster name or use --all");
    showUsage();
    process.exit(1);
  }

  try {
    await generator.generate(monsterName);
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
    process.exit(1);
  }
}

// Run the CLI
main().catch(console.error);
