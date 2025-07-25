// Lords of Doomspire Harvest Calculation

import { GameState } from "@/game/GameState";
import { Position, ResourceType } from "@/lib/types";
import { formatPosition } from "@/lib/utils";

export interface HarvestResult {
  harvestedTileCount: number;
  harvestedResources: Record<ResourceType, number>;
}

/**
 * Calculates the result of a harvest action.
 * Does not change any state.
 */
export function calculateHarvest(
  gameState: GameState,
  playerName: string,
  tilePositions: Position[],
  diceValueUsed: number,
): HarvestResult {
  const player = gameState.players.find(p => p.name === playerName);
  if (!player) {
    throw new Error(`Player ${playerName} not found`);
  }

  const harvestedResources: Record<ResourceType, number> = {
    food: 0,
    wood: 0,
    ore: 0,
    gold: 0,
  };

  // Limit to dice value and warn if trying to harvest more tiles
  let tilesToHarvest = tilePositions;
  if (tilePositions.length > diceValueUsed) {
    tilesToHarvest = tilePositions.slice(0, diceValueUsed);
    console.log(`Attempted to harvest ${tilePositions.length} tiles with dice value ${diceValueUsed}, only harvesting first ${diceValueUsed}`);
  }

  let harvestedTileCount = 0;

  for (const position of tilesToHarvest) {
    const tile = gameState.getTile(position);
    if (!tile) {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile not found`);
      continue;
    }

    // Check if player owns this tile
    if (tile.claimedBy !== playerName) {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile not owned by ${playerName}`);
      continue;
    }

    // Check if there are opposing champions blocking this tile
    const opposingChampions = gameState.getOpposingChampionsAtPosition(playerName, position);
    if (opposingChampions.length > 0) {
      console.log(`Cannot harvest from ${formatPosition(position)}: blocked by opposing champion`);
      continue;
    }

    // Harvest all resources from this tile
    if (tile.resources) {
      harvestedResources.food += tile.resources.food || 0;
      harvestedResources.wood += tile.resources.wood || 0;
      harvestedResources.ore += tile.resources.ore || 0;
      harvestedResources.gold += tile.resources.gold || 0;
      harvestedTileCount++;
    } else {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile has no resources`);
    }
  }

  return {
    harvestedTileCount,
    harvestedResources
  };
} 