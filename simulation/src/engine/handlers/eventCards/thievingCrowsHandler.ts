import { GameState } from "@/game/GameState";
import { EventCardResult, ResourceType } from "@/lib/types";

/**
 * Handle the Thieving Crows event card
 * All players lose all of whichever stockpiled resource they have the most of
 */
export function handleThievingCrows(
  gameState: GameState,
  logFn: (type: string, content: string) => void
): EventCardResult {
  logFn("event", "Thieving crows descend upon the island, stealing resources from all players!");

  const resourcesChanged: Record<string, { food?: number; wood?: number; ore?: number; gold?: number }> = {};
  const playersAffected: string[] = [];

  for (const player of gameState.players) {
    // Find the resource type the player has the most of
    const resourceTypes: ResourceType[] = ["food", "wood", "ore", "gold"];
    let maxResourceType: ResourceType = "food";
    let maxResourceAmount = player.resources.food;

    for (const resourceType of resourceTypes) {
      if (player.resources[resourceType] > maxResourceAmount) {
        maxResourceType = resourceType;
        maxResourceAmount = player.resources[resourceType];
      }
    }

    // Only process if the player actually has resources to lose
    if (maxResourceAmount > 0) {
      const amountLost = maxResourceAmount;
      player.resources[maxResourceType] = 0;

      // Track the change (negative amount since it's a loss)
      resourcesChanged[player.name] = {};
      resourcesChanged[player.name][maxResourceType] = -amountLost;

      playersAffected.push(player.name);

      logFn("event", `${player.name} loses all ${amountLost} ${maxResourceType} to the thieving crows!`);
    } else {
      // Player has no resources to lose
      logFn("event", `${player.name} has no resources for the crows to steal`);
    }
  }

  if (playersAffected.length === 0) {
    logFn("event", "The crows find nothing to steal and fly away disappointed");
  }

  return {
    eventProcessed: true,
    playersAffected,
    resourcesChanged
  };
} 