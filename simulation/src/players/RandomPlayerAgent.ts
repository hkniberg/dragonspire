// Lords of Doomspire Random Player

import { BuildingUsageDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
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
    thinkingLogger?: (content: string) => void,
  ): Promise<string | undefined> {
    // RandomPlayer doesn't provide strategic assessments
    return undefined;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const playerName = gameState.getCurrentPlayer().name;

    // Use the first remaining die value
    const dieValue = turnContext.remainingDiceValues[0];

    // 10% chance to try building if it's not the first die
    const shouldBuild = Math.random() < 0.1 && turnContext.remainingDiceValues.length < turnContext.diceRolled.length;

    if (shouldBuild) {
      const buildAction = this.generateRandomBuildAction(gameState, playerName, dieValue);
      if (buildAction) {
        return buildAction;
      }
    }

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
      actionType: "harvestAction",
      harvestAction: {
        diceValuesUsed: [dieValue],
        tilePositions: [], // Empty harvest
      },
    };
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
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

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    // RandomPlayer doesn't interact with traders for now
    return {
      actions: [],
      reasoning: "RandomPlayer doesn't make trader decisions yet",
    };
  }

  async useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void,
  ): Promise<BuildingUsageDecision> {
    const player = gameState.getPlayer(playerName);
    if (!player) {
      return { useBlacksmith: false };
    }

    // Check if player has a blacksmith
    const hasBlacksmith = player.buildings.some(building => building.type === "blacksmith");

    // Check if player can afford blacksmith (1 Gold + 2 Ore according to rules)
    const canAffordBlacksmith = player.resources.gold >= 1 && player.resources.ore >= 2;

    // RandomPlayer always uses blacksmith if available and affordable
    return { useBlacksmith: hasBlacksmith && canAffordBlacksmith };
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

    // Get the target tile to check for special actions
    const targetPosition = selectedPath[selectedPath.length - 1];
    const destinationTile = gameState.board.getTileAt(targetPosition);

    // Prepare tile action
    const tileAction: any = {
      claimTile: true,
    };

    // Check if we should use mercenary camp (if we have 3+ gold)
    if (destinationTile?.tileType === "mercenary" && player.resources.gold >= 3) {
      tileAction.useMercenary = true;
    }

    // Check if we should use temple (if we have 3+ fame)
    if (destinationTile?.tileType === "temple" && player.fame >= 3) {
      tileAction.useTemple = true;
    }

    return {
      actionType: "championAction",
      championAction: {
        diceValueUsed: dieValue,
        championId: champion.id,
        movementPathIncludingStartPosition: selectedPath,
        tileAction: tileAction,
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
      actionType: "harvestAction",
      harvestAction: {
        diceValuesUsed: [dieValue],
        tilePositions: harvestableTiles.map((tile) => tile.position),
      },
    };
  }

  private generateRandomBuildAction(gameState: GameState, playerName: string, dieValue: number): DiceAction | null {
    const player = gameState.getPlayer(playerName);
    if (!player) {
      return null;
    }

    // Check if player already has a blacksmith
    const hasBlacksmith = player.buildings.some(building => building.type === "blacksmith");
    if (hasBlacksmith) {
      return null;
    }

    // Check if player can afford blacksmith (2 Food + 2 Ore)
    if (player.resources.food >= 2 && player.resources.ore >= 2) {
      return {
        actionType: "buildAction",
        buildAction: {
          diceValueUsed: dieValue,
          buildingType: "blacksmith"
        }
      };
    }

    return null;
  }
}
