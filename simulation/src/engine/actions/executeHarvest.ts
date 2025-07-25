// Lords of Doomspire Harvest Execution

import { GameState } from "../../game/GameState";
import type { HarvestAction } from "../../lib/actionTypes";
import type { ResourceType } from "../../lib/types";

/**
 * Execute a harvest action
 */
export function executeHarvest(
  gameState: GameState,
  action: HarvestAction,
  playerId: number,
  diceValues?: number[],
): { gameState: GameState; success: boolean; errorMessage?: string; summary: string } {
  const player = gameState.getPlayerById(playerId);
  if (!player) {
    return {
      gameState,
      success: false,
      errorMessage: `Player ${playerId} not found`,
      summary: `Player ${playerId} not found`,
    };
  }

  // Validate harvest amounts are non-negative
  const resourceTypes: ResourceType[] = ["food", "wood", "ore", "gold"];
  for (const resourceType of resourceTypes) {
    if (action.resources[resourceType] < 0) {
      return {
        gameState,
        success: false,
        errorMessage: `Invalid harvest: cannot harvest negative ${resourceType}`,
        summary: `Invalid harvest: cannot harvest negative ${resourceType}`,
      };
    }
  }

  // Calculate total resources being harvested
  const totalHarvested = Object.values(action.resources).reduce((sum, amount) => sum + amount, 0);
  if (totalHarvested === 0) {
    return {
      gameState,
      success: true,
      summary: `No resources harvested`,
    };
  }

  // Add resources to player
  const newResources = { ...player.resources };
  for (const resourceType of resourceTypes) {
    newResources[resourceType] += action.resources[resourceType];
  }

  const updatedPlayer = { ...player, resources: newResources };
  const updatedPlayers = gameState.players.map((p) => (p.id === playerId ? updatedPlayer : p));

  const newGameState = gameState.withUpdates({ players: updatedPlayers });

  const harvestedItems = resourceTypes
    .filter((type) => action.resources[type] > 0)
    .map((type) => `${action.resources[type]} ${type}`)
    .join(", ");

  return {
    gameState: newGameState,
    success: true,
    summary: `Harvested ${harvestedItems}`,
  };
}
