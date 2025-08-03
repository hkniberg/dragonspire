// Lords of Doomspire - TacticalLord AI Player
// A strategic AI player focused on efficient resource management and tactical decision-making

import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction, ChampionAction, BoatAction, HarvestAction, BuildAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { GameSettings } from "@/lib/GameSettings";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { getTraderItemById } from "@/content/traderItems";
import {
  AdventureThemeType, Decision, DecisionContext, GameLogEntry, PlayerType,
  TurnContext, Position, ResourceType, Tile, Champion, Player
} from "@/lib/types";
import { getManhattanDistance } from "@/lib/utils";
import {
  canAfford, deductCost, getReachableTiles, getHarvestableResourcesInfo,
  getUsableBuildings, canChampionCarryMoreItems, generateAllPaths
} from "@/players/PlayerUtils";
import { PlayerAgent } from "./PlayerAgent";

interface VictoryPathAnalysis {
  fame: { current: number; needed: number; feasibility: number; priority: number };
  gold: { current: number; needed: number; feasibility: number; priority: number };
  economy: { current: number; needed: number; feasibility: number; priority: number };
  combat: { feasibility: number; priority: number };
}

interface TileValue {
  tile: Tile;
  value: number;
  reason: string;
}

export class TacticalLord implements PlayerAgent {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  getType(): PlayerType {
    return "tactical";
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
    const player = gameState.getPlayer(this.name);
    if (!player) return undefined;

    const analysis = this.analyzeVictoryPaths(gameState, player);
    const primaryPath = this.selectPrimaryVictoryPath(analysis);
    const threats = this.assessOpponentThreats(gameState, player);

    let assessment = `=== TacticalLord Strategic Assessment (Turn ${turnNumber}) ===\n\n`;

    assessment += `Primary Strategy: ${primaryPath.toUpperCase()}\n`;
    assessment += `Progress: ${this.formatProgress(analysis, primaryPath)}\n\n`;

    assessment += `Resource Status: ${this.formatResources(player.resources)}\n`;
    assessment += `Fame: ${player.fame}, Might: ${player.might}\n`;
    assessment += `Buildings: ${player.buildings.length > 0 ? player.buildings.join(", ") : "None"}\n\n`;

    if (threats.length > 0) {
      assessment += `Threats: ${threats.join(", ")}\n\n`;
    }

    assessment += `Dice Available: [${diceValues.join(", ")}]\n`;
    assessment += `Planned Focus: ${this.getPhasePlan(gameState, player, primaryPath, turnNumber)}`;

    return assessment;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const player = gameState.getPlayer(this.name);
    if (!player) {
      throw new Error(`Player ${this.name} not found`);
    }

    thinkingLogger?.(`Analyzing dice action with remaining dice: [${turnContext.remainingDiceValues.join(", ")}]`);

    // Analyze current situation and select primary strategy
    const analysis = this.analyzeVictoryPaths(gameState, player);
    const primaryPath = this.selectPrimaryVictoryPath(analysis);

    thinkingLogger?.(`Primary victory path: ${primaryPath}`);

    // Prioritize actions based on strategy and game state
    const actionOptions = this.generateActionOptions(gameState, player, turnContext.remainingDiceValues);
    const bestAction = this.selectBestAction(actionOptions, gameState, player, primaryPath);

    thinkingLogger?.(`Selected action: ${bestAction.actionType} with reasoning: ${bestAction.reasoning}`);

