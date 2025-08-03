// Lords of Doomspire Evolutionary AI Player
// Uses simple heuristics with evolvable parameters

import { GameState } from "@/game/GameState";
import { PlayerAgent } from "./PlayerAgent";
import { BuildingDecision, DiceAction, ChampionAction, HarvestAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext, Position, Tile } from "@/lib/types";
import { TraderCard } from "@/lib/cards";
import { canAfford, deductCost } from "./PlayerUtils";
import { GameSettings } from "@/lib/GameSettings";

// Central tiles where doomspire is located
const DOOMSPIRE_TILES: Position[] = [
  { row: 3, col: 3 },
  { row: 3, col: 4 },
  { row: 4, col: 3 },
  { row: 4, col: 4 },
];

/**
 * Simple genome representing an AI player's strategy
 */
export interface PlayerGenome {
  // Combat behavior (0-1 values)
  combatRiskTolerance: number;        // Minimum win probability to engage (0.0 = never fight, 1.0 = always fight)

  // Economic behavior (0-1 values)
  economicFocus: number;              // Priority for resource tiles vs other actions
  territorialAggression: number;      // Willingness to claim/conquer tiles

  // Exploration behavior (0-1 values)
  explorationAggression: number;      // Preference for higher tier adventures

  // Victory path preferences (0-1 values, should roughly sum to 1)
  famePathWeight: number;             // Focus on fame victory
  goldPathWeight: number;             // Focus on gold victory  
  territorialPathWeight: number;      // Focus on territorial victory
  combatPathWeight: number;           // Focus on combat victory

  // Defensive behavior (0-1 values)
  defensivePosture: number;           // How much to protect vs expand

  // Dragon-seeking behavior (0-1 values)
  dragonTimingAggression: number;     // How quickly to attempt dragon when conditions are met
  safetyMarginPreference: number;     // Preference for exceeding victory thresholds before attempting
}

/**
 * Generates a random genome with reasonable defaults
 */
export function generateRandomGenome(): PlayerGenome {
  // Ensure victory path weights sum to approximately 1
  const pathWeights = [Math.random(), Math.random(), Math.random(), Math.random()];
  const sum = pathWeights.reduce((a, b) => a + b, 0);
  const normalizedWeights = pathWeights.map(w => w / sum);

  return {
    combatRiskTolerance: 0.3 + Math.random() * 0.4, // 0.3-0.7 range
    economicFocus: Math.random(),
    territorialAggression: Math.random(),
    explorationAggression: Math.random(),
    famePathWeight: normalizedWeights[0],
    goldPathWeight: normalizedWeights[1],
    territorialPathWeight: normalizedWeights[2],
    combatPathWeight: normalizedWeights[3],
    defensivePosture: Math.random(),
    dragonTimingAggression: Math.random(),
    safetyMarginPreference: Math.random(),
  };
}

/**
 * Mutates a genome by adjusting parameters slightly
 */
export function mutateGenome(genome: PlayerGenome, mutationRate: number = 0.1): PlayerGenome {
  const mutated = { ...genome };

  // Mutate each parameter with given probability
  Object.keys(mutated).forEach(key => {
    if (Math.random() < mutationRate) {
      const currentValue = (mutated as any)[key];
      const mutation = (Math.random() - 0.5) * 0.2; // ±10% mutation
      (mutated as any)[key] = Math.max(0, Math.min(1, currentValue + mutation));
    }
  });

  // Renormalize victory path weights
  const totalWeight = mutated.famePathWeight + mutated.goldPathWeight +
    mutated.territorialPathWeight + mutated.combatPathWeight;
  if (totalWeight > 0) {
    mutated.famePathWeight /= totalWeight;
    mutated.goldPathWeight /= totalWeight;
    mutated.territorialPathWeight /= totalWeight;
    mutated.combatPathWeight /= totalWeight;
  }

  return mutated;
}

export class EvolutionaryPlayer implements PlayerAgent {
  private genome: PlayerGenome;
  private playerName: string;

