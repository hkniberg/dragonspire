import { GameState } from "@/game/GameState";
import { Player, Position, ResourceType, Tile } from "@/lib/types";

export interface Direction {
  row: number;
  col: number;
  name: string;
}

export const DIRECTIONS: Direction[] = [
  { row: -1, col: 0, name: "north" },
  { row: 1, col: 0, name: "south" },
  { row: 0, col: -1, name: "west" },
  { row: 0, col: 1, name: "east" },
];

/**
 * Check if a position is within the board bounds
 */
export function isValidBoardPosition(position: Position): boolean {
  return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

/**
 * Check if there are any champions (other than the specified one) on a given position
 */
export function hasOtherChampionsAtPosition(
  gameState: GameState,
  position: Position,
  excludeChampionId?: number,
  excludePlayerName?: string,
): boolean {
  for (const player of gameState.players) {
    for (const champion of player.champions) {
      if (champion.position.row === position.row && champion.position.col === position.col) {
        // Skip if this is the champion we're excluding
        if (excludeChampionId && champion.id === excludeChampionId) {
          continue;
        }
        // Skip if this is the player we're excluding
        if (excludePlayerName && champion.playerName === excludePlayerName) {
          continue;
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * Get all reachable tiles within movement range, excluding tiles with other champions
 */
export function getReachableTiles(
  gameState: GameState,
  championPosition: Position,
  dieValue: number,
  excludeChampionId?: number,
  excludePlayerName?: string,
): Position[] {
  const reachableTiles: Position[] = [];

  // Use breadth-first search to find all reachable tiles
  const visited = new Set<string>();
  const queue: Array<{ position: Position; steps: number }> = [{ position: championPosition, steps: 0 }];

  visited.add(`${championPosition.row},${championPosition.col}`);

  while (queue.length > 0) {
    const { position, steps } = queue.shift()!;

    // Add current position if it's not the starting position and has no other champions
    if (steps > 0 && !hasOtherChampionsAtPosition(gameState, position, excludeChampionId, excludePlayerName)) {
      reachableTiles.push(position);
    }

    // If we've reached the maximum steps, don't explore further
    if (steps >= dieValue) {
      continue;
    }

    // Explore all four directions
    for (const direction of DIRECTIONS) {
      const nextPos = {
        row: position.row + direction.row,
        col: position.col + direction.col,
      };

      const key = `${nextPos.row},${nextPos.col}`;

      // Skip if already visited or out of bounds
      if (visited.has(key) || !isValidBoardPosition(nextPos)) {
        continue;
      }

      // Check if tile exists
      const tile = gameState.getTile(nextPos);
      if (!tile) {
        continue;
      }

      visited.add(key);
      queue.push({ position: nextPos, steps: steps + 1 });
    }
  }

  return reachableTiles;
}

/**
 * Generate all possible paths from start to target position
 * Uses a simple recursive approach to find all valid paths
 */
export function generateAllPaths(
  gameState: GameState,
  startPosition: Position,
  targetPosition: Position,
  maxSteps: number,
  excludeChampionId?: number,
  excludePlayerName?: string,
): Position[][] {
  const paths: Position[][] = [];

  function findPaths(currentPos: Position, currentPath: Position[], stepsUsed: number) {
    // If we've reached the target, add this path
    if (currentPos.row === targetPosition.row && currentPos.col === targetPosition.col) {
      paths.push([...currentPath]);
      return;
    }

    // If we've used all steps, stop
    if (stepsUsed >= maxSteps) {
      return;
    }

    // Try all four directions
    for (const direction of DIRECTIONS) {
      const nextPos = {
        row: currentPos.row + direction.row,
        col: currentPos.col + direction.col,
      };

      // Check if valid position
      if (!isValidBoardPosition(nextPos)) {
        continue;
      }

      // Check if tile exists
      const tile = gameState.getTile(nextPos);
      if (!tile) {
        continue;
      }

      // Check if we've already visited this position in this path
      const alreadyVisited = currentPath.some((pos) => pos.row === nextPos.row && pos.col === nextPos.col);

      if (alreadyVisited) {
        continue;
      }

      // Check if there are other champions at this position (except at target)
      const isTarget = nextPos.row === targetPosition.row && nextPos.col === targetPosition.col;
      if (!isTarget && hasOtherChampionsAtPosition(gameState, nextPos, excludeChampionId, excludePlayerName)) {
        continue;
      }

      // Continue searching from this position
      findPaths(nextPos, [...currentPath, nextPos], stepsUsed + 1);
    }
  }

  findPaths(startPosition, [startPosition], 0);
  return paths;
}

/**
 * Get detailed information about harvestable resources, taking blockading into account
 *
 * A player can harvest from:
 * - Any tile that is claimed by them and doesn't have an opposing champion on it
 * - Any tile that is claimed by an opposing player and has their champion on it (blockading)
 */
export interface HarvestableResourcesInfo {
  ownedNonBlockedTiles: Tile[];
  ownedBlockedTiles: Tile[];
  blockadedOpponentTiles: Tile[];
  totalHarvestableResources: Record<ResourceType, number>;
}

export function getHarvestableResourcesInfo(gameState: GameState, playerName: string): HarvestableResourcesInfo {
  const ownedNonBlockedTiles: Tile[] = [];
  const ownedBlockedTiles: Tile[] = [];
  const blockadedOpponentTiles: Tile[] = [];
  const totalHarvestableResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

  // Get the player's champions positions
  const player = gameState.getPlayer(playerName);
  if (!player) {
    return {
      ownedNonBlockedTiles,
      ownedBlockedTiles,
      blockadedOpponentTiles,
      totalHarvestableResources,
    };
  }

  const playerChampionPositions = new Set<string>();
  for (const champion of player.champions) {
    playerChampionPositions.add(`${champion.position.row},${champion.position.col}`);
  }

  // Check all tiles on the board
  for (const row of gameState.board.getTilesGrid()) {
    for (const tile of row) {
      if (!tile.resources) {
        continue; // Not a resource tile
      }

      const tileKey = `${tile.position.row},${tile.position.col}`;
      const hasPlayerChampion = playerChampionPositions.has(tileKey);

      // Check if any opposing champions are on this tile
      let hasOpposingChampion = false;
      for (const otherPlayer of gameState.players) {
        if (otherPlayer.name === playerName) {
          continue; // Skip the current player
        }

        for (const champion of otherPlayer.champions) {
          if (champion.position.row === tile.position.row && champion.position.col === tile.position.col) {
            hasOpposingChampion = true;
            break;
          }
        }
        if (hasOpposingChampion) {
          break;
        }
      }

      // Case 1: Tile is claimed by the player
      if (tile.claimedBy === playerName) {
        if (!hasOpposingChampion) {
          // Player owns this tile and it's not blockaded
          ownedNonBlockedTiles.push(tile);
          for (const [resourceType, amount] of Object.entries(tile.resources)) {
            totalHarvestableResources[resourceType as ResourceType] += amount as number;
          }
        } else {
          // Player owns this tile but it's blockaded
          ownedBlockedTiles.push(tile);
        }
      }

      // Case 2: Tile is claimed by an opposing player and player's champion is on it (blockading)
      if (tile.claimedBy !== undefined && tile.claimedBy !== playerName && hasPlayerChampion) {
        // Check if the tile is protected by adjacent knights or warships of the owner
        if (!gameState.isClaimProtected(tile)) {
          blockadedOpponentTiles.push(tile);
          for (const [resourceType, amount] of Object.entries(tile.resources)) {
            totalHarvestableResources[resourceType as ResourceType] += amount as number;
          }
        }
      }
    }
  }

  return {
    ownedNonBlockedTiles,
    ownedBlockedTiles,
    blockadedOpponentTiles,
    totalHarvestableResources,
  };
}

/**
 * Get the total harvestable resources for a player, taking blockading into account
 *
 * A player can harvest from:
 * - Any tile that is claimed by them and doesn't have an opposing champion on it
 * - Any tile that is claimed by an opposing player and has their champion on it (blockading)
 */
export function getHarvestableResources(gameState: GameState, playerName: string): Record<ResourceType, number> {
  return getHarvestableResourcesInfo(gameState, playerName).totalHarvestableResources;
}

/**
 * Get a list of buildings that the player can afford to use
 */
export function getUsableBuildings(player: Player): string[] {
  const usableBuildings: string[] = [];

  // Check for Blacksmith
  const hasBlacksmith = player.buildings.includes("blacksmith");
  if (hasBlacksmith && player.resources.gold >= 1 && player.resources.ore >= 2) {
    usableBuildings.push("blacksmith");
  }

  // Check for Market
  const hasMarket = player.buildings.includes("market");
  if (hasMarket) {
    const totalResources = player.resources.food + player.resources.wood + player.resources.ore;
    if (totalResources >= 2) {
      usableBuildings.push("market");
    }
  }

  return usableBuildings;
}
