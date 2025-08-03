// Lords of Doomspire Random Player

import { getTraderItemById } from "@/content/traderItems";
import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction, TileAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, Player, PlayerType, TurnContext } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";
import { canAfford } from "./PlayerUtils";
import { GameSettings } from "@/lib/GameSettings";

// Random player behavior constants
const RANDOM_PLAYER_CONSTANTS = {
  // Trader decision probabilities
  TRADER_BUY_ITEM_CHANCE: 0.3,

  // Building usage probabilities
  BLACKSMITH_USAGE_CHANCE: 0.3,
  MARKET_USAGE_CHANCE: 0.4,
  FLETCHER_USAGE_CHANCE: 0.25,
  BUILD_ACTION_CHANCE: 0.3,

  // Market selling probabilities
  SELL_FOOD_CHANCE: 0.5,
  SELL_WOOD_CHANCE: 0.5,
  SELL_ORE_CHANCE: 0.5,

  // Market selling limits
  MAX_RESOURCE_SELL_AMOUNT: 3,

  // Action generation limits
  MAX_BOAT_ACTIONS: 10,

  // Tile action probabilities
  CONQUER_WITH_MIGHT_CHANCE: 0.5,
  INCITE_REVOLT_CHANCE: 0.5,
} as const;

export class RandomPlayerAgent implements PlayerAgent {
  private name: string;