  constructor(genome?: PlayerGenome, name?: string) {
    this.genome = genome || generateRandomGenome();
    this.playerName = name || "EvolutionaryAI";
  }

  getName(): string {
    return this.playerName;
  }

  getType(): PlayerType {
    return "tactical"; // Using tactical type for now
  }

  getGenome(): PlayerGenome {
    return { ...this.genome };
  }

  setGenome(genome: PlayerGenome): void {
    this.genome = { ...genome };
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
    const player = gameState.getPlayer(this.playerName);
    if (!player) return undefined;

    const assessment = this.analyzeGameState(gameState, player);
    const dragonStatus = this.meetsVictoryConditions(gameState, player);

    let statusMessage = `Strategic Focus: ${assessment.primaryVictoryPath} | ` +
      `Territorial control: ${assessment.territorialScore.toFixed(1)} | ` +
      `Combat readiness: ${assessment.combatReadiness.toFixed(1)} | ` +
      `Economic strength: ${assessment.economicScore.toFixed(1)}`;

    if (dragonStatus.canAttemptDragon) {
      statusMessage += ` | DRAGON READY (${dragonStatus.conditionsMet.join(", ")})`;
      if (dragonStatus.shouldAttempt) {
        statusMessage += " - SEEKING DOOMSPIRE";
      }
    }

    return statusMessage;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const player = gameState.getPlayer(this.playerName);
    if (!player) {
      throw new Error(`Player ${this.playerName} not found`);
    }

    // Simple decision: if we can harvest, do that with lower dice
    // Otherwise, move champions with higher dice
    const dice = turnContext.remainingDiceValues.sort((a, b) => b - a);

    if (dice.length === 0) {
      throw new Error("No dice available for action");
    }

    // Decide between champion action and harvest
    const shouldHarvest = this.shouldPrioritizeHarvest(gameState, player, dice);

    if (shouldHarvest && this.canHarvestAnything(gameState, player)) {
      return this.createHarvestAction(gameState, player, dice);
    } else {
      return this.createChampionAction(gameState, player, dice[0]);
    }
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision> {
    // Simple decision making - choose first option for now
    // TODO: Make this smarter based on heuristics
    return {
      choice: decisionContext.options[0]?.id || "default",
      reasoning: "Simple heuristic choice"
    };
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    // Simple trader logic - don't trade for now
    return {
      actions: [],
      reasoning: "Conservative trading approach"
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
      throw new Error(`Player ${playerName} not found`);
    }

    // Simple building strategy based on genome
    const decision: BuildingDecision = {
      reasoning: "Evolutionary heuristic building decision"
    };

    // PRIORITY: Use market to sell resources for gold victory if possible
    if (player.buildings.includes("market")) {
      const currentGold = player.resources.gold;
      const convertibleResources = player.resources.food + player.resources.wood + player.resources.ore;
      const maxPossibleGold = currentGold + Math.floor(convertibleResources / 2);

      // If we can achieve gold victory by selling resources, DO IT!
      if (maxPossibleGold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
        const goldNeeded = GameSettings.VICTORY_GOLD_THRESHOLD - currentGold;
        const resourcesToSell = Math.min(convertibleResources, goldNeeded * 2);

        if (resourcesToSell > 0) {
          // Prioritize selling ore > wood > food (ore is usually most abundant)
          const sellDecision: Record<string, number> = {};
          let remaining = resourcesToSell;

          if (remaining > 0 && player.resources.ore > 0) {
            const oreToSell = Math.min(player.resources.ore, remaining);
            sellDecision.ore = oreToSell;
            remaining -= oreToSell;
          }
          if (remaining > 0 && player.resources.wood > 0) {
            const woodToSell = Math.min(player.resources.wood, remaining);
            sellDecision.wood = woodToSell;
            remaining -= woodToSell;
          }
          if (remaining > 0 && player.resources.food > 0) {
            const foodToSell = Math.min(player.resources.food, remaining);
            sellDecision.food = foodToSell;
            remaining -= foodToSell;
          }

          decision.buildingUsageDecision = { sellAtMarket: sellDecision };
          decision.reasoning = `VICTORY CONVERSION: Selling resources for gold victory (need ${goldNeeded} more gold)`;
          return decision;
        }
      }
    }

    // Use blacksmith if we have it and need might
    if (player.buildings.includes("blacksmith") && player.might < 3) {
      if (canAfford(player, GameSettings.BLACKSMITH_USAGE_COST)) {
        decision.buildingUsageDecision = { useBlacksmith: true };
        return decision;
      }
    }

    // PRIORITY: Build market if we need it for victory conversion
    if (!player.buildings.includes("market")) {
      const convertibleResources = player.resources.food + player.resources.wood + player.resources.ore;
      const currentGold = player.resources.gold;
      const potentialGoldWithMarket = currentGold + Math.floor(convertibleResources / 2);

      // Build market if it would enable victory AND we can afford it
      if (potentialGoldWithMarket >= GameSettings.VICTORY_GOLD_THRESHOLD &&
        canAfford(player, GameSettings.MARKET_COST)) {
        decision.buildAction = "market";
        decision.reasoning = `VICTORY ENABLER: Building market to convert ${convertibleResources} resources to gold for victory`;
        return decision;
      }
    }

    // Build based on victory path preferences
    const preferredBuild = this.chooseBuildAction(gameState, player);
    if (preferredBuild) {
      decision.buildAction = preferredBuild;
    }

    return decision;
  }

  /**
   * Analyze current game state and return strategic assessment
   */
  private analyzeGameState(gameState: GameState, player: any) {
    const claimedTiles = gameState.getClaimedTiles(player.name);
    const starredTiles = gameState.getStarredTileCount(player.name);

    const territorialScore = claimedTiles.length + starredTiles * 2;
    const combatReadiness = player.might + player.champions.length;
    const economicScore = player.resources.gold + player.resources.food + player.resources.wood + player.resources.ore;

    // Determine primary victory path based on genome weights
    const pathScores = {
      fame: this.genome.famePathWeight * player.fame,
      gold: this.genome.goldPathWeight * player.resources.gold,
      territorial: this.genome.territorialPathWeight * territorialScore,
      combat: this.genome.combatPathWeight * combatReadiness
    };

    const primaryVictoryPath = Object.entries(pathScores)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      territorialScore,
      combatReadiness,
      economicScore,
      primaryVictoryPath
    };
  }

