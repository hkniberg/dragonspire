// Lords of Doomspire Random Player

import { DiceAction } from "@/lib/actionTypes";
import { Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";
import { PlayerAgent } from "./PlayerAgent";
import { generateAllPaths, getHarvestableResourcesInfo, getReachableTiles } from "./PlayerUtils";

export class RandomPlayerAgent implements PlayerAgent {
  private name: string;

  constructor(name: string = "Random Player") {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  getType(): PlayerType {
    return "random";
  }

  async makeStrategicAssessment(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    diceRolls?: number[],
  ): Promise<string | undefined> {
    // RandomPlayer doesn't provide strategic assessments
    return undefined;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
  ): Promise<DiceAction> {
    const playerName = gameState.getCurrentPlayer().name;

    // Use the first remaining die value
    const dieValue = turnContext.remainingDiceValues[0];

    // 20% chance to do harvesting if it's not the first die and there are harvestable resources
    const shouldHarvest = Math.random() < 0.2 && turnContext.remainingDiceValues.length < turnContext.diceRolled.length;

    if (shouldHarvest) {
      const harvestAction = this.generateRandomHarvestAction(gameState, playerName, dieValue);
      if (harvestAction) {
        return harvestAction;
      }
    }

    // Default to champion movement
    const moveAction = this.generateRandomChampionMoveAction(gameState, playerName, dieValue);
    if (moveAction) {
      return moveAction;
    }

    // Fallback to harvest if movement failed
    const harvestAction = this.generateRandomHarvestAction(gameState, playerName, dieValue);
    if (harvestAction) {
      return harvestAction;
    }

    // Last resort: minimal harvest action
    return {
      type: "harvest",
      diceValueUsed: dieValue,
      harvest: {
        tilePositions: [], // Empty harvest
      },
    };
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
  ): Promise<Decision> {
    if (decisionContext.options.length === 0) {
      return { choice: null, reasoning: "No options available" };
    }

    // Make random choice
    const randomIndex = Math.floor(Math.random() * decisionContext.options.length);
    const choice = decisionContext.options[randomIndex];

    return {
      choice: choice,
      reasoning: `RandomPlayer chose option ${randomIndex + 1} of ${decisionContext.options.length}`,
    };
  }

  private generateRandomChampionMoveAction(
    gameState: GameState,
    playerName: string,
    dieValue: number,
  ): DiceAction | null {
    const player = gameState.getPlayer(playerName);
    if (!player || player.champions.length === 0) {
      return null;
    }

    // Pick a random champion
    const randomChampionIndex = Math.floor(Math.random() * player.champions.length);
    const champion = player.champions[randomChampionIndex];

    // Get all reachable tiles within movement range, excluding tiles with other champions
    const reachableTiles = getReachableTiles(gameState, champion.position, dieValue, champion.id, playerName);

    if (reachableTiles.length === 0) {
      return null;
    }

    // Pick a random reachable tile
    const randomTileIndex = Math.floor(Math.random() * reachableTiles.length);
    const targetTile = reachableTiles[randomTileIndex];

    // Generate all possible paths to the target tile
    const allPaths = generateAllPaths(gameState, champion.position, targetTile, dieValue, champion.id, playerName);

    if (allPaths.length === 0) {
      return null;
    }

    // Pick a random path
    const randomPathIndex = Math.floor(Math.random() * allPaths.length);
    const selectedPath = allPaths[randomPathIndex];

    return {
      type: "moveChampion",
      diceValueUsed: dieValue,
      moveChampion: {
        championId: champion.id,
        pathIncludingStartPosition: selectedPath,
        claimTile: true,
      },
    };
  }

  private generateRandomHarvestAction(gameState: GameState, playerName: string, dieValue: number): DiceAction | null {
    const player = gameState.getPlayer(playerName);
    if (!player) {
      return null;
    }

    // Get detailed information about harvestable resources, taking blockading into account
    const harvestInfo = getHarvestableResourcesInfo(gameState, playerName);

    // Check if there are any harvestable resources
    const totalHarvestable =
      harvestInfo.totalHarvestableResources.food +
      harvestInfo.totalHarvestableResources.wood +
      harvestInfo.totalHarvestableResources.ore +
      harvestInfo.totalHarvestableResources.gold;
    if (totalHarvestable === 0) {
      return null;
    }

    // Collect all harvestable tile positions
    const harvestableTiles = [
      ...harvestInfo.ownedNonBlockedTiles,
      ...harvestInfo.blockadedOpponentTiles,
    ];

    if (harvestableTiles.length === 0) {
      return null;
    }

    // Harvest from all available tiles
    return {
      type: "harvest",
      diceValueUsed: dieValue,
      harvest: {
        tilePositions: harvestableTiles.map((tile) => tile.position),
      },
    };
  }
}
