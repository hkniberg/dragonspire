#!/usr/bin/env node

import { Anthropic } from "@anthropic-ai/sdk";
import { config } from "dotenv";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import OpenAI from "openai";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

const OPENAI_MODEL = "gpt-image-1";
const SIZE = "1024x1024"; // Square format for trader item cards
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-0";
const MAX_TRADER_ITEMS = 30; // For testing purposes

class TraderItemImageGenerator {
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

    // Load the trader item prompt template (fallback to treasure template if not found)
    try {
      this.traderItemPromptTemplate = readFileSync(
        join(__dirname, "prompts", "traderItem-prompt-template.md"),
        "utf-8"
      );
    } catch (error) {
      console.warn(
        "⚠️  traderItem-prompt-template.md not found, using treasure template as fallback"
      );
      try {
        this.traderItemPromptTemplate = readFileSync(
          join(__dirname, "prompts", "treasure-prompt-template.md"),
          "utf-8"
        );
      } catch (fallbackError) {
        console.error(
          "❌ Error: Could not read treasure-prompt-template.md file either"
        );
        process.exit(1);
      }
    }

    // Load the visual style template
    try {
      this.visualStyleTemplate = readFileSync(
        join(__dirname, "prompts", "visual-style.md"),
        "utf-8"
      );
    } catch (error) {
      console.error("❌ Error: Could not read visual-style.md file");
      process.exit(1);
    }
  }

  // Helper function to convert trader item name to filename
  traderItemNameToFilename(traderItemName) {
    return traderItemName.toLowerCase().replace(/\s+/g, "-") + ".png";
  }

  // Load all trader items from traderItems.ts
  loadTraderItemsFromFile() {
    try {
      const traderItemsPath = join(
        __dirname,
        "..",
        "simulation",
        "src",
        "content",
        "traderItems.ts"
      );
      const fileContent = readFileSync(traderItemsPath, "utf-8");

      // Extract trader items using regex to find the TRADER_ITEMS array
      const traderItemsMatch = fileContent.match(
        /export const TRADER_ITEMS: TraderItem\[\] = \[([\s\S]*?)\];/
      );
      if (!traderItemsMatch) {
        throw new Error("Could not find TRADER_ITEMS array in traderItems.ts");
      }

      // Parse the trader items array content to extract trader item objects
      const traderItemsArrayContent = traderItemsMatch[1];

      // Extract individual trader item objects
      const traderItemMatches = traderItemsArrayContent.match(/\{[\s\S]*?\}/g);

      if (!traderItemMatches) {
        throw new Error(
          "Could not extract trader item objects from TRADER_ITEMS array"
        );
      }

      const traderItems = traderItemMatches
        .map((traderItemString) => {
          const idMatch = traderItemString.match(/id: ['"]([^'"]+)['"]/);
          const nameMatch = traderItemString.match(/name: ['"]([^'"]+)['"]/);
          const descriptionMatch = traderItemString.match(
            /description: ['"]([^'"]*(?:[^'"\\]|\\.[^'"]*)*)['"]/
          );
          const costMatch = traderItemString.match(/cost: (\d+)/);

          if (!idMatch || !nameMatch || !descriptionMatch || !costMatch) {
            console.warn("Could not parse trader item:", traderItemString);
            return null;
          }

          return {
            id: idMatch[1],
            name: nameMatch[1],
            description: descriptionMatch[1],
            cost: parseInt(costMatch[1]),
          };
        })
        .filter((traderItem) => traderItem !== null);

      return traderItems;
    } catch (error) {
      console.error(
        "❌ Error loading trader items from traderItems.ts:",
        error.message
      );
      throw error;
    }
  }

  // Get existing trader item images
  getExistingTraderItemImages() {
    const traderItemsDir = join(
      __dirname,
      "..",
      "simulation",
      "public",
      "traderItems"
    );

    if (!existsSync(traderItemsDir)) {
      return [];
    }

    try {
      const files = readdirSync(traderItemsDir);
      return files
        .filter((file) => file.endsWith(".png"))
        .map((file) => file.replace(".png", ""));
    } catch (error) {
      console.error("❌ Error reading traderItems directory:", error.message);
      return [];
    }
  }

  // Find missing trader item images
  findMissingTraderItems() {
    const allTraderItems = this.loadTraderItemsFromFile();
    const existingImages = this.getExistingTraderItemImages();

    const missingTraderItems = allTraderItems.filter((traderItem) => {
      const expectedFilename = this.traderItemNameToFilename(
        traderItem.name
      ).replace(".png", "");
      return !existingImages.includes(expectedFilename);
    });

    return missingTraderItems;
  }

  async generatePromptWithClaude(traderItem) {
    // Create card info section
    const cardInfo = `Name: ${traderItem.name}
Description: ${traderItem.description}
Cost: ${traderItem.cost} gold`;

    // Substitute placeholders in the template (using regex to handle any whitespace variations)
    let templatePrompt = this.traderItemPromptTemplate
      .replace(/\{\{\s*card-info\s*\}\}/g, cardInfo)
      .replace(/\{\{\s*visual-style\s*\}\}/g, this.visualStyleTemplate);

    try {
      const response = await this.anthropic.messages.create({
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: 5000,
        messages: [
          {
            role: "user",
            content: templatePrompt,
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

  async generateImage(prompt, traderItemName) {
    try {
      console.log(`🎨 Generating image for "${traderItemName}"...`);

      const finalPrompt =
        prompt + "\n\nIMPORTANT: Do not include any text in the image.";

      console.log("\n📝 Final prompt sent to OpenAI:");
      console.log("─".repeat(60));
      console.log(finalPrompt);
      console.log("─".repeat(60));

      const response = await this.openai.images.generate({
        model: OPENAI_MODEL,
        prompt: finalPrompt,
        size: SIZE,
        quality: "medium",
      });

      const imageData = response.data[0];

      if (!imageData.b64_json) {
        throw new Error("No image data received from OpenAI");
      }

      // Ensure traderItems directory exists
      const traderItemsDir = join(
        __dirname,
        "..",
        "simulation",
        "public",
        "traderItems"
      );

      if (!existsSync(traderItemsDir)) {
        mkdirSync(traderItemsDir, { recursive: true });
      }

      // Use the standardized naming format
      const filename = this.traderItemNameToFilename(traderItemName);
      const filepath = join(traderItemsDir, filename);

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageData.b64_json, "base64");
      writeFileSync(filepath, imageBuffer);

      console.log(`✅ "${traderItemName}" image saved to: ${filename}`);

      return filepath;
    } catch (error) {
      console.error(
        `❌ Failed to generate image for "${traderItemName}":`,
        error.message
      );
      throw error;
    }
  }

  async generate(traderItemName) {
    try {
      console.log(`🛒 Generating image for trader item: "${traderItemName}"`);

      // Find the trader item by name
      const allTraderItems = this.loadTraderItemsFromFile();
      const traderItem = allTraderItems.find(
        (t) => t.name.toLowerCase() === traderItemName.toLowerCase()
      );

      if (!traderItem) {
        throw new Error(
          `Trader item "${traderItemName}" not found in traderItems.ts`
        );
      }

      // Step 1: Generate specific prompt with Claude
      console.log("🤖 Creating detailed prompt with Claude...");
      const detailedPrompt = await this.generatePromptWithClaude(traderItem);

      console.log("\n📝 Generated prompt:");
      console.log("─".repeat(60));
      console.log(detailedPrompt);
      console.log("─".repeat(60));

      // Step 2: Generate image with OpenAI
      const imagePath = await this.generateImage(
        detailedPrompt,
        traderItem.name
      );

      return imagePath;
    } catch (error) {
      console.error("❌ Trader item image generation failed:", error.message);
      throw error;
    }
  }

  async generateAll() {
    try {
      console.log("🔍 Finding missing trader item images...");

      const missingTraderItems = this.findMissingTraderItems();

      if (missingTraderItems.length === 0) {
        console.log("✅ All trader item images already exist!");
        return;
      }

      console.log(
        `📋 Found ${missingTraderItems.length} missing trader items:`
      );
      missingTraderItems.forEach((traderItem) =>
        console.log(`  - ${traderItem.name} (${traderItem.cost} gold)`)
      );

      // Apply MAX_TRADER_ITEMS limit for testing
      const traderItemsToGenerate = missingTraderItems.slice(
        0,
        MAX_TRADER_ITEMS
      );

      if (traderItemsToGenerate.length < missingTraderItems.length) {
        console.log(
          `⚠️  Limited to ${MAX_TRADER_ITEMS} trader items for testing (MAX_TRADER_ITEMS = ${MAX_TRADER_ITEMS})`
        );
        console.log("📝 Generating images for:");
        traderItemsToGenerate.forEach((traderItem) =>
          console.log(`  - ${traderItem.name} (${traderItem.cost} gold)`)
        );
      }

      // Step 1: Generate all prompts in parallel
      console.log(
        `\n🤖 Generating ${traderItemsToGenerate.length} prompts in parallel...`
      );

      const promptPromises = traderItemsToGenerate.map(async (traderItem) => {
        try {
          console.log(`🤖 Creating prompt for "${traderItem.name}"...`);
          const prompt = await this.generatePromptWithClaude(traderItem);
          return { traderItem: traderItem.name, prompt, success: true };
        } catch (error) {
          console.error(
            `❌ Failed to generate prompt for ${traderItem.name}:`,
            error.message
          );
          return {
            traderItem: traderItem.name,
            success: false,
            error: error.message,
          };
        }
      });

      const promptResults = await Promise.all(promptPromises);

      // Filter out failed prompts
      const successfulPrompts = promptResults.filter((r) => r.success);
      const failedPrompts = promptResults.filter((r) => !r.success);

      if (failedPrompts.length > 0) {
        console.log(`⚠️  ${failedPrompts.length} prompts failed to generate:`);
        failedPrompts.forEach((r) =>
          console.log(`  - ${r.traderItem}: ${r.error}`)
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
      successfulPrompts.forEach(({ traderItem, prompt }) => {
        console.log(`\n🛒 ${traderItem}:`);
        console.log("─".repeat(60));
        console.log(prompt);
        console.log("─".repeat(60));
      });

      // Step 2: Generate all images in parallel using the prompts
      console.log(
        `\n🎨 Generating ${successfulPrompts.length} images in parallel...`
      );

      const imagePromises = successfulPrompts.map(
        async ({ traderItem, prompt }) => {
          try {
            await this.generateImage(prompt, traderItem);
            return { traderItem, success: true };
          } catch (error) {
            console.error(
              `❌ Failed to generate image for ${traderItem}:`,
              error.message
            );
            return { traderItem, success: false, error: error.message };
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
      successful.forEach((r) => console.log(`  - ${r.traderItem}`));

      if (failed.length > 0) {
        console.log(`❌ Failed: ${failed.length}`);
        failed.forEach((r) => console.log(`  - ${r.traderItem}: ${r.error}`));
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
🛒 Doomspire Trader Item Image Generator

Usage:
  node generate-traderItem-images.js "Trader Item Name"     # Generate single trader item
  node generate-traderItem-images.js --all                 # Generate all missing trader items

Examples:
  node generate-traderItem-images.js "Spear"
  node generate-traderItem-images.js "Backpack"
  node generate-traderItem-images.js --all

The --all option will:
1. Load all trader items from simulation/src/content/traderItems.ts
2. Check existing images in simulation/public/traderItems/
3. Generate missing trader item images in parallel (limited by MAX_TRADER_ITEMS = ${MAX_TRADER_ITEMS})
4. Save images with format: <trader-item-name>.png

Requirements:
- OPENAI_API_KEY and ANTHROPIC_API_KEY in .env file
- traderItem-prompt-template.md (or treasure-prompt-template.md as fallback) and visual-style.md files in prompts/ directory
    `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showUsage();
    return;
  }

  const generator = new TraderItemImageGenerator();

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

  // Single trader item generation
  const traderItemName = args[0];

  if (!traderItemName) {
    console.error("❌ Error: Please provide a trader item name or use --all");
    showUsage();
    process.exit(1);
  }

  try {
    await generator.generate(traderItemName);
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
    process.exit(1);
  }
}

// Run the CLI
main().catch(console.error);