    return bestAction;
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision> {
    const player = gameState.getPlayer(this.name);
    if (!player) {
      throw new Error(`Player ${this.name} not found`);
    }

    thinkingLogger?.(`Making decision: ${decisionContext.description}`);

    // For combat decisions, calculate odds
    if (decisionContext.description.includes("combat") || decisionContext.description.includes("fight")) {
      return this.makeCombatDecision(decisionContext, gameState, player);
    }

    // For item decisions, prioritize useful items
    if (decisionContext.description.includes("item") || decisionContext.description.includes("drop")) {
      return this.makeItemDecision(decisionContext, player);
    }

    // For adventure theme selection, pick based on current needs
    if (decisionContext.options.some(opt => opt.id.includes("beast") || opt.id.includes("cave") || opt.id.includes("grove"))) {
      return this.makeAdventureThemeDecision(decisionContext, player);
    }

    // Default: pick the first reasonable option
    const choice = decisionContext.options[0];
    return {
      choice: choice.id,
      reasoning: `Default choice: ${choice.description}`
    };
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    const playerResources = traderContext.playerResources;
    const availableItems = traderContext.availableItems;

    thinkingLogger?.(`Making trader decision for ${availableItems.length} items`);

    // Get current player to analyze strategy
    const player = gameState.getPlayer(this.name);
    if (!player) {
      return { actions: [], reasoning: "Player not found" };
    }

    // Prioritize useful items based on current strategy
    const analysis = this.analyzeVictoryPaths(gameState, player);
    const primaryPath = this.selectPrimaryVictoryPath(analysis);

    // Look for high-value items
    for (const item of availableItems) {
      const traderItem = getTraderItemById(item.id);
      if (!traderItem) continue;

      if (playerResources.gold >= traderItem.cost) {
        // Prioritize backpack for item capacity
        if (traderItem.id === "backpack") {
          return {
            actions: [{
              type: "buyItem",
              itemId: item.id
            }],
            reasoning: "Buying backpack for increased item capacity"
          };
        }

        // Buy useful combat items
        if (traderItem.cost <= 2 && playerResources.gold >= traderItem.cost) {
          return {
            actions: [{
              type: "buyItem",
              itemId: item.id
            }],
            reasoning: `Buying ${traderItem.name} for tactical advantage`
          };
        }
      }
    }

    // Convert resources if needed (using trader's 2:1 exchange rate)
    const mostNeededResource = this.getMostNeededResource(player, analysis, primaryPath);
    if (mostNeededResource && this.hasExcessResources(playerResources)) {
      const excessResource = this.getExcessResource(playerResources);
      if (excessResource && excessResource !== mostNeededResource) {
        return {
          actions: [{
            type: "sellResources",
            resourcesSold: { [excessResource]: 2 } as Record<string, number>,
            resourceRequested: mostNeededResource
          }],
          reasoning: `Converting 2 ${excessResource} to 1 ${mostNeededResource}`
        };
      }
    }

    return {
      actions: [],
      reasoning: "No beneficial trades available"
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

    thinkingLogger?.(`Deciding building usage and construction`);

    const analysis = this.analyzeVictoryPaths(gameState, player);
    const primaryPath = this.selectPrimaryVictoryPath(analysis);

    // Decide building usage
    const buildingUsage = this.decideBuildingUsage(player, primaryPath);

    // Decide what to build
    const buildAction = this.decideBuildAction(gameState, player, primaryPath, analysis);

    return {
      buildingUsageDecision: buildingUsage,
      buildAction,
      reasoning: `Primary path: ${primaryPath}, Building: ${buildAction || "none"}`
    };
  }

  // === PRIVATE HELPER METHODS ===

  private analyzeVictoryPaths(gameState: GameState, player: Player): VictoryPathAnalysis {
    const starredTiles = gameState.getStarredTileCount(player.name);

    return {
      fame: {
        current: player.fame,
        needed: 15,
        feasibility: Math.min(1.0, (player.fame + 5) / 15), // Estimate potential fame gain
        priority: player.fame >= 10 ? 3 : 1
      },
      gold: {
        current: player.resources.gold,
        needed: 12,
        feasibility: Math.min(1.0, (player.resources.gold + this.estimateGoldPotential(gameState, player)) / 12),
        priority: player.resources.gold >= 8 ? 3 : 2
      },
      economy: {
        current: starredTiles,
        needed: 4,
        feasibility: Math.min(1.0, (starredTiles + this.countAvailableStarredTiles(gameState)) / 4),
        priority: starredTiles >= 2 ? 3 : 1
      },
      combat: {
        feasibility: Math.min(1.0, player.might / 8), // Dragon has 8 might
        priority: player.might >= 4 ? 2 : 0
      }
    };
  }

  private selectPrimaryVictoryPath(analysis: VictoryPathAnalysis): string {
    // 🏆 If we already have enough for any victory condition, prioritize that!
    if (analysis.gold.current >= 12) return "gold";
    if (analysis.fame.current >= 15) return "fame";
    if (analysis.economy.current >= 4) return "economy";

    // 💰 Strongly prefer gold path - it's most reliable and achievable
    if (analysis.gold.feasibility >= 0.3) return "gold";

    const paths = Object.entries(analysis).map(([path, data]) => ({
      path,
      score: data.feasibility * data.priority
    }));

    paths.sort((a, b) => b.score - a.score);
    return paths[0].path;
  }

  private generateActionOptions(gameState: GameState, player: Player, diceValues: number[]): DiceAction[] {
    const options: DiceAction[] = [];

    // Consider champion actions with each die
    for (const dieValue of diceValues) {
      for (const champion of player.champions) {
        const championOptions = this.generateChampionActionOptions(gameState, player, champion, dieValue);
        options.push(...championOptions);
      }

      // Consider boat actions
      for (const boat of player.boats) {
        const boatOptions = this.generateBoatActionOptions(gameState, player, boat, dieValue);
        options.push(...boatOptions);
      }
    }

    // Consider harvest actions using multiple dice
    const harvestOptions = this.generateHarvestActionOptions(gameState, player, diceValues);
    options.push(...harvestOptions);

    return options;
  }

  private generateChampionActionOptions(gameState: GameState, player: Player, champion: Champion, dieValue: number): DiceAction[] {
    const options: DiceAction[] = [];
    const reachableTiles = getReachableTiles(gameState, champion.position, dieValue, champion.id, player.name);

    // Stay and interact with current tile
    options.push({
      actionType: "championAction",
      championAction: {
        diceValueUsed: dieValue,
        championId: champion.id,
        movementPathIncludingStartPosition: [champion.position],
        tileAction: this.decideTileAction(gameState, champion.position, player)
      },
      reasoning: `Champion${champion.id} stays and interacts with current tile`
    });

    // 🏆 PRIORITY: Always check if Doomspire is reachable for victory!
    if (this.canWinAtDoomspire(gameState, player)) {
      const doomspireTile = this.findDoomspireTile(gameState);

      if (doomspireTile) {
        // Doomspire has been found! Go there to win!
        if (reachableTiles.some(pos => pos.row === doomspireTile.position.row && pos.col === doomspireTile.position.col)) {
          const paths = generateAllPaths(gameState, champion.position, doomspireTile.position, dieValue, champion.id, player.name);
          if (paths.length > 0) {
            options.push({
              actionType: "championAction",
              championAction: {
                diceValueUsed: dieValue,
                championId: champion.id,
                movementPathIncludingStartPosition: paths[0],
                tileAction: this.decideTileAction(gameState, doomspireTile.position, player)
              },
              reasoning: `🏆 Champion${champion.id} moves to DOOMSPIRE for VICTORY!`
            });
          }
        } else {
          // Move toward known Doomspire
          const pathTowardDoomspire = this.getPathTowardDoomspire(gameState, champion.position, doomspireTile.position, dieValue, champion.id, player.name, reachableTiles);
          if (pathTowardDoomspire) {
            options.push({
              actionType: "championAction",
              championAction: {
                diceValueUsed: dieValue,
                championId: champion.id,
                movementPathIncludingStartPosition: pathTowardDoomspire.path,
                tileAction: this.decideTileAction(gameState, pathTowardDoomspire.targetPos, player)
              },
              reasoning: `🚀 Champion${champion.id} moves toward DOOMSPIRE (${pathTowardDoomspire.distance} tiles away)!`
            });
          }
        }
      } else {
        // Doomspire not found yet! Prioritize exploring center tiles to find it!
        const unexploredCandidates = this.getUnexploredDoomspireCandidates(gameState);
        for (const candidateTile of unexploredCandidates) {
          if (reachableTiles.some(pos => pos.row === candidateTile.position.row && pos.col === candidateTile.position.col)) {
            const paths = generateAllPaths(gameState, champion.position, candidateTile.position, dieValue, champion.id, player.name);
            if (paths.length > 0) {
              options.push({
                actionType: "championAction",
                championAction: {
                  diceValueUsed: dieValue,
                  championId: champion.id,
                  movementPathIncludingStartPosition: paths[0],
                  tileAction: this.decideTileAction(gameState, candidateTile.position, player)
                },
                reasoning: `🔍 Champion${champion.id} explores center tile (${candidateTile.position.row},${candidateTile.position.col}) to find DOOMSPIRE!`
              });
            }
          }
        }

        // If can't reach any candidate directly, move toward center
        if (unexploredCandidates.length > 0) {
          const centerTarget = unexploredCandidates[0]; // Pick first unexplored candidate
          const pathTowardCenter = this.getPathTowardDoomspire(gameState, champion.position, centerTarget.position, dieValue, champion.id, player.name, reachableTiles);
          if (pathTowardCenter) {
            options.push({
              actionType: "championAction",
              championAction: {
                diceValueUsed: dieValue,
                championId: champion.id,
                movementPathIncludingStartPosition: pathTowardCenter.path,
                tileAction: this.decideTileAction(gameState, pathTowardCenter.targetPos, player)
              },
              reasoning: `🧭 Champion${champion.id} moves toward center to search for DOOMSPIRE (${pathTowardCenter.distance} away)!`
            });
          }
        }
      }
    }

    // Move to valuable tiles (consider more options now that exploration is important)
    for (const targetPos of reachableTiles.slice(0, 15)) {
      const tile = gameState.getTile(targetPos);
      if (!tile) continue;

      const tileValue = this.evaluateTileValue(gameState, tile, player);
      if (tileValue.value > 0) {
        const paths = generateAllPaths(gameState, champion.position, targetPos, dieValue, champion.id, player.name);
        if (paths.length > 0) {
          options.push({
            actionType: "championAction",
            championAction: {
              diceValueUsed: dieValue,
              championId: champion.id,
              movementPathIncludingStartPosition: paths[0],
              tileAction: this.decideTileAction(gameState, targetPos, player)
            },
            reasoning: `Champion${champion.id} moves to ${tileValue.reason} (value: ${tileValue.value})`
          });
        }
      }
    }

    return options;
  }

  private generateBoatActionOptions(gameState: GameState, player: Player, boat: any, dieValue: number): DiceAction[] {
    // Simplified boat actions - just basic movement for now
    return [{
      actionType: "boatAction",
      boatAction: {
        diceValueUsed: dieValue,
        boatId: boat.id,
        movementPathIncludingStartPosition: [boat.position]
      },
      reasoning: `Boat${boat.id} stays in current position`
    }];
  }

  private generateHarvestActionOptions(gameState: GameState, player: Player, diceValues: number[]): DiceAction[] {
    const harvestInfo = getHarvestableResourcesInfo(gameState, player.name);
    const totalTiles = harvestInfo.ownedNonBlockedTiles.length + harvestInfo.blockadedOpponentTiles.length;

    if (totalTiles === 0) return [];

    const options: DiceAction[] = [];

    // Try different combinations of dice for harvesting
    for (let i = 1; i <= Math.min(diceValues.length, 3); i++) {
      const diceToUse = diceValues.slice(0, i);
      const totalValue = diceToUse.reduce((sum, val) => sum + val, 0);
      const tilesToHarvest = Math.min(totalValue, totalTiles);

      if (tilesToHarvest > 0) {
        // Select best tiles to harvest
        const allHarvestable = [...harvestInfo.ownedNonBlockedTiles, ...harvestInfo.blockadedOpponentTiles];
        const selectedTiles = allHarvestable
          .sort((a, b) => this.getTileResourceValue(b) - this.getTileResourceValue(a))
          .slice(0, tilesToHarvest);

        options.push({
          actionType: "harvestAction",
          harvestAction: {
            diceValuesUsed: diceToUse,
            tilePositions: selectedTiles.map(t => t.position)
          },
          reasoning: `Harvest from ${tilesToHarvest} tiles using ${diceToUse.length} dice`
        });
      }
    }

    return options;
  }

  private selectBestAction(options: DiceAction[], gameState: GameState, player: Player, primaryPath: string): DiceAction {
    if (options.length === 0) {
      // Default action: move first champion with smallest die
      const smallestDie = Math.min(...gameState.players.find(p => p.name === player.name)?.champions[0] ? [1] : []);
      return {
        actionType: "championAction",
        championAction: {
          diceValueUsed: smallestDie,
          championId: 1,
          movementPathIncludingStartPosition: [player.champions[0].position]
        },
        reasoning: "Default action - no good options found"
      };
    }

    // 🏆 CRITICAL: If we can win, ALWAYS prioritize victory actions!
    if (this.canWinAtDoomspire(gameState, player)) {
      const victoryActions = options.filter(action => {
        if (action.actionType === "championAction" && action.championAction) {
          const targetPos = action.championAction.movementPathIncludingStartPosition?.slice(-1)[0];
          if (targetPos) {
            const tile = gameState.getTile(targetPos);
            // Check for known Doomspire or unexplored center tiles that could be Doomspire
            return tile?.tileType === "doomspire" ||
              (this.isUnexploredCenterTile(targetPos) && action.reasoning?.includes("DOOMSPIRE"));
          }
        }
        return false;
      });

      if (victoryActions.length > 0) {
        return {
          ...victoryActions[0],
          reasoning: `🏆 VICTORY! Going to Doomspire to win with ${player.resources.gold >= 12 ? 'GOLD' : player.fame >= 15 ? 'FAME' : gameState.getStarredTileCount(player.name) >= 4 ? 'ECONOMY' : 'COMBAT'}`
        };
      }
    }

    // Score each action based on strategy
    const scoredOptions = options.map(action => ({
      action,
      score: this.scoreAction(action, gameState, player, primaryPath)
    }));

    // Return highest scoring action
    scoredOptions.sort((a, b) => b.score - a.score);
    return scoredOptions[0].action;
  }

  private scoreAction(action: DiceAction, gameState: GameState, player: Player, primaryPath: string): number {
    let score = 0;

    if (action.actionType === "championAction" && action.championAction) {
      const champion = player.champions.find(c => c.id === action.championAction?.championId);
      if (champion) {
        const targetPos = action.championAction.movementPathIncludingStartPosition?.slice(-1)[0];
        if (targetPos) {
          const tile = gameState.getTile(targetPos);
          if (tile) {
            const tileValue = this.evaluateTileValue(gameState, tile, player);
            score += tileValue.value;

            // 🏆 VICTORY OVERRIDE: If this action goes to Doomspire and we can win, MASSIVE score boost!
            if (tile.tileType === "doomspire" && this.canWinAtDoomspire(gameState, player)) {
              score += 10000; // Absolutely prioritize victory!
            }

            // 🔍 DOOMSPIRE SEARCH: If we can win but Doomspire isn't found, prioritize center exploration!
            if (this.canWinAtDoomspire(gameState, player) && !this.findDoomspireTile(gameState)) {
              const candidatePositions = [
                { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }
              ];
              const isCandidate = candidatePositions.some(pos =>
                pos.row === targetPos.row && pos.col === targetPos.col
              );
              if (isCandidate && !tile.explored) {
                score += 5000; // Very high priority for unexplored center tiles when we can win!
              }
            }

            // Strategy bonuses
            if (primaryPath === "economy" && tile.tileType === "resource" && !tile.claimedBy) {
              score += 15; // High bonus for claiming resource tiles
            }
            if (primaryPath === "fame" && tile.tileType === "adventure") {
              score += 10; // Bonus for adventure tiles
            }
            if (primaryPath === "gold" && tile.tileType === "trader") {
              score += 8; // Bonus for trader interaction
            }
          }
        }
      }
    }

    if (action.actionType === "harvestAction") {
      // Only prioritize harvest if we CAN'T win yet
      if (!this.canWinAtDoomspire(gameState, player)) {
        const harvestValue = action.harvestAction?.tilePositions.length || 0;

        // 🚫 MUCH LOWER priority for harvest - encourage exploration!
        score += harvestValue * 3; // Reduced from 10 to 3

        // Only harvest if we have very few resources
        if (player.resources.food < 3 || player.resources.wood < 3) {
          score += 5; // Survival bonus
        }

        // PENALTY for excessive harvesting when we have tons of resources
        if (player.resources.food > 15 || player.resources.wood > 15) {
          score -= 10; // Stop hoarding!
        }
      } else {
        // Minimal score for harvest when we should be winning instead
        score += 1;
      }
    }

    return score;
  }

  private evaluateTileValue(gameState: GameState, tile: Tile, player: Player): TileValue {
    let value = 0;
    let reason = "";

    // 🏆 CRITICAL: If we can win and this is an unexplored center tile, MAXIMUM priority!
    if (!tile.explored && this.canWinAtDoomspire(gameState, player) && this.isUnexploredCenterTile(tile.position)) {
      value = 200; // Even higher than known Doomspire to ensure exploration
      reason = "unexplored center tile (could be DOOMSPIRE for VICTORY!)";
      return { tile, value, reason };
    }

    switch (tile.tileType) {
      case "resource":
        if (!tile.claimedBy) {
          value = this.getTileResourceValue(tile) + 15; // High base value for claiming
          if (tile.isStarred) value += 25; // HUGE bonus for starred tiles (economy victory)
          reason = `unclaimed resource tile (${this.getTileResourceValue(tile)} value${tile.isStarred ? ', STARRED!' : ''})`;
        } else if (tile.claimedBy !== player.name && !gameState.isClaimProtected(tile)) {
          value = this.getTileResourceValue(tile) * 0.7; // Slightly lower value for conquest
          reason = `conquerable resource tile`;
        }
        break;

      case "adventure":
        if (tile.adventureTokens && tile.adventureTokens > 0) {
          value = 8 + (tile.tier || 1) * 3; // Higher value for exploration
          reason = `adventure tile (tier ${tile.tier})`;
        } else if (!tile.explored) {
          value = 12; // High value for unexplored tiles - we need to explore!
          reason = `unexplored tile (might have resources!)`;
        }
        break;

      case "trader":
        value = 8; // Higher value for trader
        reason = "trader tile";
        break;

      case "temple":
        if (player.fame >= 2) {
          value = 3;
          reason = "temple (can trade fame for might)";
        }
        break;

      case "mercenary":
        if (player.resources.gold >= 3) {
          value = 4;
          reason = "mercenary (can buy might)";
        }
        break;

      case "doomspire":
        if (this.canWinAtDoomspire(gameState, player)) {
          value = 100; // Extremely high value for winning
          reason = "doomspire (can win!)";
        }
        break;

      case "empty":
        // Even empty tiles have some value for exploration
        if (!tile.explored) {
          value = 5;
          reason = "unexplored empty tile";
        }
        break;
    }

    return { tile, value, reason };
  }

  private decideTileAction(gameState: GameState, position: Position, player: Player): any {
    const tile = gameState.getTile(position);
    if (!tile) return {};

    const action: any = {};

    // Claim unclaimed resource tiles
    if (tile.tileType === "resource" && !tile.claimedBy) {
      action.claimTile = true;
    }

    // Use special locations based on affordability
    if (tile.tileType === "trader") {
      action.useTrader = true;
    }
    if (tile.tileType === "temple" && player.fame >= 2) {
      action.useTemple = true;
    }
    if (tile.tileType === "mercenary" && player.resources.gold >= 3) {
      action.useMercenary = true;
    }

    // Pick up items if champion can carry them
    if (tile.items && tile.items.length > 0) {
      const champion = this.getChampionAtPosition(player, position);
      if (champion && canChampionCarryMoreItems(champion)) {
        action.pickUpItems = tile.items.slice(0, 1).map((_, index) => `item_${index}`);
      }
    }

    return action;
  }

  private decideBuildingUsage(player: Player, primaryPath: string): any {
    const usage: any = {};

    // 💰 PRIORITY: Use market aggressively to convert excess resources to gold!
    if (player.buildings.includes("market")) {
      const excessResources: any = {};

      // Convert excess resources more aggressively (2:1 ratio at market)
      if (player.resources.food > 6) {
        excessResources.food = Math.floor((player.resources.food - 4) / 2) * 2;
      }
      if (player.resources.wood > 6) {
        excessResources.wood = Math.floor((player.resources.wood - 4) / 2) * 2;
      }
      if (player.resources.ore > 6) {
        excessResources.ore = Math.floor((player.resources.ore - 4) / 2) * 2;
      }

      // Special case: if we have MASSIVE excess (like 50+ food), sell it all!
      if (player.resources.food > 20) {
        excessResources.food = player.resources.food - 4;
      }
      if (player.resources.wood > 20) {
        excessResources.wood = player.resources.wood - 4;
      }

      if (Object.keys(excessResources).length > 0) {
        usage.sellAtMarket = excessResources;
      }
    }

    // Use blacksmith if affordable and following might-based strategy
    if (player.buildings.includes("blacksmith") && canAfford(player, GameSettings.BLACKSMITH_USAGE_COST)) {
      if (primaryPath === "combat" || player.might < 3) {
        usage.useBlacksmith = true;
      }
    }

    // Use fletcher if affordable and available
    if (player.buildings.includes("fletcher") && canAfford(player, GameSettings.FLETCHER_USAGE_COST)) {
      if (primaryPath === "combat" || player.might < 3) {
        usage.useFletcher = true;
      }
    }

    return Object.keys(usage).length > 0 ? usage : undefined;
  }

  private decideBuildAction(gameState: GameState, player: Player, primaryPath: string, analysis: VictoryPathAnalysis): BuildAction | undefined {
    // Priority order based on strategy
    const buildOrder: BuildAction[] = [];

    if (primaryPath === "gold") {
      buildOrder.push("market", "blacksmith", "recruitChampion");
    } else if (primaryPath === "economy") {
      buildOrder.push("recruitChampion", "buildBoat", "market");
    } else if (primaryPath === "combat") {
      buildOrder.push("blacksmith", "fletcher", "recruitChampion");
    } else {
      buildOrder.push("market", "recruitChampion", "blacksmith");
    }

    // Try to build in priority order
    for (const building of buildOrder) {
      if (this.canAffordBuilding(player, building)) {
        return building;
      }
    }

    return undefined;
  }

  private canAffordBuilding(player: Player, building: BuildAction): boolean {
    switch (building) {
      case "blacksmith":
        return !player.buildings.includes("blacksmith") && canAfford(player, GameSettings.BLACKSMITH_COST);
      case "market":
        return !player.buildings.includes("market") && canAfford(player, GameSettings.MARKET_COST);
      case "recruitChampion":
        return player.champions.length < 3 && canAfford(player, GameSettings.CHAMPION_COST);
      case "buildBoat":
        return player.boats.length < 2 && canAfford(player, GameSettings.BOAT_COST);
      case "fletcher":
        return !player.buildings.includes("fletcher") && canAfford(player, GameSettings.FLETCHER_COST);
      case "chapel":
        return !player.buildings.includes("chapel") && !player.buildings.includes("monastery") && canAfford(player, GameSettings.CHAPEL_COST);
      case "warshipUpgrade":
        return !player.buildings.includes("warshipUpgrade") && canAfford(player, GameSettings.WARSHIP_UPGRADE_COST);
      default:
        return false;
    }
  }

  // === UTILITY METHODS ===

  private makeCombatDecision(decisionContext: DecisionContext, gameState: GameState, player: Player): Decision {
    // Simple combat decision: fight if we have decent odds
    const fightOption = decisionContext.options.find(opt => opt.description.toLowerCase().includes("fight"));
    const fleeOption = decisionContext.options.find(opt => opt.description.toLowerCase().includes("flee"));

    if (fightOption && player.might >= 3) {
      return {
        choice: fightOption.id,
        reasoning: `Fighting with ${player.might} might - decent odds`
      };
    }

    if (fleeOption) {
      return {
        choice: fleeOption.id,
        reasoning: "Fleeing to avoid risk"
      };
    }

    return {
      choice: decisionContext.options[0].id,
      reasoning: "Default combat choice"
    };
  }

  private makeItemDecision(decisionContext: DecisionContext, player: Player): Decision {
    // Prefer keeping combat items, drop others
    const dropOptions = decisionContext.options.filter(opt => opt.id.startsWith("drop_"));
    const refuseOption = decisionContext.options.find(opt => opt.id === "refuse_item");

    if (dropOptions.length > 0) {
      // Find non-combat item to drop
      const dropChoice = dropOptions[0]; // Simple: drop first item
      return {
        choice: dropChoice.id,
        reasoning: "Dropping item to make space"
      };
    }

    if (refuseOption) {
      return {
        choice: refuseOption.id,
        reasoning: "Refusing item - no space"
      };
    }

    return {
      choice: decisionContext.options[0].id,
      reasoning: "Default item choice"
    };
  }

  private makeAdventureThemeDecision(decisionContext: DecisionContext, player: Player): Decision {
    // Choose theme based on current resource needs
    const mostNeeded = this.getMostNeededResourceType(player);

    let preferredTheme = "beast"; // Default
    if (mostNeeded === "ore") preferredTheme = "cave";
    if (mostNeeded === "wood") preferredTheme = "grove";
    if (mostNeeded === "food") preferredTheme = "beast";

    const preferredOption = decisionContext.options.find(opt =>
      opt.id.toLowerCase().includes(preferredTheme) || opt.description.toLowerCase().includes(preferredTheme)
    );

    if (preferredOption) {
      return {
        choice: preferredOption.id,
        reasoning: `Choosing ${preferredTheme} theme for ${mostNeeded} resources`
      };
    }

    return {
      choice: decisionContext.options[0].id,
      reasoning: "Default adventure theme choice"
    };
  }

  private estimateGoldPotential(gameState: GameState, player: Player): number {
    const harvestInfo = getHarvestableResourcesInfo(gameState, player.name);
    return harvestInfo.totalHarvestableResources.gold * 3; // Estimate 3 turns of harvesting
  }

  private countAvailableStarredTiles(gameState: GameState): number {
    let count = 0;
    for (const row of gameState.board.getTilesGrid()) {
      for (const tile of row) {
        if (tile.tileType === "resource" && tile.isStarred && !tile.claimedBy) {
          count++;
        }
      }
    }
    return count;
  }

  private getMostNeededResource(player: Player, analysis: VictoryPathAnalysis, primaryPath: string): ResourceType | null {
    if (primaryPath === "gold") return "gold";

    const resources = player.resources;

    // CRITICAL: Prioritize food if we need it for dice tax (2 food per extra champion)
    const extraChampions = player.champions.length - 1; // First champion is free
    const foodNeededForDice = extraChampions * 2;
    if (extraChampions > 0 && resources.food < foodNeededForDice + 2) { // +2 buffer
      return "food";
    }

    // Find resource with lowest amount
    const resourceAmounts = [
      { type: "food" as ResourceType, amount: resources.food },
      { type: "wood" as ResourceType, amount: resources.wood },
      { type: "ore" as ResourceType, amount: resources.ore }
    ];

    resourceAmounts.sort((a, b) => a.amount - b.amount);
    return resourceAmounts[0].type;
  }

  private getMostNeededResourceType(player: Player): ResourceType {
    const resources = player.resources;
    if (resources.food < resources.wood && resources.food < resources.ore) return "food";
    if (resources.wood < resources.ore) return "wood";
    return "ore";
  }

  private canWinAtDoomspire(gameState: GameState, player: Player): boolean {
    return player.fame >= 15 ||
      player.resources.gold >= 12 ||
      gameState.getStarredTileCount(player.name) >= 4 ||
      player.might >= 6; // Conservative estimate for dragon combat
  }

  private findDoomspireTile(gameState: GameState): Tile | null {
    // First check if Doomspire has been explored and revealed
    for (const row of gameState.board.getTilesGrid()) {
      for (const tile of row) {
        if (tile.tileType === "doomspire") {
          return tile;
        }
      }
    }
    return null;
  }

  private getDoomspireCandidateTiles(gameState: GameState): Tile[] {
    // Doomspire is guaranteed to be in one of the center 4 positions
    const candidatePositions = [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 }
    ];

    const candidates: Tile[] = [];
    for (const pos of candidatePositions) {
      const tile = gameState.getTile(pos);
      if (tile) {
        candidates.push(tile);
      }
    }
    return candidates;
  }

