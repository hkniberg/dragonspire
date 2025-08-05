// Lords of Doomspire Smart Player (previously Random Player)

import { getTraderItemById } from "@/content/traderItems";
import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction, TileAction, BuildAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, Player, PlayerType, TurnContext, Position, Tile, ResourceType, Path } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";
import { canAfford } from "./PlayerUtils";
import { GameSettings } from "@/lib/GameSettings";
import { getReachablePositions, getClosestPaths } from "@/lib/PathUtils";

// Smart player behavior constants
const SMART_PLAYER_CONSTANTS = {
  // Strategic thresholds
  MIN_MIGHT_FOR_TIER_1_ADVENTURE: 2,
  MIN_MIGHT_FOR_TIER_2_ADVENTURE: 4,
  MIN_HEALING_RESOURCES: 4, // Minimum total resources to risk adventure tiles

  // Dragon targeting positions (center of map)
  DRAGON_TARGET_POSITIONS: [
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    { row: 4, col: 3 },
    { row: 4, col: 4 },
  ],

  // Priority weights for tile scoring
  WEIGHT_STARRED_RESOURCE: 100,
  WEIGHT_UNCLAIMED_RESOURCE: 50,
  WEIGHT_TEMPLE: 30,
  WEIGHT_MERCENARY: 25,
  WEIGHT_ADVENTURE_TIER_1: 20,
  WEIGHT_ADVENTURE_TIER_2: 15,
  WEIGHT_TRADER: 10,

  // Building priorities (higher = more important)
  BUILDING_PRIORITY_MARKET: 100,
  BUILDING_PRIORITY_BLACKSMITH: 95, // Increased - critical for dragon fighting
  BUILDING_PRIORITY_FLETCHER: 90,   // Increased - alternative might source
  BUILDING_PRIORITY_CHAPEL: 80,     // Provides fame for victory
  BUILDING_PRIORITY_CHAMPION: 75,
  BUILDING_PRIORITY_MONASTERY: 70,  // Provides more fame
  BUILDING_PRIORITY_BOAT: 60,
  BUILDING_PRIORITY_WARSHIP: 30,

  // Resource selling preferences (when needing gold)
  PREFER_SELL_FOOD: 1,
  PREFER_SELL_WOOD: 2,
  PREFER_SELL_ORE: 3, // Sell ore last since it's needed for blacksmith
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
    const player = gameState.getCurrentPlayer();
    const starredTiles = gameState.getStarredTileCount(player.name);

    // Check which victory path we're closest to
    const fameDistance = GameSettings.VICTORY_FAME_THRESHOLD - player.fame;
    const goldDistance = GameSettings.VICTORY_GOLD_THRESHOLD - player.resources.gold;
    const starredTileDistance = GameSettings.VICTORY_STARRED_TILES_THRESHOLD - starredTiles;

    const strategies: string[] = [];

    if (this.isNearVictoryWithGameState(gameState, player)) {
      strategies.push("🐉 DRAGON SEEKING MODE - No harvesting, all dice for exploration!");

      if (fameDistance <= 4) strategies.push(`Fame victory (need ${fameDistance} more)`);
      if (goldDistance <= 5) strategies.push(`Gold victory (need ${goldDistance} more)`);
      if (starredTileDistance <= 1) strategies.push(`Starred tiles victory (need ${starredTileDistance} more)`);
      if (player.might >= GameSettings.DRAGON_BASE_MIGHT) strategies.push(`Might victory (${player.might} vs dragon ${GameSettings.DRAGON_BASE_MIGHT}+1d3)`);
    } else {
      strategies.push("Building towards victory conditions");

      // Show progress towards each victory path
      if (fameDistance <= 8) strategies.push(`Fame: ${player.fame}/${GameSettings.VICTORY_FAME_THRESHOLD}`);
      if (goldDistance <= 10) strategies.push(`Gold: ${player.resources.gold}/${GameSettings.VICTORY_GOLD_THRESHOLD}`);
      if (starredTileDistance <= 2) strategies.push(`Starred: ${starredTiles}/${GameSettings.VICTORY_STARRED_TILES_THRESHOLD}`);
      if (player.might >= 4) strategies.push(`Might: ${player.might}/${GameSettings.DRAGON_BASE_MIGHT} (for dragon fight)`);
    }

    return strategies.length > 0 ? strategies.join(", ") : undefined;
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

    // Check if we should use harvest strategy
    const inVictoryMode = this.isNearVictoryWithGameState(gameState, player);

    if (inVictoryMode) {
      if (thinkingLogger) {
        thinkingLogger(`Victory condition met - using all dice for dragon seeking instead of harvesting`);
      }
      // Skip harvesting, proceed to movement actions below
    } else if (remainingDice.length === 1) {
      // If this is the last die and not in victory mode, use it for harvest
      const dieValue = remainingDice[0];
      const harvestAction = this.generateSmartHarvestAction(gameState, player.name, dieValue);
      if (harvestAction) {
        if (thinkingLogger) {
          thinkingLogger(`Last die ${dieValue} - using for harvest`);
        }
        return harvestAction;
      }
      // If harvest not possible, fall back to champion movement
      if (thinkingLogger) {
        thinkingLogger(`Last die ${dieValue} - harvest not possible, using for champion movement`);
      }
      return this.generateBestChampionAction(gameState, player.name, dieValue, thinkingLogger);
    }

    // For non-last dice, find the best action
    const allActions: Array<{ action: DiceAction; score: number; reasoning: string }> = [];

    // Score all possible champion actions for each die value
    for (const dieValue of remainingDice) {
      // Champion actions
      if (player.champions.length > 0) {
        const championActions = this.generateSmartChampionActions(gameState, player.name, dieValue);

        // In victory mode, massively boost champion action scores to prioritize dragon seeking
        if (inVictoryMode) {
          championActions.forEach(action => {
            action.score += 10000; // Ensure champion movement always wins in victory mode
            action.reasoning = `DRAGON SEEKING: ${action.reasoning}`;
          });
        }

        allActions.push(...championActions);
      }

      // Boat actions (only add if not in victory mode, or as fallback)
      if (player.boats.length > 0 && (!inVictoryMode || player.champions.length === 0)) {
        const boatActions = this.generateSmartBoatActions(gameState, player.name, dieValue);
        allActions.push(...boatActions);
      }
    }

    // If no actions are possible, use the smallest die for a basic champion action
    if (allActions.length === 0 && player.champions.length > 0) {
      const smallestDie = Math.min(...remainingDice);
      if (thinkingLogger) {
        thinkingLogger(`No good actions found, staying in place with die ${smallestDie}`);
      }
      return {
        actionType: "championAction",
        championAction: {
          diceValueUsed: smallestDie,
          championId: player.champions[0].id,
          movementPathIncludingStartPosition: [player.champions[0].position],
        },
      };
    }

    if (allActions.length === 0) {
      throw new Error("No valid actions available");
    }

    // Choose the best action
    allActions.sort((a, b) => b.score - a.score);
    const bestAction = allActions[0];

    if (thinkingLogger) {
      thinkingLogger(`Chose: ${bestAction.reasoning} (score: ${bestAction.score})`);
    }

    return bestAction.action;
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
    const buildingUsageDecision: any = {};

    // Smart building usage - always use when beneficial and affordable

    // Use blacksmith if we have it and can afford it (prioritize might building)
    // CRITICAL: Be MORE aggressive when we have excessive ore (>6)
    const hasExcessiveOre = player.resources.ore > 6;
    const shouldUseBlacksmith = player.buildings.includes("blacksmith") &&
      (canAfford(player, GameSettings.BLACKSMITH_USAGE_COST) || hasExcessiveOre);

    if (shouldUseBlacksmith) {
      buildingUsageDecision.useBlacksmith = true;
      if (thinkingLogger) {
        const dragonReady = player.might >= (GameSettings.DRAGON_BASE_MIGHT - 2);
        const excessNote = hasExcessiveOre ? ' (using excess ore)' : '';
        thinkingLogger(`Using blacksmith to gain might${dragonReady ? ' (approaching dragon fight capability)' : ''}${excessNote} (cost: ${JSON.stringify(GameSettings.BLACKSMITH_USAGE_COST)})`);
      }
    }

    // Use fletcher if we have it and can afford it
    // CRITICAL: Be MORE aggressive when we have excessive wood/food (>6)
    const hasExcessiveWood = player.resources.wood > 6;
    const hasExcessiveFood = player.resources.food > 6;
    const shouldUseFletcher = player.buildings.includes("fletcher") &&
      (canAfford(player, GameSettings.FLETCHER_USAGE_COST) || (hasExcessiveWood && hasExcessiveFood));

    if (shouldUseFletcher) {
      // Use fletcher more aggressively when approaching dragon fight capability or have excess resources
      const nearDragonFight = player.might >= (GameSettings.DRAGON_BASE_MIGHT - 3);
      const shouldProceed = !player.buildings.includes("blacksmith") || nearDragonFight || hasExcessiveWood || hasExcessiveFood;

      if (shouldProceed) {
        buildingUsageDecision.useFletcher = true;
        if (thinkingLogger) {
          const excessNote = (hasExcessiveWood || hasExcessiveFood) ? ' (using excess resources)' : '';
          thinkingLogger(`Using fletcher to gain might${nearDragonFight ? ' (building for dragon fight)' : ''}${excessNote} (cost: ${JSON.stringify(GameSettings.FLETCHER_USAGE_COST)})`);
        }
      }
    }

    // Use market strategically to sell resources for gold when needed
    if (player.buildings.includes("market")) {
      const marketSales = this.calculateSmartMarketSales(player);
      if (marketSales && Object.keys(marketSales).length > 0) {
        buildingUsageDecision.sellAtMarket = marketSales;
        if (thinkingLogger) {
          thinkingLogger(`Selling at market: ${JSON.stringify(marketSales)}`);
        }
      }
    }

    if (Object.keys(buildingUsageDecision).length > 0) {
      result.buildingUsageDecision = buildingUsageDecision;
    }

    // Smart build action - prioritize based on current needs
    const buildAction = this.getSmartBuildAction(player);
    if (buildAction) {
      result.buildAction = buildAction;
      if (thinkingLogger) {
        thinkingLogger(`Building: ${buildAction}`);
      }
    }

    return result;
  }

  // Helper methods for generating smart actions

  /**
   * Generate smart champion actions with scoring
   */
  private generateSmartChampionActions(
    gameState: GameState,
    playerName: string,
    dieValue: number
  ): Array<{ action: DiceAction; score: number; reasoning: string }> {
    const player = gameState.getPlayer(playerName);
    if (!player) return [];

    const scoredActions: Array<{ action: DiceAction; score: number; reasoning: string }> = [];

    for (const champion of player.champions) {
      // Get all reachable positions for this champion with this die value
      const reachablePositions = getReachablePositions(
        champion.position,
        dieValue,
        { minRow: 0, maxRow: 7, minCol: 0, maxCol: 7 }
      );

      for (const reachablePos of reachablePositions) {
        const targetTile = gameState.getTile(reachablePos.endPos);
        if (!targetTile) continue;

        // Score this destination
        const score = this.scoreTileDestination(gameState, player, targetTile, reachablePos.steps);

        // Skip destinations with very low scores unless we're staying in place
        // But in victory mode, allow any positive score since we need to move toward dragon
        const inVictoryMode = this.isNearVictoryWithGameState(gameState, player);
        if (!inVictoryMode && score < 1 && reachablePos.steps > 0) continue;

        // Find a safe path (avoiding monsters when low on resources)
        const safePath = this.findSafestPath(gameState, player, champion.position, reachablePos.endPos, reachablePos.paths);
        if (!safePath) continue;

        const tileAction = this.generateSmartTileAction(gameState, player, targetTile);
        const reasoning = this.explainDestinationChoice(targetTile, score, reachablePos.steps);

        scoredActions.push({
          action: {
            actionType: "championAction",
            championAction: {
              diceValueUsed: dieValue,
              championId: champion.id,
              movementPathIncludingStartPosition: safePath,
              tileAction,
            },
          },
          score,
          reasoning: `Champion ${champion.id} ${reasoning}`,
        });
      }
    }

    return scoredActions;
  }

  /**
   * Generate smart boat actions with scoring
   */
  private generateSmartBoatActions(
    gameState: GameState,
    playerName: string,
    dieValue: number
  ): Array<{ action: DiceAction; score: number; reasoning: string }> {
    const player = gameState.getPlayer(playerName);
    if (!player) return [];

    const scoredActions: Array<{ action: DiceAction; score: number; reasoning: string }> = [];

    for (const boat of player.boats) {
      const neighboringZones = gameState.getNeighboringOceanZones(boat.position);

      for (const targetZone of neighboringZones) {
        // Check for champion transport opportunities
        const championsInCoast = gameState.getChampionsInCoastalTiles(playerName, boat.position);
        const targetCoastalTiles = gameState.getCoastalTilesForOceanZone(targetZone);

        if (championsInCoast.length > 0 && targetCoastalTiles.length > 0) {
          // Find best champion to transport and best destination
          for (const champion of championsInCoast) {
            for (const targetTile of targetCoastalTiles) {
              const tile = gameState.getTile(targetTile);
              if (!tile) continue;

              const score = this.scoreTileDestination(gameState, player, tile, 1) + 20; // Bonus for using boat transport
              const tileAction = this.generateSmartTileAction(gameState, player, tile);

              scoredActions.push({
                action: {
                  actionType: "boatAction",
                  boatAction: {
                    diceValueUsed: dieValue,
                    boatId: boat.id,
                    movementPathIncludingStartPosition: [boat.position, targetZone],
                    championIdToPickUp: champion.id,
                    championDropPosition: targetTile,
                    championTileAction: tileAction,
                  },
                },
                score,
                reasoning: `Boat transport champion ${champion.id} to ${tile.tileType} tile`,
              });
            }
          }
        }

        // Also consider simple boat movement without champion transport
        scoredActions.push({
          action: {
            actionType: "boatAction",
            boatAction: {
              diceValueUsed: dieValue,
              boatId: boat.id,
              movementPathIncludingStartPosition: [boat.position, targetZone],
            },
          },
          score: 5, // Low score for movement without purpose
          reasoning: `Move boat to ${targetZone} for positioning`,
        });
      }
    }

    return scoredActions;
  }

  /**
   * Generate smart harvest action based on claimed tiles and resource needs
   */
  private generateSmartHarvestAction(gameState: GameState, playerName: string, dieValue: number): DiceAction | null {
    const player = gameState.getPlayer(playerName);
    if (!player) return null;

    const claimedTiles = gameState.getClaimedTiles(playerName);
    if (claimedTiles.length === 0) return null;

    // Prioritize starred tiles and resource needs
    const harvestTargets = this.prioritizeHarvestTiles(player, claimedTiles);

    if (harvestTargets.length === 0) return null;

    // Use the highest priority tiles that fit within our die budget
    const selectedTiles = harvestTargets.slice(0, Math.min(3, harvestTargets.length));

    return {
      actionType: "harvestAction",
      harvestAction: {
        diceValuesUsed: [dieValue],
        tilePositions: selectedTiles.map(t => t.position),
      },
    };
  }

  /**
   * Generate fallback champion action when no good options exist
   */
  private generateBestChampionAction(gameState: GameState, playerName: string, dieValue: number, thinkingLogger?: (content: string) => void): DiceAction {
    const player = gameState.getPlayer(playerName);
    if (!player || player.champions.length === 0) {
      throw new Error("No champions available for fallback action");
    }

    const champion = player.champions[0];
    return {
      actionType: "championAction",
      championAction: {
        diceValueUsed: dieValue,
        championId: champion.id,
        movementPathIncludingStartPosition: [champion.position],
      },
    };
  }

  // === SMART HELPER METHODS ===

  /**
   * Score a tile destination based on strategic value
   */
  private scoreTileDestination(gameState: GameState, player: Player, tile: Tile, steps: number): number {
    let score = 0;

    // Check victory conditions first (highest priority)
    if (this.isNearVictoryWithGameState(gameState, player)) {
      if (tile.tileType === "doomspire") {
        return 10000; // MASSIVELY prioritize dragon when we can win
      }

      // If no doomspire visible, HEAVILY prioritize center tiles for exploration
      for (const dragonPos of SMART_PLAYER_CONSTANTS.DRAGON_TARGET_POSITIONS) {
        if (tile.position.row === dragonPos.row && tile.position.col === dragonPos.col) {
          return 2000; // Very high priority for center exploration when victory ready
        }
      }

      // CRITICAL: Give substantial score for ANY movement toward dragon/center when in victory mode
      const distanceToCenter = Math.min(
        ...SMART_PLAYER_CONSTANTS.DRAGON_TARGET_POSITIONS.map(centerPos =>
          Math.abs(tile.position.row - centerPos.row) + Math.abs(tile.position.col - centerPos.col)
        )
      );

      // Score inversely proportional to distance from center - closer = better
      if (distanceToCenter <= 6) {
        score += 500 - (distanceToCenter * 50); // 500 for adjacent, 450 for 1 away, etc.
      }

      // Extra boost for unexplored tiles when victory ready
      if (!tile.explored) {
        score += 200;
      }

      // Massive penalty for staying at home tile when we should be seeking dragon
      if (tile.position.row === 7 && (tile.position.col === 0 || tile.position.col === 7)) {
        score -= 1000; // Heavily discourage staying at home corners when victory ready
      }
      if (tile.position.row === 0 && (tile.position.col === 0 || tile.position.col === 7)) {
        score -= 1000; // Heavily discourage staying at home corners when victory ready
      }
    }

    // Also prioritize doomspire even if not quite at victory (in case it appears)
    if (tile.tileType === "doomspire") {
      return 8000; // High priority always
    }

    // Prioritize unclaimed resource tiles
    if (tile.tileType === "resource" && !tile.claimedBy) {
      score += SMART_PLAYER_CONSTANTS.WEIGHT_UNCLAIMED_RESOURCE;
      if (tile.isStarred) {
        score += SMART_PLAYER_CONSTANTS.WEIGHT_STARRED_RESOURCE;

        // Extra boost for starred tiles if pursuing starred tile victory
        const starredTiles = gameState.getStarredTileCount(player.name);
        if (starredTiles >= (GameSettings.VICTORY_STARRED_TILES_THRESHOLD - 2)) {
          score += 200; // Really prioritize starred tiles if close to victory
        }
      }
    }

    // Temple - good if we have fame to spare
    if (tile.tileType === "temple" && player.fame >= GameSettings.TEMPLE_FAME_COST) {
      score += SMART_PLAYER_CONSTANTS.WEIGHT_TEMPLE;
    }

    // Mercenary - good if we have gold to spare
    if (tile.tileType === "mercenary" && player.resources.gold >= GameSettings.MERCENARY_GOLD_COST) {
      score += SMART_PLAYER_CONSTANTS.WEIGHT_MERCENARY;
    }

    // Adventure tiles based on our might level
    if (tile.tileType === "adventure" && tile.tier) {
      const hasMinHealingResources = this.getTotalHealingResources(player) >= SMART_PLAYER_CONSTANTS.MIN_HEALING_RESOURCES;

      if (tile.tier === 1 && player.might >= SMART_PLAYER_CONSTANTS.MIN_MIGHT_FOR_TIER_1_ADVENTURE && hasMinHealingResources) {
        score += SMART_PLAYER_CONSTANTS.WEIGHT_ADVENTURE_TIER_1;
      } else if (tile.tier === 2 && player.might >= SMART_PLAYER_CONSTANTS.MIN_MIGHT_FOR_TIER_2_ADVENTURE && hasMinHealingResources) {
        score += SMART_PLAYER_CONSTANTS.WEIGHT_ADVENTURE_TIER_2;
      }
    }

    // Trader tiles are always somewhat useful
    if (tile.tileType === "trader") {
      score += SMART_PLAYER_CONSTANTS.WEIGHT_TRADER;
    }

    // Penalty for longer movements (encourage efficiency)
    score -= steps * 2;

    // Small bonus for staying in place (maintaining position)
    if (steps === 0) {
      score += 5;
    }

    return Math.max(0, score);
  }

  /**
   * Find the safest path avoiding monsters when low on resources
   */
  private findSafestPath(gameState: GameState, player: Player, start: Position, end: Position, possiblePaths: Path[]): Path | null {
    const hasMinHealingResources = this.getTotalHealingResources(player) >= SMART_PLAYER_CONSTANTS.MIN_HEALING_RESOURCES;

    // If we have enough resources, any path is fine
    if (hasMinHealingResources) {
      return possiblePaths[0] || null;
    }

    // Otherwise, find path avoiding monsters
    for (const path of possiblePaths) {
      let pathIsSafe = true;
      for (const pos of path) {
        const tile = gameState.getTile(pos);
        if (tile?.monster) {
          pathIsSafe = false;
          break;
        }
      }
      if (pathIsSafe) {
        return path;
      }
    }

    // If no safe path exists, return the first one (might be risky but necessary)
    return possiblePaths[0] || null;
  }

  /**
   * Generate smart tile action based on context
   */
  private generateSmartTileAction(gameState: GameState, player: Player, tile: Tile): TileAction {
    const tileAction: TileAction = {};

    // Always try to claim resource tiles
    if (tile.tileType === "resource" && !tile.claimedBy) {
      tileAction.claimTile = true;
    }

    // Use trader if available
    if (tile.tileType === "trader") {
      tileAction.useTrader = true;
    }

    // Use mercenary if we have gold and need might
    if (tile.tileType === "mercenary" && player.resources.gold >= GameSettings.MERCENARY_GOLD_COST) {
      tileAction.useMercenary = true;
    }

    // Use temple if we have fame and need might
    if (tile.tileType === "temple" && player.fame >= GameSettings.TEMPLE_FAME_COST) {
      tileAction.useTemple = true;
    }

    // Conquer with might if we have it and the tile is claimed by someone else
    if (tile.claimedBy && tile.claimedBy !== player.name && player.might >= GameSettings.CONQUEST_MIGHT_COST) {
      tileAction.conquerWithMight = true;
    }

    // Incite revolt if we have fame and the tile is claimed by someone else
    if (tile.claimedBy && tile.claimedBy !== player.name && player.fame >= GameSettings.REVOLT_FAME_COST) {
      tileAction.inciteRevolt = true;
    }

    return tileAction;
  }

  /**
 * Check if player is near victory conditions (with gameState access)
 */
  private isNearVictoryWithGameState(gameState: GameState, player: Player): boolean {
    // Check if close to fame victory (within 4 points)
    const nearFameVictory = player.fame >= (GameSettings.VICTORY_FAME_THRESHOLD - 4);

    // Check if close to gold victory (within 5 gold)  
    const nearGoldVictory = player.resources.gold >= (GameSettings.VICTORY_GOLD_THRESHOLD - 5);

    // Check if close to starred tiles victory 
    const starredTileCount = gameState.getStarredTileCount(player.name);
    const nearStarredTileVictory = starredTileCount >= (GameSettings.VICTORY_STARRED_TILES_THRESHOLD - 1);

    // Check if has enough might to challenge the dragon
    const canFightDragon = player.might >= GameSettings.DRAGON_BASE_MIGHT;

    return nearFameVictory || nearGoldVictory || nearStarredTileVictory || canFightDragon;
  }

  /**
 * Check if player is near victory conditions (fallback without gameState)
 */
  private isNearVictory(player: Player): boolean {
    // More conservative check when we don't have gameState
    const nearFameVictory = player.fame >= (GameSettings.VICTORY_FAME_THRESHOLD - 4);
    const nearGoldVictory = player.resources.gold >= (GameSettings.VICTORY_GOLD_THRESHOLD - 5);
    const canFightDragon = player.might >= GameSettings.DRAGON_BASE_MIGHT;

    return nearFameVictory || nearGoldVictory || canFightDragon;
  }

  /**
   * Get total resources that can be used for healing
   */
  private getTotalHealingResources(player: Player): number {
    return player.resources.food + player.resources.wood + player.resources.ore + player.resources.gold;
  }

  /**
   * Explain why a destination was chosen
   */
  private explainDestinationChoice(tile: Tile, score: number, steps: number): string {
    if (tile.tileType === "doomspire") return "going for dragon victory";
    if (tile.tileType === "resource" && !tile.claimedBy) {
      return tile.isStarred ? "claiming starred resource tile" : "claiming resource tile";
    }
    if (tile.tileType === "temple") return "using temple for might";
    if (tile.tileType === "mercenary") return "using mercenary for might";
    if (tile.tileType === "adventure") return `adventure tier ${tile.tier}`;
    if (tile.tileType === "trader") return "visiting trader";
    if (steps === 0) return "staying in place";
    return `moving to ${tile.tileType} tile`;
  }

  /**
   * Prioritize harvest tiles based on current needs
   */
  private prioritizeHarvestTiles(player: Player, claimedTiles: Tile[]): Tile[] {
    const resourceTiles = claimedTiles.filter(t => t.tileType === "resource" && t.resources);

    // Sort by priority: starred tiles first, then by resource needs
    return resourceTiles.sort((a, b) => {
      // Starred tiles always come first
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;

      // Then prioritize based on what we need for buildings/actions
      const scoreA = this.scoreResourceTileForHarvest(player, a);
      const scoreB = this.scoreResourceTileForHarvest(player, b);
      return scoreB - scoreA;
    });
  }

  /**
   * Score a resource tile for harvesting based on current needs
   */
  private scoreResourceTileForHarvest(player: Player, tile: Tile): number {
    if (!tile.resources) return 0;

    let score = 0;
    const resources = tile.resources;

    // We need these resources for market trading
    if (player.buildings.includes("market")) {
      score += (resources.food || 0) * SMART_PLAYER_CONSTANTS.PREFER_SELL_FOOD;
      score += (resources.wood || 0) * SMART_PLAYER_CONSTANTS.PREFER_SELL_WOOD;
      score += (resources.ore || 0) * SMART_PLAYER_CONSTANTS.PREFER_SELL_ORE;
    }

    // We need ore for blacksmith
    if (player.buildings.includes("blacksmith")) {
      score += (resources.ore || 0) * 5;
    }

    // We need wood for fletcher
    if (player.buildings.includes("fletcher")) {
      score += (resources.wood || 0) * 3;
    }

    return score;
  }

  /**
   * Calculate smart market sales based on current needs
   */
  private calculateSmartMarketSales(player: Player): Record<string, number> | null {
    const sales: Record<string, number> = {};

    // Only sell if we need gold for something important
    const needsGold = this.playerNeedsGold(player);
    if (!needsGold) return null;

    // Sell in order of preference (least needed first)
    const sellOrder: Array<{ resource: ResourceType; amount: number }> = [
      { resource: "food", amount: player.resources.food },
      { resource: "wood", amount: player.resources.wood },
      { resource: "ore", amount: player.resources.ore },
    ];

    // Sort by preference (sell ore last since it's needed for blacksmith)
    sellOrder.sort((a, b) => {
      const prefA = this.getResourceSellPreference(player, a.resource);
      const prefB = this.getResourceSellPreference(player, b.resource);
      return prefA - prefB;
    });

    for (const { resource, amount } of sellOrder) {
      if (amount >= GameSettings.MARKET_EXCHANGE_RATE) {
        const sellAmount = Math.min(amount, 4); // Don't sell everything
        sales[resource] = sellAmount;
        break; // Only sell one type of resource at a time
      }
    }

    return Object.keys(sales).length > 0 ? sales : null;
  }

  /**
   * Check if player needs gold for important purchases
   */
  private playerNeedsGold(player: Player): boolean {
    // Always try to get to victory gold threshold
    if (player.resources.gold < GameSettings.VICTORY_GOLD_THRESHOLD) {
      return true;
    }

    // Need gold for champion recruitment
    if (player.champions.length < GameSettings.MAX_CHAMPIONS_PER_PLAYER) {
      return player.resources.gold < (GameSettings.CHAMPION_COST.gold + 5); // Keep buffer
    }

    // Need gold for mercenary usage
    if (player.resources.gold < (GameSettings.MERCENARY_GOLD_COST + 3)) {
      return true;
    }

    // Need gold for boat building
    if (player.boats.length < GameSettings.MAX_BOATS_PER_PLAYER) {
      return player.resources.gold < (GameSettings.BOAT_COST.gold + 3);
    }

    // Need gold for chapel
    if (!player.buildings.includes("chapel") && !player.buildings.includes("monastery")) {
      return player.resources.gold < (GameSettings.CHAPEL_COST.gold + 2);
    }

    // Sell excess resources if we have too many (prevent hoarding)
    // CRITICAL: Any single resource > 6 is excessive hoarding (be more aggressive)
    if (player.resources.food > 6 || player.resources.wood > 6 || player.resources.ore > 6) {
      return true;
    }

    // Also check total resources (lower threshold)
    const totalResources = player.resources.food + player.resources.wood + player.resources.ore;
    if (totalResources > 12) {
      return true;
    }

    return false;
  }

  /**
   * Get preference order for selling resources (lower = sell first)
   */
  private getResourceSellPreference(player: Player, resource: ResourceType): number {
    // Never sell gold
    if (resource === "gold") return 999;

    // Don't sell ore if we have blacksmith (need it for usage)
    if (resource === "ore" && player.buildings.includes("blacksmith")) {
      return 10;
    }

    // Don't sell wood if we have fletcher (need it for usage)
    if (resource === "wood" && player.buildings.includes("fletcher")) {
      return 8;
    }

    // Default preferences
    switch (resource) {
      case "food": return SMART_PLAYER_CONSTANTS.PREFER_SELL_FOOD;
      case "wood": return SMART_PLAYER_CONSTANTS.PREFER_SELL_WOOD;
      case "ore": return SMART_PLAYER_CONSTANTS.PREFER_SELL_ORE;
      default: return 5;
    }
  }

  /**
   * Get smart build action based on current priorities
   */
  private getSmartBuildAction(player: Player): BuildAction | null {
    const buildOptions: Array<{ action: BuildAction; priority: number; affordable: boolean }> = [];

    // Market (highest priority - needed for selling resources)
    if (!player.buildings.includes("market")) {
      buildOptions.push({
        action: "market",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_MARKET,
        affordable: canAfford(player, GameSettings.MARKET_COST)
      });
    }

    // Blacksmith (high priority for might)
    if (!player.buildings.includes("blacksmith")) {
      buildOptions.push({
        action: "blacksmith",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_BLACKSMITH,
        affordable: canAfford(player, GameSettings.BLACKSMITH_COST)
      });
    }

    // Fletcher (high priority for might, but lower than blacksmith)
    if (!player.buildings.includes("fletcher") && !player.buildings.includes("blacksmith")) {
      buildOptions.push({
        action: "fletcher",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_FLETCHER,
        affordable: canAfford(player, GameSettings.FLETCHER_COST)
      });
    }

    // Champion recruitment
    if (player.champions.length < GameSettings.MAX_CHAMPIONS_PER_PLAYER) {
      buildOptions.push({
        action: "recruitChampion",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_CHAMPION,
        affordable: canAfford(player, GameSettings.CHAMPION_COST)
      });
    }

    // Boat building
    if (player.boats.length < GameSettings.MAX_BOATS_PER_PLAYER) {
      buildOptions.push({
        action: "buildBoat",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_BOAT,
        affordable: canAfford(player, GameSettings.BOAT_COST)
      });
    }

    // Chapel
    if (!player.buildings.includes("chapel") && !player.buildings.includes("monastery")) {
      buildOptions.push({
        action: "chapel",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_CHAPEL,
        affordable: canAfford(player, GameSettings.CHAPEL_COST)
      });
    }

    // Monastery upgrade
    if (player.buildings.includes("chapel") && !player.buildings.includes("monastery")) {
      buildOptions.push({
        action: "upgradeChapelToMonastery",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_MONASTERY,
        affordable: canAfford(player, GameSettings.MONASTERY_COST)
      });
    }

    // Warship upgrade
    if (!player.buildings.includes("warshipUpgrade")) {
      buildOptions.push({
        action: "warshipUpgrade",
        priority: SMART_PLAYER_CONSTANTS.BUILDING_PRIORITY_WARSHIP,
        affordable: canAfford(player, GameSettings.WARSHIP_UPGRADE_COST)
      });
    }

    // Filter to only affordable options and sort by priority
    const affordableOptions = buildOptions.filter(o => o.affordable);
    if (affordableOptions.length === 0) return null;

    affordableOptions.sort((a, b) => b.priority - a.priority);
    return affordableOptions[0].action;
  }
}
