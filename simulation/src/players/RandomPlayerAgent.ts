// Lords of Doomspire Random Player

import { BuildingUsageDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { Decision, DecisionContext, GameLogEntry, MarketResourceType, PlayerType, ResourceType, TurnContext } from "@/lib/types";
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
    diceRolls: number[],
    turnNumber: number,
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

    // 60% chance to try building (increased from 30%)
    const shouldBuild = Math.random() < 0.6;

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
      return { choice: "", reasoning: "No options available" };
    }

    // Make random choice
    const randomIndex = Math.floor(Math.random() * decisionContext.options.length);
    const selectedOption = decisionContext.options[randomIndex];

    return {
      choice: selectedOption.id,
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
      return {};
    }

    // Check if player has a blacksmith
    const hasBlacksmith = player.buildings.includes("blacksmith");

    // Check if player can afford blacksmith (1 Gold + 2 Ore according to rules)
    const canAffordBlacksmith = player.resources.gold >= 1 && player.resources.ore >= 2;

    // Check if player has a market
    const hasMarket = player.buildings.includes("market");

    // Check if player has resources to sell at market
    const hasResourcesToSell = player.resources.food > 0 || player.resources.wood > 0 || player.resources.ore > 0;

    // RandomPlayer always uses blacksmith if available and affordable
    const useBlacksmith = hasBlacksmith && canAffordBlacksmith;

    // Only create sellAtMarket if player has market and resources to sell
    let sellAtMarket: Record<MarketResourceType, number> | undefined;

    if (hasMarket && hasResourcesToSell) {
      sellAtMarket = { food: 0, wood: 0, ore: 0 };

      // Randomly decide which resources to sell
      const resourceTypes: MarketResourceType[] = ["food", "wood", "ore"];

      for (const resourceType of resourceTypes) {
        if (player.resources[resourceType as ResourceType] > 0) {
          // Randomly decide to sell 0 to all of this resource
          const maxAmount = player.resources[resourceType as ResourceType];
          const sellAmount = Math.floor(Math.random() * (maxAmount + 1));

          sellAtMarket![resourceType] = sellAmount;
        }
      }
    }

    const result: BuildingUsageDecision = {};

    if (useBlacksmith) {
      result.useBlacksmith = useBlacksmith;
    }

    if (sellAtMarket) {
      result.sellAtMarket = sellAtMarket;
    }

    return result;
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

    // Check if we should use temple (if we have 2+ fame)
    if (destinationTile?.tileType === "temple" && player.fame >= 2) {
      tileAction.useTemple = true;
    }

    // Check if we should conquer the tile (if it's claimed by another player and we have might or fame)
    if (destinationTile?.tileType === "resource" && destinationTile.claimedBy && destinationTile.claimedBy !== playerName) {
      if (player.might > 0) {
        tileAction.conquerWithMight = true;
        tileAction.claimTile = false; // Don't claim if we're conquering
      } else if (player.fame > 0) {
        tileAction.conquerWithFame = true;
        tileAction.claimTile = false; // Don't claim if we're conquering
      }
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

    // Check if player already has buildings
    const hasBlacksmith = player.buildings.includes("blacksmith");
    const hasMarket = player.buildings.includes("market");
    const hasChapel = player.buildings.includes("chapel");
    const hasMonastery = player.buildings.includes("monastery");
    const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");

    // Check champion recruitment possibilities
    const currentChampionCount = player.champions.length;
    const canRecruitChampion = currentChampionCount < 3;

    // Randomly choose between blacksmith, market, chapel, monastery, warship upgrade, champion recruitment, and boat building (if available)
    const availableBuildings: ("blacksmith" | "market" | "chapel" | "upgradeChapelToMonastery" | "warshipUpgrade" | "recruitChampion" | "buildBoat")[] = [];

    // Prioritize champion recruitment - add it first if available
    if (canRecruitChampion) {
      if (currentChampionCount === 1 && player.resources.food >= 3 && player.resources.gold >= 3 && player.resources.ore >= 1) {
        availableBuildings.push("recruitChampion");
      } else if (currentChampionCount === 2 && player.resources.food >= 6 && player.resources.gold >= 6 && player.resources.ore >= 3) {
        availableBuildings.push("recruitChampion");
      }
    }

    if (!hasBlacksmith && player.resources.food >= 2 && player.resources.ore >= 2) {
      availableBuildings.push("blacksmith");
    }

    if (!hasMarket && player.resources.food >= 2 && player.resources.wood >= 2) {
      availableBuildings.push("market");
    }

    // Chapel can be built if player doesn't have chapel or monastery
    if (!hasChapel && !hasMonastery && player.resources.wood >= 3 && player.resources.gold >= 4) {
      availableBuildings.push("chapel");
    }

    // Monastery can only be built if player has chapel and doesn't have monastery
    if (hasChapel && !hasMonastery && player.resources.wood >= 4 && player.resources.gold >= 5 && player.resources.ore >= 2) {
      availableBuildings.push("upgradeChapelToMonastery");
    }

    // Check boat building possibilities
    const currentBoatCount = player.boats.length;
    const canBuildBoat = currentBoatCount < 2 && player.resources.wood >= 2 && player.resources.gold >= 2;

    if (canBuildBoat) {
      availableBuildings.push("buildBoat");
    }

    // Check warship upgrade possibilities
    if (!hasWarshipUpgrade && player.resources.wood >= 2 && player.resources.ore >= 1 && player.resources.gold >= 1) {
      availableBuildings.push("warshipUpgrade");
    }

    if (availableBuildings.length === 0) {
      return null;
    }

    // If champion recruitment is available, give it a 50% chance (reduced from 100%)
    if (availableBuildings.includes("recruitChampion") && Math.random() < 0.5) {
      return {
        actionType: "buildAction",
        buildAction: {
          diceValueUsed: dieValue,
          buildActionType: "recruitChampion"
        }
      };
    }

    // Pick a random available building for other options
    const randomBuildingIndex = Math.floor(Math.random() * availableBuildings.length);
    const buildingType = availableBuildings[randomBuildingIndex];

    return {
      actionType: "buildAction",
      buildAction: {
        diceValueUsed: dieValue,
        buildActionType: buildingType
      }
    };
  }
}