  constructor(name: string) {
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
    diceValues: number[],
    turnNumber: number,
    traderItems: readonly TraderCard[],
    adventureDeckThemes: [AdventureThemeType, AdventureThemeType, AdventureThemeType],
    thinkingLogger?: (content: string) => void,
  ): Promise<string | undefined> {
    // Random players don't provide strategic assessments
    return undefined;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const player = gameState.getCurrentPlayer();
    const remainingDice = turnContext.remainingDiceValues;

    if (remainingDice.length === 0) {
      throw new Error("No dice remaining for action");
    }

    // Choose a random die value
    const dieValue = remainingDice[Math.floor(Math.random() * remainingDice.length)];

    // Generate random actions based on what's available
    const actions: DiceAction[] = [];

    // Try champion actions
    if (player.champions.length > 0) {
      const championActions = this.generateRandomChampionActions(gameState, player.name, dieValue);
      actions.push(...championActions);
    }

    // Try boat actions  
    if (player.boats.length > 0) {
      const boatActions = this.generateRandomBoatActions(gameState, player.name, dieValue);
      actions.push(...boatActions);
    }

    // Try harvest actions
    const harvestAction = this.generateRandomHarvestAction(gameState, player.name, dieValue);
    if (harvestAction) {
      actions.push(harvestAction);
    }

    // If no actions are possible, default to a simple champion action
    if (actions.length === 0 && player.champions.length > 0) {
      actions.push({
        actionType: "championAction",
        championAction: {
          diceValueUsed: dieValue,
          championId: player.champions[0].id,
          movementPathIncludingStartPosition: [player.champions[0].position], // Stay in place
        },
      });
    }

    if (actions.length === 0) {
      throw new Error("No valid actions available");
    }

    const chosenAction = actions[Math.floor(Math.random() * actions.length)];

    if (thinkingLogger) {
      thinkingLogger(`Will do ${chosenAction.actionType} with die ${dieValue}`);
    }

    return chosenAction;
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision> {
    // Random selection from available options
    const randomOption = decisionContext.options[Math.floor(Math.random() * decisionContext.options.length)];

    if (thinkingLogger) {
      thinkingLogger(`Random player ${this.name} randomly chose: ${randomOption.id}`);
    }

    return { choice: randomOption.id };
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    // Always buy spear if available, otherwise buy nothing
    const playerResources = traderContext.playerResources;
    const availableItems = traderContext.availableItems;

    const actions: any[] = [];

    // Look for spear specifically
    if (playerResources.gold > 0 && availableItems.length > 0) {
      const spearItem = availableItems.find(item => item.id === "spear");

      if (spearItem) {
        const traderItem = getTraderItemById(spearItem.id);
        if (traderItem && playerResources.gold >= traderItem.cost) {
          actions.push({
            type: "buyItem",
            itemId: spearItem.id
          });
        }
      }
    }

    if (thinkingLogger) {
      thinkingLogger(`Random player ${this.name} trader decision: ${actions.length > 0 ? 'buying spear' : 'buying nothing'}`);
    }

    return {
      actions: actions,
    };
  }

  async useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void,
  ): Promise<BuildingDecision> {
    const player = gameState.getPlayer(playerName);
    if (!player) {
      throw new Error(`Player with name ${playerName} not found`);
    }

    const result: BuildingDecision = {};

    // Random building usage decisions
    const buildingUsageDecision: any = {};

    // Random blacksmith usage (30% chance if affordable)
    if (player.buildings.includes("blacksmith") &&
      canAfford(player, GameSettings.BLACKSMITH_USAGE_COST) &&
      Math.random() < RANDOM_PLAYER_CONSTANTS.BLACKSMITH_USAGE_CHANCE) {
      buildingUsageDecision.useBlacksmith = true;
    }

    // Random market usage (40% chance if have resources to sell)
    if (player.buildings.includes("market")) {
      const sellableResources = player.resources.food + player.resources.wood + player.resources.ore;
      if (sellableResources > GameSettings.MARKET_EXCHANGE_RATE && Math.random() < RANDOM_PLAYER_CONSTANTS.MARKET_USAGE_CHANCE) {
        buildingUsageDecision.sellAtMarket = {};

        // Randomly sell some resources
        if (player.resources.food > 0 && Math.random() < RANDOM_PLAYER_CONSTANTS.SELL_FOOD_CHANCE) {
          buildingUsageDecision.sellAtMarket.food = Math.floor(Math.random() * Math.min(RANDOM_PLAYER_CONSTANTS.MAX_RESOURCE_SELL_AMOUNT, player.resources.food)) + 1;
        }
        if (player.resources.wood > 0 && Math.random() < RANDOM_PLAYER_CONSTANTS.SELL_WOOD_CHANCE) {
          buildingUsageDecision.sellAtMarket.wood = Math.floor(Math.random() * Math.min(RANDOM_PLAYER_CONSTANTS.MAX_RESOURCE_SELL_AMOUNT, player.resources.wood)) + 1;
        }
        if (player.resources.ore > 0 && Math.random() < RANDOM_PLAYER_CONSTANTS.SELL_ORE_CHANCE) {
          buildingUsageDecision.sellAtMarket.ore = Math.floor(Math.random() * Math.min(RANDOM_PLAYER_CONSTANTS.MAX_RESOURCE_SELL_AMOUNT, player.resources.ore)) + 1;
        }
      }
    }

    // Random fletcher usage (25% chance if affordable)
    if (player.buildings.includes("fletcher") &&
      canAfford(player, GameSettings.FLETCHER_USAGE_COST) &&
      Math.random() < RANDOM_PLAYER_CONSTANTS.FLETCHER_USAGE_CHANCE) {
      buildingUsageDecision.useFletcher = true;
    }

    if (Object.keys(buildingUsageDecision).length > 0) {
      result.buildingUsageDecision = buildingUsageDecision;
    }

    // Random build action (30% chance)
    if (Math.random() < RANDOM_PLAYER_CONSTANTS.BUILD_ACTION_CHANCE) {
      const availableBuildActions = this.getAvailableBuildActions(player);
      if (availableBuildActions.length > 0) {
        const chosenAction = availableBuildActions[Math.floor(Math.random() * availableBuildActions.length)];
        result.buildAction = chosenAction as any; // Type assertion for now
      }
    }

    if (thinkingLogger) {
      const hasUsage = result.buildingUsageDecision && Object.keys(result.buildingUsageDecision).length > 0;
      thinkingLogger(`Random player ${this.name} building decision: ${hasUsage ? 'using buildings' : 'no building usage'}, ${result.buildAction ? `building ${result.buildAction}` : 'no build action'}`);
    }

    return result;
  }

