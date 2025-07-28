import { GameState } from "@/game/GameState";
import { EventCardResult, Player, Position, Tile } from "@/lib/types";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

function findNearestUnoccupiedClaimedTiles(
  gameState: GameState,
  player: Player,
  championPosition: Position
): Tile[] {
  // Find all tiles claimed by the player
  const claimedTiles = gameState.board.findTiles(
    tile => tile.claimedBy === player.name
  );

  // Get all champions from all players
  const allChampions = gameState.players.flatMap(p => p.champions);

  // Filter to only unoccupied tiles (no champions on them)
  const unoccupiedClaimedTiles = claimedTiles.filter(tile => {
    return !allChampions.some(champion =>
      champion.position.row === tile.position.row &&
      champion.position.col === tile.position.col
    );
  });

  if (unoccupiedClaimedTiles.length === 0) {
    return [];
  }

  // Calculate distances and find minimum
  const tilesWithDistance = unoccupiedClaimedTiles.map(tile => ({
    tile,
    distance: calculateDistance(championPosition, tile.position)
  }));

  const minDistance = Math.min(...tilesWithDistance.map(t => t.distance));

  // Return all tiles at minimum distance
  return tilesWithDistance
    .filter(t => t.distance === minDistance)
    .map(t => t.tile);
}

export function handleLandslide(
  gameState: GameState,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): EventCardResult {
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    return {
      eventProcessed: false,
      errorMessage: `Champion ${championId} not found for player ${player.name}`
    };
  }

  // Roll 1+D3 (so result is 2-4)
  const diceRoll = 1 + rollD3();

  logFn("event", `Champion${championId} rolls ${diceRoll} for landslide!`);

  if (diceRoll === 2) {
    // (1) Flee to home tile
    const homePosition = player.homePosition;
    champion.position = { ...homePosition };
    logFn("event", `Champion${championId} flees to home tile at (${homePosition.row}, ${homePosition.col})`);

    return {
      eventProcessed: true,
      playersAffected: [player.name]
    };
  } else if (diceRoll === 3) {
    // (2) Flee to nearest claimed tile (unoccupied)
    const nearestTiles = findNearestUnoccupiedClaimedTiles(gameState, player, champion.position);

    if (nearestTiles.length === 0) {
      // No unoccupied claimed tiles - flee to home instead
      const homePosition = player.homePosition;
      champion.position = { ...homePosition };
      logFn("event", `Champion${championId} has no unoccupied claimed tiles, flees to home tile at (${homePosition.row}, ${homePosition.col})`);
    } else {
      // Pick randomly from nearest tiles if multiple at same distance
      const targetTile = nearestTiles[Math.floor(Math.random() * nearestTiles.length)];
      champion.position = { ...targetTile.position };
      logFn("event", `Champion${championId} flees to nearest claimed tile at (${targetTile.position.row}, ${targetTile.position.col})`);
    }

    return {
      eventProcessed: true,
      playersAffected: [player.name]
    };
  } else if (diceRoll === 4) {
    // (3) Miracle! Survive and find +2 ore
    player.resources.ore += 2;
    logFn("event", `Champion${championId} miraculously survives and finds +2 ore!`);

    return {
      eventProcessed: true,
      playersAffected: [player.name],
      resourcesChanged: {
        [player.name]: { ore: 2 }
      }
    };
  }

  return {
    eventProcessed: false,
    errorMessage: `Unexpected dice roll ${diceRoll} for landslide`
  };
} 