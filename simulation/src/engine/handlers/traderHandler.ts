import { getTraderItemById } from "@/content/traderItems";
import { GameState } from "@/game/GameState";
import { TRADER_CARDS } from "@/lib/cards";
import { TraderAction, TraderContext, TraderDecision } from "@/lib/traderTypes";
import { Player, ResourceType } from "@/lib/types";
import { formatResources } from "@/lib/utils";




export interface TraderResult {
  interactionOccurred: boolean;
  itemsPurchased: Array<{
    itemId: string;
    goldSpent: number;
  }>;
  resourceTrades: Array<{
    resourcesGiven: Record<ResourceType, number>;
    resourceReceived: ResourceType;
    goldReceived: number;
  }>;
  totalGoldSpent: number;
  totalGoldReceived: number;
  failedActions: Array<{
    action: TraderAction;
    reason: string;
  }>;
}

/**
 * Create trader context with available items and player resources
 */
export function createTraderContext(
  player: Player
): TraderContext {
  const availableItems = [...TRADER_CARDS]; // Copy all trader cards

  const description = `Trader options available:
- Purchase items from trader deck (${availableItems.length} items available)
- Exchange resources at 2:1 rate (pay 2 of any resource, get 1 gold)
- Your current resources: ${formatResources(player.resources)}`;

  return {
    availableItems,
    playerResources: { ...player.resources },
    description
  };
}

/**
 * Handle trader interactions when a player visits a trader tile
 */
export function handleTraderInteraction(
  gameState: GameState,
  player: Player,
  championId: number,
  traderDecision: TraderDecision,
  logFn: (type: string, content: string) => void
): TraderResult {
  const result: TraderResult = {
    interactionOccurred: traderDecision.actions.length > 0,
    itemsPurchased: [],
    resourceTrades: [],
    totalGoldSpent: 0,
    totalGoldReceived: 0,
    failedActions: []
  };

  if (!result.interactionOccurred) {
    logFn("event", "Visited trader but made no purchases or trades");
    return result;
  }

  // Process each trader action
  for (const action of traderDecision.actions) {
    if (action.type === "buyItem") {
      const buyResult = processBuyItemAction(gameState, player, championId, action, logFn);
      if (buyResult.success) {
        result.itemsPurchased.push({
          itemId: action.itemId!,
          goldSpent: buyResult.goldSpent!
        });
        result.totalGoldSpent += buyResult.goldSpent!;
      } else {
        result.failedActions.push({
          action,
          reason: buyResult.reason!
        });
      }
    } else if (action.type === "sellResources") {
      const sellResult = processSellResourcesAction(player, action, logFn);
      if (sellResult.success) {
        result.resourceTrades.push({
          resourcesGiven: action.resourcesSold!,
          resourceReceived: action.resourceRequested!,
          goldReceived: sellResult.goldReceived!
        });
        result.totalGoldReceived += sellResult.goldReceived!;
      } else {
        result.failedActions.push({
          action,
          reason: sellResult.reason!
        });
      }
    }
  }

  // Log summary if any successful trades occurred
  if (result.itemsPurchased.length > 0 || result.resourceTrades.length > 0) {
    let summary = "Trader interactions: ";
    const parts = [];

    if (result.itemsPurchased.length > 0) {
      parts.push(`purchased ${result.itemsPurchased.length} item(s) for ${result.totalGoldSpent} gold`);
    }

    if (result.resourceTrades.length > 0) {
      parts.push(`made ${result.resourceTrades.length} resource trade(s) gaining ${result.totalGoldReceived} gold`);
    }

    summary += parts.join(", ");
    logFn("event", summary);
  }

  return result;
}

/**
 * Process a buy item action
 */
function processBuyItemAction(
  gameState: GameState,
  player: Player,
  championId: number,
  action: TraderAction,
  logFn: (type: string, content: string) => void
): { success: boolean; goldSpent?: number; reason?: string } {
  if (!action.itemId) {
    return { success: false, reason: "No item ID specified" };
  }

  // Find the trader item definition
  const traderItem = getTraderItemById(action.itemId);
  if (!traderItem) {
    return { success: false, reason: `Unknown trader item: ${action.itemId}` };
  }

  // Find the champion
  const champion = gameState.getChampion(player.name, championId);
  if (!champion) {
    return { success: false, reason: `Champion ${championId} not found` };
  }

  // Check if champion has inventory space (max 2 items per game rules)
  if (champion.items.length >= 2) {
    return {
      success: false,
      reason: `Champion ${championId} inventory is full (max 2 items)`
    };
  }

  // Check if player has enough gold
  if (player.resources.gold < traderItem.cost) {
    return {
      success: false,
      reason: `Not enough gold. Need ${traderItem.cost}, have ${player.resources.gold}`
    };
  }

  // Deduct gold and add item to champion's inventory
  player.resources.gold -= traderItem.cost;
  champion.items.push(action.itemId);

  logFn("event", `Champion ${championId} purchased ${traderItem.name} for ${traderItem.cost} gold`);

  return { success: true, goldSpent: traderItem.cost };
}

/**
 * Process a sell resources action (2:1 exchange rate for gold)
 */
function processSellResourcesAction(
  player: Player,
  action: TraderAction,
  logFn: (type: string, content: string) => void
): { success: boolean; goldReceived?: number; reason?: string } {
  if (!action.resourcesSold || !action.resourceRequested) {
    return { success: false, reason: "Missing resources offered or requested" };
  }

  // According to rules, trader allows 2:1 exchange rate to gold
  // But also allows resource-to-resource trades at 2:1 rate
  const totalResourcesOffered = Object.values(action.resourcesSold).reduce((sum, amount) => sum + amount, 0);

  if (totalResourcesOffered === 0) {
    return { success: false, reason: "No resources offered for trade" };
  }

  // Check if player has the resources they want to trade
  for (const [resourceType, amount] of Object.entries(action.resourcesSold)) {
    const playerAmount = player.resources[resourceType as ResourceType];
    if (playerAmount < amount) {
      return {
        success: false,
        reason: `Not enough ${resourceType}. Need ${amount}, have ${playerAmount}`
      };
    }
  }

  // Calculate what they get (2:1 ratio)
  const amountReceived = Math.floor(totalResourcesOffered / 2);

  if (amountReceived === 0) {
    return { success: false, reason: "Need at least 2 resources to make a trade" };
  }

  // Deduct offered resources
  for (const [resourceType, amount] of Object.entries(action.resourcesSold)) {
    player.resources[resourceType as ResourceType] -= amount;
  }

  // Add received resource
  player.resources[action.resourceRequested] += amountReceived;

  const offeredText = Object.entries(action.resourcesSold)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => `${amount} ${type}`)
    .join(", ");

  logFn("event", `Traded ${offeredText} for ${amountReceived} ${action.resourceRequested} at trader`);

  // Return gold received only if they requested gold
  const goldReceived = action.resourceRequested === "gold" ? amountReceived : 0;
  return { success: true, goldReceived };
} 