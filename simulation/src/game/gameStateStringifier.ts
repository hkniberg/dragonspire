import { GameState } from "../game/GameState";
import type { CarriableItem, Champion, Player, ResourceType, Tile } from "../lib/types";

/**
 * Converts a GameState to a readable markdown string
 */
export function stringifyGameState(gameState: GameState): string {
  const sections: string[] = [];

  // Game session section
  sections.push(formatGameSession(gameState));

  // Players section
  sections.push(formatPlayers(gameState));

  // Board section
  sections.push(formatBoard(gameState));

  return sections.join("\n\n");
}

/**
 * Converts a single tile to a readable string with full details
 */
export function stringifyTile(tile: Tile, gameState: GameState, ignorePlayerName?: string): string {
  const sentences: string[] = [];

  if (!tile.explored) {
    sentences.push(`This is an unexplored tile`);
  } else {
    // Format based on tile type
    switch (tile.tileType) {
      case "home":
        const homeOwner = getPlayerByHomePosition(tile.position, gameState);
        sentences.push(`This is a home tile for ${homeOwner?.name || "unknown"} (can ONLY be entered by ${homeOwner?.name || "unknown"}'s champions)`);
        break;
      case "resource":
        let resourceDescription = "This is a resource tile";
        if (tile.resources) {
          const resourceStr = formatResources(tile.resources);
          if (resourceStr) {
            resourceDescription += ` (${resourceStr})`;
          }
        }
        if (tile.isStarred) {
          resourceDescription += " (starred)";
        }
        if (tile.claimedBy) {
          const player = gameState.getPlayer(tile.claimedBy);
          resourceDescription += ` owned by ${player?.name || "unknown"}`;
        }
        sentences.push(resourceDescription);
        break;
      case "adventure":
        let adventureDescription = "This is an adventure tile";
        if (tile.adventureTokens !== undefined) {
          const tokenText = tile.adventureTokens === 1 ? "token" : "tokens";
          adventureDescription += ` (${tile.adventureTokens} remaining ${tokenText})`;
        }
        sentences.push(adventureDescription);
        break;
      case "temple":
        sentences.push("This is a chapel");
        break;
      case "trader":
        sentences.push("This is a trader");
        break;
      case "mercenary":
        sentences.push("This is a mercenary camp");
        break;
      case "doomspire":
        sentences.push("This is the Doomspire");
        // Add dragon information for doomspire
        sentences.push("There is a Dragon here (might 13)");
        break;
      case "oasis":
        sentences.push("This is an oasis");
        break;
      case "wolfDen":
        sentences.push("This is a wolf den");
        break;
      case "bearCave":
        sentences.push("This is a bear cave");
        break;
      case "empty":
        sentences.push("This is an empty tile");
        break;
      default:
        sentences.push(`This is a tier ${tile.tier} tile`);
    }
  }

  // Add monster information as a separate sentence
  if (tile.monster) {
    const monsterName = tile.monster.name;
    const article = ['a', 'e', 'i', 'o', 'u'].includes(monsterName.toLowerCase().charAt(0)) ? 'an' : 'a';
    sentences.push(`There is ${article} ${monsterName} here (might ${tile.monster.might})`);
  }

  // Add champions on this tile, but exclude the specified player if ignorePlayerName is provided
  const championsOnTile = getChampionsOnTile(tile.position, gameState);
  for (const champion of championsOnTile) {
    if (ignorePlayerName && champion.playerName === ignorePlayerName) {
      continue; // Skip this player's champions
    }
    const player = gameState.getPlayer(champion.playerName);
    sentences.push(`${player?.name || "unknown"} champion${champion.id} is here`);
  }

  // Add items on this tile as separate sentences
  if (tile.items && tile.items.length > 0) {
    for (const item of tile.items) {
      const itemDetails = getCarriableItemDetails(item);
      sentences.push(`There is a ${itemDetails} here`);
    }
  }

  return sentences.join(". ") + ".";
}

function formatGameSession(gameState: GameState): string {
  const currentPlayer = gameState.getCurrentPlayer();
  return `# Game session
- Current round: ${gameState.currentRound}
- Current player: ${currentPlayer.name}`;
}