  /**
   * Decide whether to prioritize harvest over movement
   */
  private shouldPrioritizeHarvest(gameState: GameState, player: any, dice: number[]): boolean {
    const claimedTiles = gameState.getClaimedTiles(player.name);
    const harvestableTiles = claimedTiles.filter(tile =>
      tile.tileType === "resource" && !gameState.getClaimBlockader(tile)
    );

    // Harvest if we have many tiles and economic focus is high
    return harvestableTiles.length >= 2 && this.genome.economicFocus > 0.6;
  }

  /**
   * Check if player can harvest from any tiles
   */
  private canHarvestAnything(gameState: GameState, player: any): boolean {
    const claimedTiles = gameState.getClaimedTiles(player.name);
    return claimedTiles.some(tile =>
      tile.tileType === "resource" && !gameState.getClaimBlockader(tile)
    );
  }

  /**
   * Create a harvest action
   */
  private createHarvestAction(gameState: GameState, player: any, dice: number[]): DiceAction {
    const claimedTiles = gameState.getClaimedTiles(player.name);
    const harvestableTiles = claimedTiles.filter(tile =>
      tile.tileType === "resource" && !gameState.getClaimBlockader(tile)
    );

    // Use all dice for harvesting if we have many tiles
    const diceToUse = dice.slice(0, Math.min(dice.length, harvestableTiles.length));
    const tilesToHarvest = harvestableTiles.slice(0, diceToUse.reduce((sum, d) => sum + d, 0));

    return {
      actionType: "harvestAction",
      harvestAction: {
        diceValuesUsed: diceToUse,
        tilePositions: tilesToHarvest.map(tile => tile.position)
      },
      reasoning: "Economic focus harvest"
    };
  }

