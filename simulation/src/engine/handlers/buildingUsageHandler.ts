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

  // Collect all actions for consolidated logging
  const logParts: string[] = [];

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
        logParts.push("Used blacksmith: paid 1 Gold + 2 Ore, gained 1 Might");
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
        const resourcesSoldDetails: string[] = [];

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

              const resourceName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
              resourcesSoldDetails.push(`${actualAmount} ${resourceName}`);
            }
          }
        }

        if (goldGained > 0) {
          player.resources.gold += goldGained;
          result.marketUsed = true;
          result.totalGoldGained += goldGained;
          result.totalResourcesSold += totalSold;
          logParts.push(`Used market: sold ${resourcesSoldDetails.join(" + ")} for ${goldGained} Gold`);
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
        logParts.push("Used fletcher: paid 3 Wood + 1 Ore, gained 1 Might");
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
      const buildResult = handleBuildAction(player, buildingDecision.buildAction, () => { }); // Don't log individually
      if (buildResult.actionSuccessful) {
        result.buildActionPerformed = buildingDecision.buildAction;

        // Get build cost details for logging
        const buildCostDetails = getBuildCostDetails(buildingDecision.buildAction, player);
        logParts.push(`Built ${buildingDecision.buildAction}${buildCostDetails ? ` for ${buildCostDetails}` : ""}`);

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

  // Create consolidated log entry if any actions were performed
  if (logParts.length > 0) {
    let consolidatedMessage = logParts.join(". ");

    // Add reasoning if provided
    if (buildingDecision.reasoning) {
      consolidatedMessage += `. Reason: ${buildingDecision.reasoning}`;
    }

    logFn("building", consolidatedMessage);
  }

  return result;
}

/**
 * Get the cost details for a build action for logging purposes
 */
function getBuildCostDetails(buildAction: string, player?: Player): string {
  switch (buildAction) {
    case "blacksmith":
      return "2 Food + 2 Ore";
    case "market":
      return "2 Food + 2 Wood";
    case "fletcher":
      return "1 Wood + 1 Food + 1 Gold + 1 Ore";
    case "chapel":
      return "6 Wood + 2 Gold";
    case "upgradeChapelToMonastery":
      return "8 Wood + 3 Gold + 1 Ore";
    case "recruitChampion":
      return "3 Food + 3 Gold + 1 Ore";
    case "buildBoat":
      return "2 Wood + 2 Gold";
    case "warshipUpgrade":
      return "2 Wood + 1 Ore + 1 Gold";
    default:
      return "";
  }
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