function formatPlayers(gameState: GameState): string {
  const sections: string[] = ["# Players"];

  for (const player of gameState.players) {
    sections.push(formatPlayer(player, gameState));
  }

  return sections.join("\n\n");
}

function formatPlayer(player: Player, gameState: GameState): string {
  const lines: string[] = [`## ${player.name}`];

  // Basic stats
  lines.push(`- Might: ${player.might}`);
  lines.push(`- Fame: ${player.fame}`);
  lines.push(`- Home: ${formatPosition(player.homePosition)}`);

  // Resources
  const resourceStr = formatResources(player.resources);
  lines.push(`- Resource stockpile: ${resourceStr || "none"}`);

  // Champions
  for (const champion of player.champions) {
    lines.push(formatChampion(champion, player.name));
  }

  // Boats
  for (const boat of player.boats) {
    lines.push(`- boat${boat.id} at (${boat.position})`);
  }

  // Claims
  const claimedTiles = gameState.getClaimedTiles(player.name);
  if (claimedTiles.length > 0) {
    lines.push(`- claims (${claimedTiles.length} tiles of max ${player.maxClaims}):`);
    for (const tile of claimedTiles) {
      lines.push(formatClaimedTile(tile, gameState));
    }
  } else {
    lines.push("- no claims");
  }

  return lines.join("\n");
}

function formatChampion(champion: Champion, playerName: string): string {
  let line = `- champion${champion.id} at ${formatPosition(champion.position)}`;

  // Add items with full details
  for (const item of champion.items) {
    const itemDetails = getCarriableItemDetails(item);
    line += `\n  - Has ${itemDetails}`;
  }

  return line;
}

function formatClaimedTile(tile: Tile, gameState: GameState): string {
  let line = `  - Tile ${formatPosition(tile.position)}`;

  if (tile.resources) {
    const resourceStr = formatResources(tile.resources);
    if (resourceStr) {
      line += ` providing ${resourceStr}`;
    }
  }

  // Check if blockaded (using game rules)
  const blockaderPlayerName = gameState.getClaimBlockader(tile);
  if (blockaderPlayerName) {
    const blockaderPlayer = gameState.getPlayer(blockaderPlayerName);
    // Find the champion that's doing the blockading
    const blockadingChampions = getChampionsOnTile(tile.position, gameState).filter(
      (champ) => champ.playerName === blockaderPlayerName,
    );
    const championId = blockadingChampions.length > 0 ? blockadingChampions[0].id : '';
    line += ` (blockaded by ${blockaderPlayer?.name} champion${championId})`;
  }

  return line;
}

function formatBoard(gameState: GameState): string {
  const sections: string[] = ["# Board"];

  // Only show interesting tiles (explored tiles or tiles with champions)
  const interestingTiles: Tile[] = [];

  for (const row of gameState.board.getTilesGrid()) {
    for (const tile of row) {
      if (isTileInteresting(tile, gameState)) {
        interestingTiles.push(tile);
      }
    }
  }

  for (const tile of interestingTiles) {
    sections.push(formatTileForBoard(tile, gameState));
  }

  return sections.join("\n\n");
}

