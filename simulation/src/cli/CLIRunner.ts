// Lords of Doomspire CLI Runner

import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";
import { GameMaster, GameMasterConfig } from "../engine/GameMaster";
import { FileLoader } from "../lib/templateProcessor";
import { Claude } from "../llm/claude";
import { ClaudePlayerAgent } from "../players/ClaudePlayer";
import { PlayerAgent } from "../players/PlayerAgent";
import { RandomPlayerAgent } from "../players/RandomPlayerAgent";

// Load environment variables
dotenv.config();

export interface PlayerConfig {
  name: string;
  type: "random" | "claude";
}

export interface CLIConfig {
  maxRounds?: number;
  singleTurnTest?: boolean;
  specificTurns?: number;
  playerConfigs?: PlayerConfig[];
  seed?: number;
  startingGold?: number;
  startingFame?: number;
  startingMight?: number;
  startingFood?: number;
  startingWood?: number;
  startingOre?: number;
  claudeInstructions?: string; // Extra instructions for all Claude players
}

export class CLIRunner {
  /**
   * Create a file system-based file loader for CLI usage
   */
  private static createFileLoader(): FileLoader {
    return async (filePath: string): Promise<string> => {
      // Remove leading slash and convert to file system path
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(process.cwd(), 'public', cleanPath);

      try {
        return await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to load file "${filePath}" from file system: ${error}`);
      }
    };
  }

  private static async createPlayer(config: PlayerConfig): Promise<PlayerAgent> {
    switch (config.type) {
      case "random":
        return new RandomPlayerAgent(config.name);
      case "claude":
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error("ANTHROPIC_API_KEY not found in environment variables. Please add it to your .env file.");
        }

        // Create file system-based template processor for CLI usage
        const { TemplateProcessor } = await import("../lib/templateProcessor");
        const fileLoader = this.createFileLoader();
        const templateProcessor = new TemplateProcessor(fileLoader);

        // Load system prompt from template
        const systemPrompt = await templateProcessor.processTemplate("SystemPrompt", {});

        const claude = new Claude(apiKey, systemPrompt);
        return new ClaudePlayerAgent(config.name, claude, templateProcessor);
      default:
        throw new Error(`Unknown player type: ${config.type}`);
    }
  }

  private static parsePlayerArgs(args: string[]): PlayerConfig[] {
    const playerConfigs: PlayerConfig[] = [];
    const defaultNames = ["Alice", "Bob", "Charlie", "Diana"];

    // Look for player specifications like p1=random, p2=claude, etc.
    const playerArgs = args.filter((arg) => arg.match(/^p[1-4]=(random|claude)$/));

    if (playerArgs.length === 0) {
      // No player specifications, default to all random players
      return defaultNames.map((name) => ({ name, type: "random" }));
    }

    // Initialize with default random players
    for (let i = 0; i < 4; i++) {
      playerConfigs.push({ name: defaultNames[i], type: "random" });
    }

    // Override with specified player types
    for (const arg of playerArgs) {
      const match = arg.match(/^p([1-4])=(random|claude)$/);
      if (match) {
        const playerIndex = parseInt(match[1]) - 1;
        const playerType = match[2] as "random" | "claude";

        if (playerIndex >= 0 && playerIndex < 4) {
          playerConfigs[playerIndex].type = playerType;
        }
      }
    }

    return playerConfigs;
  }

  /**
 * Apply starting resources and extra instructions to all players in the game state
 */
  private static applyStartingResources(gameMaster: GameMaster, config: CLIConfig): void {
    const hasStartingResources = config.startingGold || config.startingFame || config.startingMight || config.startingFood || config.startingWood || config.startingOre;
    const hasClaudeInstructions = config.claudeInstructions && config.claudeInstructions.trim();

    if (!hasStartingResources && !hasClaudeInstructions) {
      return;
    }

    if (hasStartingResources) {
      console.log("Applying starting resources:");
      if (config.startingGold) {
        console.log(`  Starting Gold: ${config.startingGold}`);
      }
      if (config.startingFame) {
        console.log(`  Starting Fame: ${config.startingFame}`);
      }
      if (config.startingMight) {
        console.log(`  Starting Might: ${config.startingMight}`);
      }
      if (config.startingFood) {
        console.log(`  Starting Food: ${config.startingFood}`);
      }
      if (config.startingWood) {
        console.log(`  Starting Wood: ${config.startingWood}`);
      }
      if (config.startingOre) {
        console.log(`  Starting Ore: ${config.startingOre}`);
      }
      console.log();
    }

    if (hasClaudeInstructions) {
      console.log("Applying Claude instructions:");
      console.log(`  Instructions: ${config.claudeInstructions}`);
      console.log();
    }

    const gameState = gameMaster.getGameState();
    const players = gameState.players;

    for (const player of players) {
      // Apply starting resources
      if (config.startingGold) {
        player.resources.gold += config.startingGold;
      }
      if (config.startingFame) {
        player.fame += config.startingFame;
      }
      if (config.startingMight) {
        player.might += config.startingMight;
      }
      if (config.startingFood) {
        player.resources.food += config.startingFood;
      }
      if (config.startingWood) {
        player.resources.wood += config.startingWood;
      }
      if (config.startingOre) {
        player.resources.ore += config.startingOre;
      }

      // Apply extra instructions to Claude players
      if (hasClaudeInstructions) {
        // Check if this player is a Claude player by looking at the player configs
        const playerConfig = config.playerConfigs?.find(pc => pc.name === player.name);
        if (playerConfig?.type === "claude") {
          player.extraInstructions = config.claudeInstructions;
        }
      }
    }
  }

  /**
   * Run a single turn test with specified players
   */
  public static async runSingleTurnTest(config: CLIConfig = {}): Promise<void> {
    console.log("=== Lords of Doomspire - Single Turn Test ===\n");

    // Create players based on configuration
    const playerConfigs = config.playerConfigs || [
      { name: "Alice", type: "random" },
      { name: "Bob", type: "random" },
      { name: "Charlie", type: "random" },
      { name: "Diana", type: "random" },
    ];

    console.log("Player Configuration:");
    playerConfigs.forEach((config, index) => {
      console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
    });
    console.log();

    const players = await Promise.all(playerConfigs.map((config) => this.createPlayer(config)));

    // Create game master with just 1 round for testing
    const masterConfig: GameMasterConfig = {
      players: players,
      maxRounds: 1,
      seed: config.seed,
    };

    const gameMaster = new GameMaster(masterConfig);

    try {
      // Execute just one turn
      gameMaster.start();

      // Apply starting resources if specified
      this.applyStartingResources(gameMaster, config);

      await gameMaster.executeTurn();

      console.log("\n=== Single Turn Test Complete ===");
      console.log("✅ Single turn execution successful!");

      // Print final game state summary
      const gameState = gameMaster.getGameState();
      const gameLog = gameMaster.getGameLog();

      if (gameLog.length > 0) {
        const currentPlayer = gameState.getCurrentPlayer();
        console.log(`\nTurn executed by: ${currentPlayer.name}`);
        console.log(`Game log entries: ${gameLog.length}`);
      }
    } catch (error) {
      console.error("❌ Single turn test failed:", error);
      throw error;
    }
  }

  /**
   * Run a specific number of turns
   */
  public static async runSpecificTurns(config: CLIConfig = {}): Promise<void> {
    const numTurns = config.specificTurns || 1;
    console.log(`=== Lords of Doomspire - ${numTurns} Turn(s) Simulation ===\n`);

    // Create players based on configuration
    const playerConfigs = config.playerConfigs || [
      { name: "Alice", type: "random" },
      { name: "Bob", type: "random" },
      { name: "Charlie", type: "random" },
      { name: "Diana", type: "random" },
    ];

    console.log("Player Configuration:");
    playerConfigs.forEach((config, index) => {
      console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
    });
    console.log();

    const players = await Promise.all(playerConfigs.map((config) => this.createPlayer(config)));

    // Create game master with enough rounds to complete the requested turns
    // We need at least numTurns / players.length rounds, but let's be generous
    const maxRounds = Math.max(Math.ceil(numTurns / players.length), 10);
    const masterConfig: GameMasterConfig = {
      players: players,
      maxRounds: maxRounds,
      seed: config.seed,
    };

    const gameMaster = new GameMaster(masterConfig);

    try {
      gameMaster.start();

      // Apply starting resources if specified
      this.applyStartingResources(gameMaster, config);

      // Execute the specified number of turns
      for (let i = 0; i < numTurns; i++) {
        await gameMaster.executeTurn();

        // Check if game ended early due to victory condition
        if (gameMaster.getGameState().gameEnded) {
          console.log(`\nGame ended after ${i + 1} turn(s) due to victory condition.`);
          break;
        }
      }

      console.log(`\n=== ${numTurns} Turn(s) Simulation Complete ===`);
      console.log("✅ Specific turns simulation successful!");

      // Print summary
      const gameLog = gameMaster.getGameLog();
      console.log(`\nTotal log entries: ${gameLog.length}`);
    } catch (error) {
      console.error(`❌ ${numTurns} turn(s) simulation failed:`, error);
      throw error;
    }
  }

  /**
   * Run a complete game simulation
   */
  public static async runCompleteGame(config: CLIConfig = {}): Promise<void> {
    console.log("=== Lords of Doomspire - Complete Game Simulation ===\n");

    // Create players based on configuration
    const playerConfigs = config.playerConfigs || [
      { name: "Alice", type: "random" },
      { name: "Bob", type: "random" },
      { name: "Charlie", type: "random" },
      { name: "Diana", type: "random" },
    ];

    console.log("Player Configuration:");
    playerConfigs.forEach((config, index) => {
      console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
    });
    console.log();

    const players = await Promise.all(playerConfigs.map((config) => this.createPlayer(config)));

    // Create game master
    const masterConfig: GameMasterConfig = {
      players: players,
      maxRounds: config.maxRounds || 10, // Limit for testing
      seed: config.seed,
    };

    const gameMaster = new GameMaster(masterConfig);

    try {
      // Start the game and apply starting resources
      gameMaster.start();
      this.applyStartingResources(gameMaster, config);

      // Continue with the game loop (similar to runToCompletion but without calling start again)
      while (gameMaster.getMasterState() === "playing") {
        await gameMaster.executeTurn();
      }

      // Print game summary
      const gameState = gameMaster.getGameState();
      const gameLog = gameMaster.getGameLog();

      console.log(`\nGame completed after ${gameState.currentRound} rounds`);
      console.log(`Total log entries: ${gameLog.length}`);

      // Print final player states with might and formatted resources
      console.log("\nFinal Player States:");
      for (const player of gameState.players) {
        const { formatResources } = await import("../lib/utils");
        console.log(`${player.name}: Fame=${player.fame}, Might=${player.might}, Resources=${formatResources(player.resources)}`);
      }

      console.log("✅ Complete game simulation successful!");
    } catch (error) {
      console.error("❌ Complete game simulation failed:", error);
      throw error;
    }
  }

  /**
   * Main CLI entry point
   */
  public static async main(args: string[] = []): Promise<void> {
    const config: CLIConfig = {};



    // Parse player configurations first
    config.playerConfigs = this.parsePlayerArgs(args);

    // Parse other command line arguments
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case "--single-turn":
          config.singleTurnTest = true;
          break;
        case "--turns":
          config.specificTurns = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--max-rounds":
          config.maxRounds = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--seed":
          config.seed = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--gold":
          config.startingGold = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--fame":
          config.startingFame = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--might":
          config.startingMight = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--food":
          config.startingFood = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--wood":
          config.startingWood = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--ore":
          config.startingOre = parseInt(args[i + 1]);
          i++; // Skip next argument
          break;
        case "--claude-instructions":
          // Collect all arguments until we hit another flag
          let instructionParts = [];
          let j = i + 1;
          while (j < args.length && !args[j].startsWith("--")) {
            instructionParts.push(args[j]);
            j++;
          }
          if (instructionParts.length > 0) {
            config.claudeInstructions = instructionParts.join(" ");

          }
          i = j - 1; // Skip the instruction parts we just processed
          break;
        // Skip player arguments as they're already parsed
        default:
          if (args[i].match(/^p[1-4]=(random|claude)$/)) {
            // Skip player arguments
            continue;
          }
          break;
      }
    }

    try {
      if (config.singleTurnTest) {
        await CLIRunner.runSingleTurnTest(config);
      } else if (config.specificTurns) {
        await CLIRunner.runSpecificTurns(config);
      } else {
        await CLIRunner.runCompleteGame(config);
      }
    } catch (error) {
      console.error("CLI Runner failed:", error);
      process.exit(1);
    }
  }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  CLIRunner.main(process.argv.slice(2));
}