  /**
   * Create a champion movement action
   */
  private createChampionAction(gameState: GameState, player: any, diceValue: number): DiceAction {
    // Simple logic: move first champion towards nearest unclaimed resource tile
    const champion = player.champions[0];
    if (!champion) {
      throw new Error("No champions available");
    }

    // Find nearby unclaimed resource tiles
    const targetTile = this.findBestMoveTarget(gameState, champion.position);

    if (targetTile) {
      // Calculate simple path (just move towards target)
      const path = this.calculateSimplePath(champion.position, targetTile.position, diceValue);

      return {
        actionType: "championAction",
        championAction: {
          diceValueUsed: diceValue,
          championId: champion.id,
          movementPathIncludingStartPosition: path,
          tileAction: targetTile.tileType === "resource" && !targetTile.claimedBy ?
            { claimTile: true } : undefined
        },
        reasoning: `Moving towards ${targetTile.tileType} tile`
      };
    }

    // Fallback: don't move
    return {
      actionType: "championAction",
      championAction: {
        diceValueUsed: diceValue,
        championId: champion.id,
        movementPathIncludingStartPosition: [champion.position]
      },
      reasoning: "No good move found, staying put"
    };
  }

  /**
   * Check if player meets any victory conditions for dragon attempt
   */
  private meetsVictoryConditions(gameState: GameState, player: any): {
    canAttemptDragon: boolean;
    conditionsMet: string[];
    shouldAttempt: boolean;
  } {
    const conditionsMet: string[] = [];

    // Fame victory: 15+ fame
    if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
      conditionsMet.push("fame");
    }

    // Gold victory: 12+ gold (using VICTORY_GOLD_THRESHOLD)
    // Include convertible wealth if player has market building
    const directGold = player.resources.gold;
    const convertibleResources = player.resources.food + player.resources.wood + player.resources.ore;
    const hasMarket = player.buildings.includes('market');
    const totalAvailableGold = directGold + (hasMarket ? Math.floor(convertibleResources / 2) : 0);

    if (totalAvailableGold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
      conditionsMet.push("gold");
    }

    // Territorial victory: 4+ starred tiles
    const starredTiles = gameState.getStarredTileCount(player.name);
    if (starredTiles >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
      conditionsMet.push("territorial");
    }

    // Combat victory: always possible but depends on risk tolerance
    const combatReadiness = player.might + player.champions.length;
    if (combatReadiness >= 5 && this.genome.combatPathWeight > 0.5) {
      conditionsMet.push("combat");
    }

    const canAttemptDragon = conditionsMet.length > 0;

    // Apply safety margin and timing preferences
    let shouldAttempt = false;
    if (canAttemptDragon) {
      // Higher dragonTimingAggression = more likely to go early
      // Higher safetyMarginPreference = want to exceed thresholds more
      const aggressionThreshold = 0.5 + (this.genome.dragonTimingAggression * 0.4); // More aggressive base
      const hasExtraMargin = player.fame >= 18 || player.resources.gold >= 18 || starredTiles >= 5;

      // If we have significant excess resources, always attempt
      if (player.fame >= 20 || player.resources.gold >= 20 || starredTiles >= 6) {
        shouldAttempt = true;
      } else if (this.genome.safetyMarginPreference < 0.5 || hasExtraMargin) {
        shouldAttempt = Math.random() < aggressionThreshold;
      }
    }

