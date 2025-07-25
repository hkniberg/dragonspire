// Lords of Doomspire Victory Conditions

import { GameState } from "../../game/GameState";
import { GameSettings } from "../../lib/GameSettings";

/**
 * Check victory conditions for all players
 */
export function checkVictory(gameState: GameState): { won: boolean; playerId?: number; condition?: string } {
  // Check each player for victory conditions
  for (const player of gameState.players) {
    // Check if any champion is on doomspire tile
    const championOnDoomspire = player.champions.find((champion) => {
      const tile = gameState.getTile(champion.position);
      return tile?.tileType === "doomspire";
    });

    if (championOnDoomspire) {
      // Player is visiting the dragon - check alternative victory conditions first

      // Check fame victory (10+ fame)
      if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
        return {
          won: true,
          playerId: player.id,
          condition: `achieved fame victory with ${player.fame} fame`,
        };
      }

      // Check gold victory (10+ gold)
      if (player.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
        return {
          won: true,
          playerId: player.id,
          condition: `achieved gold victory with ${player.resources.gold} gold`,
        };
      }

      // Check starred tiles victory (3+ starred resource tiles)
      const starredTileCount = gameState.board.findTiles(
        (tile) => tile.tileType === "resource" && tile.isStarred === true && tile.claimedBy === player.id,
      ).length;

      if (starredTileCount >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
        return {
          won: true,
          playerId: player.id,
          condition: `achieved economic victory with ${starredTileCount} starred resource tiles`,
        };
      }

      // If none of the alternative conditions are met, combat victory is still possible
      // but needs to be handled elsewhere when the dragon is actually defeated
    }
  }

  // Check for combat victory (dragon defeated) - this would be set elsewhere when dragon combat is resolved
  // For now we return false since combat victory checking happens during tile arrival

  return { won: false };
}
