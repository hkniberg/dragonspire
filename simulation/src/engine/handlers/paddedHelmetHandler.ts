import { GameState } from "@/game/GameState";
import { DecisionContext, GameLogEntry, PaddedHelmetTileOption, Player } from "@/lib/types";
import { getManhattanDistance } from "@/lib/utils";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Check if a player has a specific trader item
 */
function hasTraderItem(player: Player, itemId: string): boolean {
  return player.champions.some(champion =>
    champion.items.some(item => item.traderItem?.id === itemId)
  );
}

/**
 * Handle padded helmet respawn logic when a champion is defeated
 * @returns The position where the champion should respawn, or undefined for normal home respawn
 */
export async function handlePaddedHelmetRespawn(
  gameState: GameState,
  player: Player,
  championId: number,
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  logFn?: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<{ row: number; col: number } | undefined> {
  // Check if player has a padded helmet
  const hasPaddedHelmet = hasTraderItem(player, "padded-helmet");

  if (!hasPaddedHelmet) {
    return undefined; // Normal defeat handling
  }

  // Find all claimed resource tiles within 1-3 steps of home that are not occupied by other champions
  const claimedTiles = gameState.board.findTiles(tile =>
    tile.claimedBy === player.name &&
    tile.tileType === "resource" &&
    getManhattanDistance(tile.position, player.homePosition) >= 1 &&
    getManhattanDistance(tile.position, player.homePosition) <= 3 &&
    !isPositionOccupiedByOtherChampions(gameState, tile.position, player.name)
  );

  if (claimedTiles.length === 0) {
    if (logFn) {
      logFn("combat", "Padded helmet available but no eligible claimed tiles to respawn at");
    }
    return undefined; // No eligible tiles, normal defeat handling
  }

  if (claimedTiles.length === 1) {
    // Only one option, use it automatically
    const chosenTile = claimedTiles[0];
    if (logFn) {
      logFn("combat", `Padded helmet allows respawn at claimed tile (${chosenTile.position.row}, ${chosenTile.position.col})`);
    }
    return chosenTile.position;
  }

  if (playerAgent && gameLog) {
    // Multiple options, ask player to choose
    const tileOptions: PaddedHelmetTileOption[] = claimedTiles.map(tile => ({
      type: "tile",
      position: tile.position,
      displayName: `Tile at (${tile.position.row}, ${tile.position.col}) - ${getManhattanDistance(tile.position, player.homePosition)} steps from home`
    }));

    const decisionContext: DecisionContext = {
      type: "padded_helmet_respawn",
      description: "Your padded helmet allows you to respawn at one of your claimed tiles within 1-3 steps of home. Choose where to respawn:",
      options: tileOptions
    };

    const decision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);
    const chosenTile = claimedTiles.find(tile =>
      tile.position.row === decision.choice.position.row &&
      tile.position.col === decision.choice.position.col
    )!;

    if (logFn) {
      logFn("combat", `Padded helmet allows respawn at chosen tile (${chosenTile.position.row}, ${chosenTile.position.col})`);
    }
    return chosenTile.position;
  } else {
    // Fallback: if no playerAgent available, choose randomly
    const randomIndex = Math.floor(Math.random() * claimedTiles.length);
    const chosenTile = claimedTiles[randomIndex];
    if (logFn) {
      logFn("combat", `Padded helmet allows respawn at randomly chosen tile (${chosenTile.position.row}, ${chosenTile.position.col})`);
    }
    return chosenTile.position;
  }
}

/**
 * Check if a position is occupied by champions from other players
 */
function isPositionOccupiedByOtherChampions(gameState: GameState, position: { row: number; col: number }, excludePlayerName: string): boolean {
  // Get all opposing champions at this position (champions from other players)
  const otherChampions = gameState.getOpposingChampionsAtPosition(excludePlayerName, position);

  return otherChampions.length > 0;
} 