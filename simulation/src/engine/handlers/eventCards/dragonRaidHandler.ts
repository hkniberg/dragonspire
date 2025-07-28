import { GameState } from "@/game/GameState";
import { EventCardResult, Player, Tile } from "@/lib/types";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Get all claimed tiles for a player that can be raided (excluding home tiles)
 */
function getRaidableTiles(gameState: GameState, player: Player): Tile[] {
  const claimedTiles = gameState.getClaimedTiles(player.name);
  // Filter out home tiles - they cannot be raided
  return claimedTiles.filter(tile => tile.tileType !== "home");
}

/**
 * Handle the Dragon Raid event card
 * Each player loses 1D3 claimed tiles at random. Home tiles are never raided.
 */
export function handleDragonRaid(
  gameState: GameState,
  logFn: (type: string, content: string) => void
): EventCardResult {
  logFn("event", "The dragon raids the island, claiming territory from all players!");

  const playersAffected: string[] = [];
  let totalTilesRaided = 0;

  // Process each player
  for (const currentPlayer of gameState.players) {
    // Roll 1D3 to determine how many tiles this player loses
    const tilesToLose = rollD3();
    logFn("event", `${currentPlayer.name} rolls ${tilesToLose} - must lose ${tilesToLose} claimed tile(s)`);

    // Get tiles that can be raided (excluding home tiles)
    const raidableTiles = getRaidableTiles(gameState, currentPlayer);

    if (raidableTiles.length === 0) {
      logFn("event", `${currentPlayer.name} has no tiles that can be raided (home tiles are protected)`);
      continue;
    }

    // Determine how many tiles to actually lose (can't lose more than available)
    const actualTilesToLose = Math.min(tilesToLose, raidableTiles.length);

    if (actualTilesToLose === 0) {
      logFn("event", `${currentPlayer.name} has no tiles to lose`);
      continue;
    }

    // Randomly select tiles to remove
    const tilesToRemove: Tile[] = [];
    const availableTiles = [...raidableTiles]; // Create a copy to modify

    for (let i = 0; i < actualTilesToLose; i++) {
      if (availableTiles.length === 0) break;

      // Pick a random tile from the remaining available tiles
      const randomIndex = Math.floor(Math.random() * availableTiles.length);
      const selectedTile = availableTiles[randomIndex];

      tilesToRemove.push(selectedTile);
      availableTiles.splice(randomIndex, 1); // Remove from available tiles

      logFn("event", `${currentPlayer.name} loses tile (${selectedTile.position.row}, ${selectedTile.position.col}) to the dragon`);
    }

    // Remove claims from selected tiles
    for (const tile of tilesToRemove) {
      tile.claimedBy = undefined;
      totalTilesRaided++;
    }

    if (tilesToRemove.length > 0) {
      playersAffected.push(currentPlayer.name);
    }
  }

  if (totalTilesRaided === 0) {
    logFn("event", "The dragon finds no suitable territory to raid and flies away");
  } else {
    logFn("event", `Dragon raid complete: ${totalTilesRaided} total tiles claimed by the dragon`);
  }

  return {
    eventProcessed: true,
    playersAffected
  };
} 