function formatTileForBoard(tile: Tile, gameState: GameState): string {
  const lines: string[] = [`Tile ${formatPosition(tile.position)}`];

  if (!tile.explored) {
    lines.push(`- Unexplored tile`);
  } else {
    // Format based on tile type
    switch (tile.tileType) {
      case "home":
        const homeOwner = getPlayerByHomePosition(tile.position, gameState);
        lines.push(`- Home tile for ${homeOwner?.name || "unknown"} (can ONLY be entered by ${homeOwner?.name || "unknown"}'s champions)`);
        break;
      case "resource":
        if (tile.resources) {
          const resourceStr = formatResources(tile.resources);
          if (resourceStr) {
            lines.push(`- Resource tile providing ${resourceStr}`);
          }
        }
        if (tile.isStarred) {
          lines.push("- Starred");
        }
        if (tile.claimedBy) {
          const player = gameState.getPlayer(tile.claimedBy);
          lines.push(`- Claimed by ${player?.name || "unknown"}`);
        } else {
          lines.push("- Unclaimed");
        }
        if (tile.monster) {
          lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
        }
        break;
      case "adventure":
        lines.push(`- Tier ${tile.tier} adventure tile`);
        if (tile.adventureTokens !== undefined) {
          lines.push(`- Remaining adventure tokens: ${tile.adventureTokens}`);
        }
        if (tile.monster) {
          lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
        }
        break;
      case "temple":
        lines.push("- Chapel");
        break;
      case "trader":
        lines.push("- Trader");
        break;
      case "mercenary":
        lines.push("- Mercenary camp");
        break;
      case "doomspire":
        lines.push("- Doomspire Dragon (might 13)");
        break;
      case "oasis":
        lines.push(`- Tier ${tile.tier} oasis`);
        break;
      case "wolfDen":
        lines.push("- Wolf Den");
        if (tile.monster) {
          lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
        }
        break;
      case "bearCave":
        lines.push("- Bear Cave");
        if (tile.monster) {
          lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
        }
        break;
      default:
        lines.push(`- Tier ${tile.tier} tile`);
    }
  }

  // Add champions on this tile
  const championsOnTile = getChampionsOnTile(tile.position, gameState);
  for (const champion of championsOnTile) {
    const player = gameState.getPlayer(champion.playerName);
    lines.push(`- ${player?.name || "unknown"} champion${champion.id} is here`);
  }

  // Add items on this tile with full details
  if (tile.items && tile.items.length > 0) {
    for (const item of tile.items) {
      const itemDetails = getCarriableItemDetails(item);
      lines.push(`- Item: ${itemDetails} (dropped on ground)`);
    }
  }

  return lines.join("\n");
}

function isTileInteresting(tile: Tile, gameState: GameState): boolean {
  // Show explored tiles
  if (tile.explored) {
    return true;
  }

  // Show unexplored tiles that have champions on them
  const championsOnTile = getChampionsOnTile(tile.position, gameState);
  if (championsOnTile.length > 0) {
    return true;
  }

  // Don't show empty unexplored tiles
  return false;
}

function getChampionsOnTile(position: { row: number; col: number }, gameState: GameState): Champion[] {
  const champions: Champion[] = [];
  for (const player of gameState.players) {
    for (const champion of player.champions) {
      if (champion.position.row === position.row && champion.position.col === position.col) {
        champions.push(champion);
      }
    }
  }
  return champions;
}

function getPlayerByHomePosition(
  position: { row: number; col: number },
  gameState: GameState,
): Player | undefined {
  return gameState.players.find(
    (player) => player.homePosition.row === position.row && player.homePosition.col === position.col,
  );
}

function formatPosition(position: { row: number; col: number }): string {
  return `(${position.row},${position.col})`;
}

function formatResources(resources: Record<ResourceType, number>): string {
  const parts: string[] = [];

  if (resources.food > 0) {
    parts.push(`${resources.food} food`);
  }
  if (resources.wood > 0) {
    parts.push(`${resources.wood} wood`);
  }
  if (resources.ore > 0) {
    parts.push(`${resources.ore} ore`);
  }
  if (resources.gold > 0) {
    parts.push(`${resources.gold} gold`);
  }

  return parts.join(", ");
}

// Backward compatibility - keep the class for existing code
export class GameStateStringifier {
  public static stringify(gameState: GameState): string {
    return stringifyGameState(gameState);
  }
}

// Helper function to get detailed information about a CarriableItem
function getCarriableItemDetails(item: CarriableItem): string {
  if (item.treasureCard) {
    return `${item.treasureCard.name} (${item.treasureCard.id}) - ${item.treasureCard.description}`;
  }
  if (item.traderItem) {
    return `${item.traderItem.name} (${item.traderItem.id}) - ${item.traderItem.description}`;
  }
  return 'Unknown Item';
}

// Helper function to get the name of a CarriableItem (kept for backward compatibility)
function getCarriableItemName(item: CarriableItem): string {
  if (item.treasureCard) {
    return item.treasureCard.name;
  }
  if (item.traderItem) {
    return item.traderItem.name;
  }
  return 'Unknown Item';
}
