import { GameLogEntry, Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "../../players/PlayerAgent";
import { handleBuildAction } from "./buildActionHandler";
import { GameSettings } from "@/lib/GameSettings";
import { canAfford, deductCost } from "@/players/PlayerUtils";
import { formatCost } from "@/lib/utils";

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
      if (hasBlacksmith && canAfford(player, GameSettings.BLACKSMITH_USAGE_COST)) {
        // Deduct resources and gain might
        deductCost(player, GameSettings.BLACKSMITH_USAGE_COST);
        player.might += 1;

        result.blacksmithUsed = true;
        logParts.push(`Used blacksmith: paid ${formatCost(GameSettings.BLACKSMITH_USAGE_COST)}, gained 1 Might`);
      } else {
        result.failedActions.push({
          action: "blacksmith",
          reason: hasBlacksmith ? `Insufficient resources (need ${formatCost(GameSettings.BLACKSMITH_USAGE_COST)})` : "No blacksmith building"
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
              const goldFromThisResource = Math.floor(actualAmount / GameSettings.MARKET_EXCHANGE_RATE);
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
      if (hasFletcher && canAfford(player, GameSettings.FLETCHER_USAGE_COST)) {
        // Deduct resources and gain might
        deductCost(player, GameSettings.FLETCHER_USAGE_COST);
        player.might += 1;

        result.fletcherUsed = true;
        logParts.push(`Used fletcher: paid ${formatCost(GameSettings.FLETCHER_USAGE_COST)}, gained 1 Might`);
      } else {
        result.failedActions.push({
          action: "fletcher",
          reason: hasFletcher ? `Insufficient resources (need ${formatCost(GameSettings.FLETCHER_USAGE_COST)})` : "No fletcher building"
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
      return formatCost(GameSettings.BLACKSMITH_COST);
    case "market":
      return formatCost(GameSettings.MARKET_COST);
    case "fletcher":
      return formatCost(GameSettings.FLETCHER_COST);
    case "chapel":
      return formatCost(GameSettings.CHAPEL_COST);
    case "upgradeChapelToMonastery":
      return formatCost(GameSettings.MONASTERY_COST);
    case "recruitChampion":
      return formatCost(GameSettings.CHAMPION_COST);
    case "buildBoat":
      return formatCost(GameSettings.BOAT_COST);
    case "warshipUpgrade":
      return formatCost(GameSettings.WARSHIP_UPGRADE_COST);
    default:
      return "";
  }
}

function checkAvailableBuildActions(player: Player): string[] {
  const availableActions: string[] = [];

  // Check various build actions using canAfford utility and GameSettings
  const hasBlacksmith = player.buildings.includes("blacksmith");
  if (!hasBlacksmith && canAfford(player, GameSettings.BLACKSMITH_COST)) {
    availableActions.push("blacksmith");
  }

  const hasMarket = player.buildings.includes("market");
  if (!hasMarket && canAfford(player, GameSettings.MARKET_COST)) {
    availableActions.push("market");
  }

  const hasFletcher = player.buildings.includes("fletcher");
  if (!hasFletcher && canAfford(player, GameSettings.FLETCHER_COST)) {
    availableActions.push("fletcher");
  }

  const hasChapel = player.buildings.includes("chapel");
  const hasMonastery = player.buildings.includes("monastery");
  if (!hasChapel && !hasMonastery && canAfford(player, GameSettings.CHAPEL_COST)) {
    availableActions.push("chapel");
  }

  if (hasChapel && !hasMonastery && canAfford(player, GameSettings.MONASTERY_COST)) {
    availableActions.push("upgradeChapelToMonastery");
  }

  // FIXED: Use fixed cost as per game rules (always 3 Food, 3 Gold, 1 Ore)
  const currentChampionCount = player.champions.length;
  if (currentChampionCount < GameSettings.MAX_CHAMPIONS_PER_PLAYER && canAfford(player, GameSettings.CHAMPION_COST)) {
    availableActions.push("recruitChampion");
  }

  const currentBoatCount = player.boats.length;
  if (currentBoatCount < GameSettings.MAX_BOATS_PER_PLAYER && canAfford(player, GameSettings.BOAT_COST)) {
    availableActions.push("buildBoat");
  }

  const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
  if (!hasWarshipUpgrade && canAfford(player, GameSettings.WARSHIP_UPGRADE_COST)) {
    availableActions.push("warshipUpgrade");
  }

  return availableActions;
} 