    return { canAttemptDragon, conditionsMet, shouldAttempt };
  }

  /**
   * Find the best tile to move towards
   */
  private findBestMoveTarget(gameState: GameState, fromPosition: Position): Tile | null {
    const player = gameState.getPlayer(this.playerName);
    if (!player) return null;

    const dragonStatus = this.meetsVictoryConditions(gameState, player);

    let bestTile: Tile | null = null;
    let bestScore = -1;

    // Check all tiles on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const tile = gameState.getTile({ row, col });
        if (!tile) continue;

        const score = this.scoreTileTarget(tile, fromPosition, dragonStatus);
        if (score > bestScore) {
          bestScore = score;
          bestTile = tile;
        }
      }
    }

    return bestTile;
  }

  /**
 * Score how attractive a tile is as a movement target
 */
  private scoreTileTarget(tile: Tile, fromPosition: Position, dragonStatus?: { canAttemptDragon: boolean; conditionsMet: string[]; shouldAttempt: boolean }): number {
    let score = 0;
    const distance = Math.abs(tile.position.row - fromPosition.row) +
      Math.abs(tile.position.col - fromPosition.col);

    // DRAGON SEEKING: Massive bonus for central tiles if ready for dragon
    if (dragonStatus?.shouldAttempt) {
      const isCentralTile = DOOMSPIRE_TILES.some(pos =>
        pos.row === tile.position.row && pos.col === tile.position.col
      );

      if (isCentralTile) {
        // Huge bonus for central tiles when ready for dragon
        score += 1000;

        // If it's doomspire itself, even bigger bonus
        if (tile.tileType === "doomspire") {
          score += 2000;
        }

        // Prefer closer central tiles
        score -= distance * 2;
        return score; // Return early, dragon-seeking overrides other considerations
      }
    }

    // Normal scoring for non-dragon situations

    // Prefer closer tiles
    score -= distance * 0.5;

    // Resource tiles are attractive if unclaimed
    if (tile.tileType === "resource" && !tile.claimedBy) {
      score += this.genome.economicFocus * 10;
      if (tile.isStarred) {
        score += this.genome.territorialPathWeight * 5;
      }
    }

    // Adventure tiles for fame
    if (tile.tileType === "adventure" && tile.adventureTokens && tile.adventureTokens > 0) {
      score += this.genome.famePathWeight * 8;
      // Higher tier = higher risk/reward
      if (tile.tier) {
        score += this.genome.explorationAggression * tile.tier * 2;
      }
    }

    // Central tiles get bonus points even when not ready (for exploration)
    const isCentralTile = DOOMSPIRE_TILES.some(pos =>
      pos.row === tile.position.row && pos.col === tile.position.col
    );
    if (isCentralTile && !tile.explored) {
      score += this.genome.explorationAggression * 5;
    }

    return score;
  }

  /**
   * Calculate a simple movement path towards a target
   */
  private calculateSimplePath(from: Position, to: Position, maxSteps: number): Position[] {
    const path = [from];
    let current = { ...from };

    for (let step = 0; step < maxSteps; step++) {
      const deltaRow = to.row - current.row;
      const deltaCol = to.col - current.col;

      if (deltaRow === 0 && deltaCol === 0) break;

      // Move one step closer (prefer horizontal first)
      if (Math.abs(deltaCol) > Math.abs(deltaRow)) {
        current = { row: current.row, col: current.col + Math.sign(deltaCol) };
      } else {
        current = { row: current.row + Math.sign(deltaRow), col: current.col };
      }

      // Ensure we stay on the board
      current.row = Math.max(0, Math.min(7, current.row));
      current.col = Math.max(0, Math.min(7, current.col));

      path.push({ ...current });
    }

    return path;
  }

  /**
   * Choose what to build based on genome preferences
   */
  private chooseBuildAction(gameState: GameState, player: any): any {
    // Simple building priorities based on genome

    // Economic buildings
    if (this.genome.economicFocus > 0.6) {
      if (!player.buildings.includes("market")) {
        if (canAfford(player, GameSettings.MARKET_COST)) return "market";
      }
    }

    // Combat buildings  
    if (this.genome.combatPathWeight > 0.4) {
      if (!player.buildings.includes("blacksmith")) {
        if (canAfford(player, GameSettings.BLACKSMITH_COST)) return "blacksmith";
      }
    }

    // More champions if we can afford them
    if (player.champions.length < 3) {
      if (canAfford(player, GameSettings.CHAMPION_COST)) return "recruitChampion";
    }

    return null;
  }
}