import { GameState } from "@/game/GameState";
import { EventCardResult, OceanPosition } from "@/lib/types";

/**
 * Handle the Sudden Storm event card
 */
export function handleSuddenStorm(
  gameState: GameState,
  logFn: (type: string, content: string) => void
): EventCardResult {
  logFn("event", "Sudden Storm! All boats move into an adjacent sea. All oases gain +1 mystery card.");

  // Move all boats to adjacent ocean positions
  const movedBoats: string[] = [];
  for (const player of gameState.players) {
    for (const boat of player.boats) {
      const originalPosition = boat.position; // Store original position
      const newPosition = getAdjacentOceanPosition(boat.position);
      boat.position = newPosition;

      // Determine boat identifier for logging
      const boatIdentifier = player.boats.length > 1 ? ` ${boat.id}` : '';
      const logMessage = `${player.name}'s boat${boatIdentifier} moved from ${originalPosition} to ${newPosition}`;

      movedBoats.push(logMessage);
      logFn("event", logMessage);
    }
  }

  // Add +1 adventure token to all oasis tiles
  let oasisCount = 0;
  gameState.board.forEachTile((tile) => {
    if (tile.tileType === "oasis") {
      tile.adventureTokens = (tile.adventureTokens || 0) + 1;
      oasisCount++;
    }
  });

  if (oasisCount > 0) {
    logFn("event", `All ${oasisCount} oasis tiles gained +1 mystery card`);
  }

  return {
    eventProcessed: true,
    boatsMoved: true,
    oasisTokensAdded: oasisCount
  };
}

/**
 * Get an adjacent ocean position for sudden storm event
 */
function getAdjacentOceanPosition(currentPosition: OceanPosition): OceanPosition {
  const adjacencyMap: Record<OceanPosition, OceanPosition[]> = {
    "nw": ["ne", "sw"],
    "ne": ["nw", "se"],
    "sw": ["nw", "se"],
    "se": ["ne", "sw"]
  };

  const adjacentPositions = adjacencyMap[currentPosition];
  const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
  return adjacentPositions[randomIndex];
} 