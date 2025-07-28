import { Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "../../players/PlayerAgent";

export interface BuildingUsageResult {
  blacksmithUsed: boolean;
  marketUsed: boolean;
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
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<BuildingUsageResult> {
  const result: BuildingUsageResult = {
    blacksmithUsed: false,
    marketUsed: false,
    totalGoldGained: 0,
    totalResourcesSold: 0,
    failedActions: []
  };

  // Check if player has any usable buildings
  const hasBlacksmith = player.buildings.includes("blacksmith");
  const hasMarket = player.buildings.includes("market");

  if (!hasBlacksmith && !hasMarket) {
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
    } else if (player.resources.gold < 1 || player.resources.ore < 2) {
      const reason = `Cannot use blacksmith - requires 1 Gold + 2 Ore.`;
      logFn("system", reason);
      result.failedActions.push({ action: "blacksmith", reason });
    }
  }

  // Process market usage
  if (buildingUsageDecision.sellAtMarket) {
    if (hasMarket && Object.values(buildingUsageDecision.sellAtMarket).some(amount => amount > 0)) {
      for (const [resourceType, amount] of Object.entries(buildingUsageDecision.sellAtMarket)) {
        if (amount > 0) {
          // Check if player has enough of this resource
          if (player.resources[resourceType as ResourceType] >= amount) {
            // Calculate gold gained (2 resources = 1 gold)
            const goldGained = Math.floor(amount / 2);

            // Deduct resources and add gold
            player.resources[resourceType as ResourceType] -= amount;
            player.resources.gold += goldGained;

            result.totalGoldGained += goldGained;
            result.totalResourcesSold += amount;

            logFn("system", `Sold ${amount} ${resourceType} for ${goldGained} gold at market.`);
          } else {
            const reason = `Cannot sell ${amount} ${resourceType} - only have ${player.resources[resourceType as ResourceType]}.`;
            logFn("system", reason);
            result.failedActions.push({ action: `market_${resourceType}`, reason });
          }
        }
      }

      if (result.totalGoldGained > 0) {
        logFn("system", `Market transaction complete: sold ${result.totalResourcesSold} resources for ${result.totalGoldGained} gold total.`);
        result.marketUsed = true;
      }
    }
  }

  return result;
} 