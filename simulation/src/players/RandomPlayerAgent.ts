// Lords of Doomspire Random Player

import { getTraderItemById } from "@/content/traderItems";
import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { Decision, DecisionContext, GameLogEntry, Player, PlayerType, TurnContext } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";

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

  async makeStrategicAssessment(): Promise<string | undefined> {
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
      thinkingLogger(`Random player ${this.name} chose ${chosenAction.actionType} with die ${dieValue}`);
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
    // Simple random trader strategy
    const playerResources = traderContext.playerResources;
    const availableItems = traderContext.availableItems;

    const actions: any[] = [];

    // Maybe buy an item if we have gold
    if (playerResources.gold > 0 && availableItems.length > 0 && Math.random() < 0.3) {
      const affordableItems = availableItems.filter(item => {
        const traderItem = getTraderItemById(item.id);
        return traderItem && playerResources.gold >= traderItem.cost;
      });

      if (affordableItems.length > 0) {
        const randomItem = affordableItems[Math.floor(Math.random() * affordableItems.length)];
        actions.push({
          type: "buyItem",
          itemId: randomItem.id
        });
      }
    }

    if (thinkingLogger) {
      thinkingLogger(`Random player ${this.name} trader decision: ${actions.length} actions`);
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
      player.resources.gold >= 1 &&
      player.resources.ore >= 2 &&
      Math.random() < 0.3) {
      buildingUsageDecision.useBlacksmith = true;
    }

    // Random market usage (40% chance if have resources to sell)
    if (player.buildings.includes("market")) {
      const sellableResources = player.resources.food + player.resources.wood + player.resources.ore;
      if (sellableResources > 2 && Math.random() < 0.4) {
        buildingUsageDecision.sellAtMarket = {};

        // Randomly sell some resources
        if (player.resources.food > 0 && Math.random() < 0.5) {
          buildingUsageDecision.sellAtMarket.food = Math.floor(Math.random() * Math.min(3, player.resources.food)) + 1;
        }
        if (player.resources.wood > 0 && Math.random() < 0.5) {
          buildingUsageDecision.sellAtMarket.wood = Math.floor(Math.random() * Math.min(3, player.resources.wood)) + 1;
        }
        if (player.resources.ore > 0 && Math.random() < 0.5) {
          buildingUsageDecision.sellAtMarket.ore = Math.floor(Math.random() * Math.min(3, player.resources.ore)) + 1;
        }
      }
    }

    // Random fletcher usage (25% chance if affordable)
    if (player.buildings.includes("fletcher") &&
      player.resources.wood >= 3 &&
      player.resources.ore >= 1 &&
      Math.random() < 0.25) {
      buildingUsageDecision.useFletcher = true;
    }

    if (Object.keys(buildingUsageDecision).length > 0) {
      result.buildingUsageDecision = buildingUsageDecision;
    }

    // Random build action (30% chance)
    if (Math.random() < 0.3) {
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
          tileAction: {
            claimTile: Math.random() < 0.5, // 50% chance to claim
          },
        },
      });

      // Try some simple movements
      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue; // Skip staying in place
          if (Math.abs(dRow) === Math.abs(dCol)) continue; // Skip diagonal movement

          const newRow = champion.position.row + dRow;
          const newCol = champion.position.col + dCol;

          // Basic bounds check
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
                tileAction: {
                  claimTile: Math.random() < 0.3,
                },
              },
            });
          }
        }
      }
    }

    return actions.slice(0, 10); // Limit to avoid too many options
  }

  private generateRandomBoatActions(gameState: GameState, playerName: string, dieValue: number): DiceAction[] {
    const player = gameState.getPlayer(playerName);
    if (!player) return [];

    const actions: DiceAction[] = [];

    for (const boat of player.boats) {
      // Simple boat action: stay in place
      actions.push({
        actionType: "boatAction",
        boatAction: {
          diceValueUsed: dieValue,
          boatId: boat.id,
          movementPathIncludingStartPosition: [boat.position],
        },
      });
    }

    return actions.slice(0, 5);
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

  private getAvailableBuildActions(player: Player): string[] {
    const availableActions: string[] = [];
    const { resources } = player;

    // Check Blacksmith (2 Food + 2 Ore, max 1 per player)
    const hasBlacksmith = player.buildings.includes("blacksmith");
    if (!hasBlacksmith && resources.food >= 2 && resources.ore >= 2) {
      availableActions.push("blacksmith");
    }

    // Check Market (2 Food + 2 Wood, max 1 per player)
    const hasMarket = player.buildings.includes("market");
    if (!hasMarket && resources.food >= 2 && resources.wood >= 2) {
      availableActions.push("market");
    }

    // Check Fletcher (1 Wood + 1 Food + 1 Gold + 1 Ore, max 1 per player)
    const hasFletcher = player.buildings.includes("fletcher");
    if (!hasFletcher && resources.wood >= 1 && resources.food >= 1 && resources.gold >= 1 && resources.ore >= 1) {
      availableActions.push("fletcher");
    }

    // Check Chapel (6 Wood + 2 Gold, only once per player)
    const hasChapel = player.buildings.includes("chapel");
    const hasMonastery = player.buildings.includes("monastery");
    if (!hasChapel && !hasMonastery && resources.wood >= 6 && resources.gold >= 2) {
      availableActions.push("chapel");
    }

    // Check Monastery upgrade (8 Wood + 3 Gold + 1 Ore, requires chapel)
    if (hasChapel && !hasMonastery && resources.wood >= 8 && resources.gold >= 3 && resources.ore >= 1) {
      availableActions.push("upgradeChapelToMonastery");
    }

    // Check Champion recruitment (max 3 total)
    const currentChampionCount = player.champions.length;
    if (currentChampionCount < 3) {
      if (currentChampionCount === 1 && resources.food >= 3 && resources.gold >= 3 && resources.ore >= 1) {
        availableActions.push("recruitChampion");
      } else if (currentChampionCount === 2 && resources.food >= 6 && resources.gold >= 6 && resources.ore >= 3) {
        availableActions.push("recruitChampion");
      }
    }

    // Check Boat building (max 2 boats total)
    const currentBoatCount = player.boats.length;
    if (currentBoatCount < 2 && resources.wood >= 2 && resources.gold >= 2) {
      availableActions.push("buildBoat");
    }

    // Check Warship upgrade (2 Wood + 1 Ore + 1 Gold, max 1 per player)
    const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
    if (!hasWarshipUpgrade && resources.wood >= 2 && resources.ore >= 1 && resources.gold >= 1) {
      availableActions.push("warshipUpgrade");
    }

    return availableActions;
  }
}
