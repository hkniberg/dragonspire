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
  tilePositionsToHarvest: Position[],
  totalDiceValueUsed: number,
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
  let actualTilePositionsToHarvest = tilePositionsToHarvest;
  if (tilePositionsToHarvest.length > totalDiceValueUsed) {
    actualTilePositionsToHarvest = tilePositionsToHarvest.slice(0, totalDiceValueUsed);
    console.log(`Attempted to harvest ${tilePositionsToHarvest.length} tiles with total dice value ${totalDiceValueUsed}, only harvesting first ${totalDiceValueUsed}`);
  }

  let harvestedTileCount = 0;

  for (const position of actualTilePositionsToHarvest) {
    const tile = gameState.getTile(position);
    if (!tile) {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile not found`);
      continue;
    }

    // Check if player owns this tile or is blockading it
    const isOwned = tile.claimedBy === playerName;
    const isBlockading = !isOwned && tile.claimedBy !== undefined && tile.claimedBy !== playerName;

    if (!isOwned && !isBlockading) {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile not owned by ${playerName} and not blockaded`);
      continue;
    }

    // If owned, check if there are opposing champions blocking this tile
    if (isOwned) {
      const opposingChampions = gameState.getOpposingChampionsAtPosition(playerName, position);
      if (opposingChampions.length > 0) {
        console.log(`Cannot harvest from ${formatPosition(position)}: blocked by opposing champion`);
        continue;
      }
    }

    // If blockading, check if player has a champion on this tile
    if (isBlockading) {
      const player = gameState.getPlayer(playerName);
      if (!player) {
        console.log(`Cannot harvest from ${formatPosition(position)}: player not found`);
        continue;
      }

      const playerChampionsOnTile = player.champions.filter(champion =>
        champion.position.row === position.row && champion.position.col === position.col
      );
      if (playerChampionsOnTile.length === 0) {
        console.log(`Cannot harvest from ${formatPosition(position)}: not blockading this tile`);
        continue;
      }
    }

    // Harvest all resources from this tile
    if (tile.resources) {
      harvestedResources.food += tile.resources.food || 0;
      harvestedResources.wood += tile.resources.wood || 0;
      harvestedResources.ore += tile.resources.ore || 0;
      harvestedResources.gold += tile.resources.gold || 0;
      harvestedTileCount++;
      console.log(`Harvested from ${formatPosition(position)}: ${isOwned ? 'owned tile' : 'blockaded tile'}`);
    } else {
      console.log(`Cannot harvest from ${formatPosition(position)}: tile has no resources`);
    }
  }

  return {
    harvestedTileCount,
    harvestedResources
  };
} 