import { GameLogEntry, Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "../../players/PlayerAgent";

export interface BuildingUsageResult {
  blacksmithUsed: boolean;
  marketUsed: boolean;
  fletcherUsed: boolean;
  totalGoldGained: number;
  totalResourcesSold: number;
  failedActions: Array<{ action: string; reason: string }>;
}

/**
 * Handle building usage for a player after their turn
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

  // Check if player has any usable buildings
  const hasBlacksmith = player.buildings.includes("blacksmith");
  const hasMarket = player.buildings.includes("market");
  const hasFletcher = player.buildings.includes("fletcher");

  if (!hasBlacksmith && !hasMarket && !hasFletcher) {
    return result; // No buildings to use
  }

  // Ask player which buildings to use
  const buildingUsageDecision = await playerAgent.useBuilding(gameState, gameLog, player.name, thinkingLogger);

  // Process blacksmith usage
  if (buildingUsageDecision.useBlacksmith) {
    if (hasBlacksmith && player.resources.gold >= 1 && player.resources.ore >= 2) {
      // Deduct resources and gain might
      player.resources.gold -= 1;
      player.resources.ore -= 2;
      player.might += 1;

      logFn("system", `Used blacksmith to buy 1 Might for 1 Gold + 2 Ore.`);
      result.blacksmithUsed = true;

      // Track statistics
      if (player.statistics) {
        player.statistics.blacksmithInteractions += 1;
      }
    } else if (player.resources.gold < 1 || player.resources.ore < 2) {
      const reason = `Cannot use blacksmith - requires 1 Gold + 2 Ore.`;
      logFn("system", reason);
      result.failedActions.push({ action: "blacksmith", reason });
    }
  }

  // Process market usage
  if (buildingUsageDecision.sellAtMarket) {
    if (hasMarket && Object.values(buildingUsageDecision.sellAtMarket).some(amount => amount > 0)) {
      const soldResources: string[] = [];

      // First pass: validate all resources and collect what can be sold
      for (const [resourceType, amount] of Object.entries(buildingUsageDecision.sellAtMarket)) {
        if (amount > 0) {
          // Check if player has enough of this resource
          if (player.resources[resourceType as ResourceType] >= amount) {
            // Deduct resources
            player.resources[resourceType as ResourceType] -= amount;
            result.totalResourcesSold += amount;

            // Track what was sold for the combined message
            soldResources.push(`${amount} ${resourceType}`);
          } else {
            const reason = `Cannot sell ${amount} ${resourceType} - only have ${player.resources[resourceType as ResourceType]}.`;
            logFn("system", reason);
            result.failedActions.push({ action: `market_${resourceType}`, reason });
          }
        }
      }

      // Calculate total gold gained from ALL resources combined (2:1 ratio)
      if (result.totalResourcesSold > 0) {
        result.totalGoldGained = Math.floor(result.totalResourcesSold / 2);
        player.resources.gold += result.totalGoldGained;

        const soldText = soldResources.join(', ');
        logFn("system", `Sold ${soldText} for ${result.totalGoldGained} gold at market.`);
        result.marketUsed = true;

        // Track statistics
        if (player.statistics) {
          player.statistics.marketInteractions += 1;
        }
      }
    }
  }

  // Process fletcher usage
  if (buildingUsageDecision.useFletcher) {
    if (hasFletcher && player.resources.wood >= 3 && player.resources.ore >= 1) {
      // Deduct resources and gain might
      player.resources.wood -= 3;
      player.resources.ore -= 1;
      player.might += 1;

      logFn("system", `Used fletcher to buy 1 Might for 3 Wood + 1 Ore.`);
      result.fletcherUsed = true;

      // Track statistics
      if (player.statistics) {
        player.statistics.fletcherInteractions += 1;
      }
    } else if (player.resources.wood < 3 || player.resources.ore < 1) {
      const reason = `Cannot use fletcher - requires 3 Wood + 1 Ore.`;
      logFn("system", reason);
      result.failedActions.push({ action: "fletcher", reason });
    }
  }

  return result;
} 