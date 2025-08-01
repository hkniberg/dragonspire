import { GameLogEntry, Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "../../players/PlayerAgent";
import { handleBuildAction } from "./buildActionHandler";

export interface BuildingUsageResult {
  blacksmithUsed: boolean;
  marketUsed: boolean;
  fletcherUsed: boolean;
  buildActionPerformed?: string;
  totalGoldGained: number;
  totalResourcesSold: number;
  failedActions: Array<{ action: string; reason: string }>;
}

/**
 * Handle building usage and build actions for a player during the harvest phase
 */
export async function handleBuildingUsage(
  player: Player,
  playerAgent: PlayerAgent,
  gameState: any,
  gameLog: readonly GameLogEntry[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<BuildingUsageResult> {
  const result: BuildingUsageResult = {
    blacksmithUsed: false,
    marketUsed: false,
    fletcherUsed: false,
    totalGoldGained: 0,
    totalResourcesSold: 0,
    failedActions: []
  };

  // Check if player has any usable buildings or affordable build actions
  const hasBlacksmith = player.buildings.includes("blacksmith");
  const hasMarket = player.buildings.includes("market");
  const hasFletcher = player.buildings.includes("fletcher");

  const canAffordBuildActions = checkAvailableBuildActions(player).length > 0;

  if (!hasBlacksmith && !hasMarket && !hasFletcher && !canAffordBuildActions) {
    return result; // No buildings to use and no build actions available
  }

  // Ask player for building decision (both usage and build action)
  const buildingDecision = await playerAgent.useBuilding(gameState, gameLog, player.name, thinkingLogger);

  // Process building usage first
  if (buildingDecision.buildingUsageDecision) {
    const usageDecision = buildingDecision.buildingUsageDecision;

    // Process blacksmith usage
    if (usageDecision.useBlacksmith) {
      if (hasBlacksmith && player.resources.gold >= 1 && player.resources.ore >= 2) {
        // Deduct resources and gain might
        player.resources.gold -= 1;
        player.resources.ore -= 2;
        player.might += 1;

        result.blacksmithUsed = true;
        logFn("building", `Used blacksmith: paid 1 gold + 2 ore, gained 1 might`);
      } else {
        result.failedActions.push({
          action: "blacksmith",
          reason: hasBlacksmith ? "Insufficient resources (need 1 gold + 2 ore)" : "No blacksmith building"
        });
      }
    }

    // Process market usage
    if (usageDecision.sellAtMarket) {
      if (hasMarket && Object.values(usageDecision.sellAtMarket).some(amount => amount > 0)) {
        let totalSold = 0;
        let goldGained = 0;

        for (const [resourceType, amount] of Object.entries(usageDecision.sellAtMarket)) {
          if (amount > 0 && resourceType !== "gold") {
            const resourceKey = resourceType as ResourceType;
            const actualAmount = Math.min(amount, player.resources[resourceKey]);

            if (actualAmount > 0) {
              player.resources[resourceKey] -= actualAmount;
              totalSold += actualAmount;

              // Market sells at 2:1 ratio (2 resources for 1 gold)
              const goldFromThisResource = Math.floor(actualAmount / 2);
              goldGained += goldFromThisResource;
            }
          }
        }

        if (goldGained > 0) {
          player.resources.gold += goldGained;
          result.marketUsed = true;
          result.totalGoldGained += goldGained;
          result.totalResourcesSold += totalSold;
          logFn("building", `Used market: sold ${totalSold} resources for ${goldGained} gold`);
        }
      } else {
        result.failedActions.push({
          action: "market",
          reason: hasMarket ? "No resources to sell" : "No market building"
        });
      }
    }

    // Process fletcher usage
    if (usageDecision.useFletcher) {
      if (hasFletcher && player.resources.wood >= 3 && player.resources.ore >= 1) {
        // Deduct resources and gain might
        player.resources.wood -= 3;
        player.resources.ore -= 1;
        player.might += 1;

        result.fletcherUsed = true;
        logFn("building", `Used fletcher: paid 3 wood + 1 ore, gained 1 might`);
      } else {
        result.failedActions.push({
          action: "fletcher",
          reason: hasFletcher ? "Insufficient resources (need 3 wood + 1 ore)" : "No fletcher building"
        });
      }
    }
  }

  // Process build action (happens after building usage)
  if (buildingDecision.buildAction) {
    try {
      const buildResult = handleBuildAction(player, buildingDecision.buildAction, logFn);
      if (buildResult.actionSuccessful) {
        result.buildActionPerformed = buildingDecision.buildAction;
        logFn("build", `Built ${buildingDecision.buildAction}`);

        // Track statistics
        if (player.statistics) {
          player.statistics.buildActions += 1;
        }
      } else {
        result.failedActions.push({
          action: `build_${buildingDecision.buildAction}`,
          reason: buildResult.reason || "Build action failed"
        });
      }
    } catch (error) {
      result.failedActions.push({
        action: `build_${buildingDecision.buildAction}`,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return result;
}

function checkAvailableBuildActions(player: Player): string[] {
  const availableActions: string[] = [];
  const { resources } = player;

  // Check various build actions (same logic as in ClaudePlayer)
  const hasBlacksmith = player.buildings.includes("blacksmith");
  if (!hasBlacksmith && resources.food >= 2 && resources.ore >= 2) {
    availableActions.push("blacksmith");
  }

  const hasMarket = player.buildings.includes("market");
  if (!hasMarket && resources.food >= 2 && resources.wood >= 2) {
    availableActions.push("market");
  }

  const hasFletcher = player.buildings.includes("fletcher");
  if (!hasFletcher && resources.wood >= 1 && resources.food >= 1 && resources.gold >= 1 && resources.ore >= 1) {
    availableActions.push("fletcher");
  }

  const hasChapel = player.buildings.includes("chapel");
  const hasMonastery = player.buildings.includes("monastery");
  if (!hasChapel && !hasMonastery && resources.wood >= 6 && resources.gold >= 2) {
    availableActions.push("chapel");
  }

  if (hasChapel && !hasMonastery && resources.wood >= 8 && resources.gold >= 3 && resources.ore >= 1) {
    availableActions.push("upgradeChapelToMonastery");
  }

  const currentChampionCount = player.champions.length;
  if (currentChampionCount < 3) {
    if (currentChampionCount === 1 && resources.food >= 3 && resources.gold >= 3 && resources.ore >= 1) {
      availableActions.push("recruitChampion");
    } else if (currentChampionCount === 2 && resources.food >= 6 && resources.gold >= 6 && resources.ore >= 3) {
      availableActions.push("recruitChampion");
    }
  }

  const currentBoatCount = player.boats.length;
  if (currentBoatCount < 2 && resources.wood >= 2 && resources.gold >= 2) {
    availableActions.push("buildBoat");
  }

  const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
  if (!hasWarshipUpgrade && resources.wood >= 2 && resources.ore >= 1 && resources.gold >= 1) {
    availableActions.push("warshipUpgrade");
  }

  return availableActions;
} 