  private getUnexploredDoomspireCandidates(gameState: GameState): Tile[] {
    return this.getDoomspireCandidateTiles(gameState).filter(tile => !tile.explored);
  }

  private isUnexploredCenterTile(position: Position): boolean {
    // Check if this is one of the 4 center positions where Doomspire could be
    return (position.row === 3 || position.row === 4) &&
      (position.col === 3 || position.col === 4);
  }

  private getPathTowardDoomspire(
    gameState: GameState,
    startPos: Position,
    doomspirePos: Position,
    dieValue: number,
    championId: number,
    playerName: string,
    reachableTiles: Position[]
  ): { path: Position[]; targetPos: Position; distance: number } | null {
    // Find the reachable tile that gets us closest to Doomspire
    let bestTile: Position | null = null;
    let bestDistance = Infinity;
    let bestPath: Position[] | null = null;

    for (const reachablePos of reachableTiles) {
      const distance = getManhattanDistance(reachablePos, doomspirePos);
      if (distance < bestDistance) {
        const paths = generateAllPaths(gameState, startPos, reachablePos, dieValue, championId, playerName);
        if (paths.length > 0) {
          bestDistance = distance;
          bestTile = reachablePos;
          bestPath = paths[0];
        }
      }
    }

    if (bestTile && bestPath) {
      return {
        path: bestPath,
        targetPos: bestTile,
        distance: bestDistance
      };
    }

    return null;
  }