  // Helper methods for generating random actions

  private generateRandomChampionActions(gameState: GameState, playerName: string, dieValue: number): DiceAction[] {
    const player = gameState.getPlayer(playerName);
    if (!player) return [];

    const actions: DiceAction[] = [];

    for (const champion of player.champions) {
      // Simple action: stay in place and claim tile if possible
      actions.push({
        actionType: "championAction",
        championAction: {
          diceValueUsed: dieValue,
          championId: champion.id,
          movementPathIncludingStartPosition: [champion.position],
          tileAction: this.generateTileAction(player),
        },
      });

      // Try some simple movements
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue; // Skip staying in place
          if (Math.abs(dRow) === Math.abs(dCol)) continue; // Skip diagonal moves for simplicity

          const newRow = champion.position.row + dRow * dieValue;
          const newCol = champion.position.col + dCol * dieValue;

          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            actions.push({
              actionType: "championAction",
              championAction: {
                diceValueUsed: dieValue,
                championId: champion.id,
                movementPathIncludingStartPosition: [
                  champion.position,
                  { row: newRow, col: newCol },
                ],
                tileAction: this.generateTileAction(player),
              },
            });
          }
        }
      }
    }

    return actions;
  }

  private generateRandomBoatActions(gameState: GameState, playerName: string, dieValue: number): DiceAction[] {
    const player = gameState.getPlayer(playerName);
    if (!player) return [];

    const actions: DiceAction[] = [];

    for (const boat of player.boats) {
      // Option 1: Stay in place
      actions.push({
        actionType: "boatAction",
        boatAction: {
          diceValueUsed: dieValue,
          boatId: boat.id,
          movementPathIncludingStartPosition: [boat.position],
        },
      });

      // Option 2: Move to neighboring ocean zones (0 or 1 step works for any dice value)
      const neighboringZones = gameState.getNeighboringOceanZones(boat.position);
      for (const targetZone of neighboringZones) {
        // Simple move without champion transport
        actions.push({
          actionType: "boatAction",
          boatAction: {
            diceValueUsed: dieValue,
            boatId: boat.id,
            movementPathIncludingStartPosition: [boat.position, targetZone],
          },
        });

        // Option 3: Move and transport champion if available
        const championsInCoast = gameState.getChampionsInCoastalTiles(playerName, boat.position);
        if (championsInCoast.length > 0) {
          // Pick a random champion to transport
          const championToTransport = championsInCoast[Math.floor(Math.random() * championsInCoast.length)];

          // Get target coastal tiles and pick a random one
          const targetCoastalTiles = gameState.getCoastalTilesForOceanZone(targetZone);
          if (targetCoastalTiles.length > 0) {
            const randomTargetTile = targetCoastalTiles[Math.floor(Math.random() * targetCoastalTiles.length)];

            actions.push({
              actionType: "boatAction",
              boatAction: {
                diceValueUsed: dieValue,
                boatId: boat.id,
                movementPathIncludingStartPosition: [boat.position, targetZone],
                championIdToPickUp: championToTransport.id,
                championDropPosition: randomTargetTile,
                championTileAction: this.generateTileAction(player),
              },
            });
          }
        }
      }
    }

    return actions.slice(0, RANDOM_PLAYER_CONSTANTS.MAX_BOAT_ACTIONS); // Increased limit since we have more options now
  }

  private generateRandomHarvestAction(gameState: GameState, playerName: string, dieValue: number): DiceAction | null {
    const player = gameState.getPlayer(playerName);
    if (!player) return null;

    // Find claimed tiles for harvesting
    const claimedTiles: Array<{ row: number; col: number }> = [];

    // Add home tile
    claimedTiles.push(player.homePosition);

    // Look for other claimed tiles (this is simplified - in real game we'd check board state)
    // For now, just harvest from home tile
    if (claimedTiles.length > 0) {
      return {
        actionType: "harvestAction",
        harvestAction: {
          diceValuesUsed: [dieValue],
          tilePositions: [claimedTiles[0]], // Just harvest from one tile
        },
      };
    }

    return null;
  }

  private generateTileAction(player: Player): TileAction {
    const tileAction: TileAction = {
      claimTile: true, // Always try to claim
    };

    // Use trader is always true
    tileAction.useTrader = true;

    // Use mercenary if player has >= 3 gold
    if (player.resources.gold >= GameSettings.MERCENARY_GOLD_COST) {
      tileAction.useMercenary = true;
    }

    // Use temple if player has >= 3 fame
    if (player.fame >= GameSettings.TEMPLE_FAME_COST) {
      tileAction.useTemple = true;
    }

    // Conquer with might if player has >= 1 might (50% chance)
    if (player.might >= 1 && Math.random() < RANDOM_PLAYER_CONSTANTS.CONQUER_WITH_MIGHT_CHANCE) {
      tileAction.conquerWithMight = true;
    }

    // Incite revolt if player has >= 1 fame (50% chance)
    if (player.fame >= 1 && Math.random() < RANDOM_PLAYER_CONSTANTS.INCITE_REVOLT_CHANCE) {
      tileAction.inciteRevolt = true;
    }

    return tileAction;
  }

  private getAvailableBuildActions(player: Player): string[] {
    const availableActions: string[] = [];
    const { resources } = player;

    // Check Blacksmith (2 Food + 2 Ore, max 1 per player)
    const hasBlacksmith = player.buildings.includes("blacksmith");
    if (!hasBlacksmith && canAfford(player, GameSettings.BLACKSMITH_COST)) {
      availableActions.push("blacksmith");
    }

    // Check Market (2 Food + 2 Wood, max 1 per player)
    const hasMarket = player.buildings.includes("market");
    if (!hasMarket && canAfford(player, GameSettings.MARKET_COST)) {
      availableActions.push("market");
    }

    // Check Fletcher (1 Wood + 1 Food + 1 Gold + 1 Ore, max 1 per player)
    const hasFletcher = player.buildings.includes("fletcher");
    if (!hasFletcher && canAfford(player, GameSettings.FLETCHER_COST)) {
      availableActions.push("fletcher");
    }

    // Check Chapel (6 Wood + 2 Gold, only once per player)
    const hasChapel = player.buildings.includes("chapel");
    const hasMonastery = player.buildings.includes("monastery");
    if (!hasChapel && !hasMonastery && canAfford(player, GameSettings.CHAPEL_COST)) {
      availableActions.push("chapel");
    }

    // Check Monastery upgrade (8 Wood + 3 Gold + 1 Ore, requires chapel)
    if (hasChapel && !hasMonastery && canAfford(player, GameSettings.MONASTERY_COST)) {
      availableActions.push("upgradeChapelToMonastery");
    }

    // Check Champion recruitment (max 3 total) - FIXED: Use fixed cost as per game rules
    const currentChampionCount = player.champions.length;
    if (currentChampionCount < GameSettings.MAX_CHAMPIONS_PER_PLAYER) {
      if (canAfford(player, GameSettings.CHAMPION_COST)) {
        availableActions.push("recruitChampion");
      }
    }

    // Check Boat building (max 2 boats total)
    const currentBoatCount = player.boats.length;
    if (currentBoatCount < GameSettings.MAX_BOATS_PER_PLAYER && canAfford(player, GameSettings.BOAT_COST)) {
      availableActions.push("buildBoat");
    }

    // Check Warship upgrade (2 Wood + 1 Ore + 1 Gold, max 1 per player)
    const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
    if (!hasWarshipUpgrade && canAfford(player, GameSettings.WARSHIP_UPGRADE_COST)) {
      availableActions.push("warshipUpgrade");
    }

    return availableActions;
  }
}