  private getTileResourceValue(tile: Tile): number {
    if (!tile.resources) return 0;
    return Object.values(tile.resources).reduce((sum, amount) => sum + amount, 0);
  }

  private getChampionAtPosition(player: Player, position: Position): Champion | undefined {
    return player.champions.find(c =>
      c.position.row === position.row && c.position.col === position.col
    );
  }

  private assessOpponentThreats(gameState: GameState, player: Player): string[] {
    const threats: string[] = [];

    for (const opponent of gameState.players) {
      if (opponent.name === player.name) continue;

      if (opponent.fame >= 12) threats.push(`${opponent.name} close to fame victory`);
      if (opponent.resources.gold >= 10) threats.push(`${opponent.name} close to gold victory`);
      if (gameState.getStarredTileCount(opponent.name) >= 3) threats.push(`${opponent.name} close to economy victory`);
    }

    return threats;
  }

  private formatProgress(analysis: VictoryPathAnalysis, primaryPath: string): string {
    const path = analysis[primaryPath as keyof VictoryPathAnalysis];
    if ('current' in path && 'needed' in path) {
      return `${path.current}/${path.needed}`;
    }
    return `${Math.round(path.feasibility * 100)}% ready`;
  }

  private formatResources(resources: Record<ResourceType, number>): string {
    return `${resources.gold}G ${resources.food}F ${resources.wood}W ${resources.ore}O`;
  }

  private getPhasePlan(gameState: GameState, player: Player, primaryPath: string, turnNumber: number): string {
    if (turnNumber <= 5) return "Secure resource base";
    if (turnNumber <= 10) return `Build ${primaryPath} advantage`;
    if (turnNumber <= 15) return `Execute ${primaryPath} strategy`;
    return `Rush ${primaryPath} victory`;
  }

  private hasExcessResources(resources: Record<ResourceType, number>): boolean {
    return resources.food > 4 || resources.wood > 4 || resources.ore > 4;
  }

  private getExcessResource(resources: Record<ResourceType, number>): ResourceType | null {
    if (resources.food > 4) return "food";
    if (resources.wood > 4) return "wood";
    if (resources.ore > 4) return "ore";
    return null;
  }
}