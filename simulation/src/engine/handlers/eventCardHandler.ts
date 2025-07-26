import { GameState } from "@/game/GameState";
import { DecisionContext, OceanPosition, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

export interface EventCardResult {
  eventProcessed: boolean;
  playersAffected?: string[];
  resourcesChanged?: Record<string, { food?: number; wood?: number; ore?: number; gold?: number }>;
  boatsMoved?: boolean;
  oasisTokensAdded?: number;
  errorMessage?: string;
}

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
 * Handle the Hungry Pests event card
 */
export async function handleHungryPests(
  gameState: GameState,
  currentPlayer: Player,
  currentPlayerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void
): Promise<EventCardResult> {
  logFn("event", "Hungry Pests! Choose 1 player who loses 1 food to starved rats.");

  // Create decision context for choosing target player
  const availablePlayers = gameState.players.map(p => ({
    name: p.name,
    displayName: `${p.name} (${p.resources.food} food)`
  }));

  const decisionContext: DecisionContext = {
    type: "choose_target_player",
    description: "Choose which player loses 1 food to the hungry pests",
    options: availablePlayers
  };

  try {
    // Ask current player to make the decision
    const decision = await currentPlayerAgent.makeDecision(gameState, [], decisionContext);
    const targetPlayerName = decision.choice.name;

    // Apply the food loss to the chosen player
    const targetPlayer = gameState.getPlayer(targetPlayerName);
    if (targetPlayer) {
      const foodLost = Math.min(1, targetPlayer.resources.food);
      targetPlayer.resources.food = Math.max(0, targetPlayer.resources.food - 1);
      logFn("event", `${currentPlayer.name} chose ${targetPlayerName} to lose 1 food to hungry pests`);

      return {
        eventProcessed: true,
        playersAffected: [targetPlayerName],
        resourcesChanged: {
          [targetPlayerName]: { food: -foodLost }
        }
      };
    } else {
      const errorMessage = `Error: Could not find target player ${targetPlayerName}`;
      logFn("event", errorMessage);
      return {
        eventProcessed: false,
        errorMessage
      };
    }
  } catch (error) {
    const errorMessage = `Error processing Hungry Pests decision: ${error}`;
    logFn("event", errorMessage);
    return {
      eventProcessed: false,
      errorMessage
    };
  }
}

/**
 * Main event card handler dispatcher
 */
export async function handleEventCard(
  eventCard: any,
  gameState: GameState,
  currentPlayer: Player,
  currentPlayerAgent: PlayerAgent,
  gameLog: any[],
  logFn: (type: string, content: string) => void
): Promise<EventCardResult> {
  if (eventCard.id === "sudden-storm") {
    return handleSuddenStorm(gameState, logFn);
  } else if (eventCard.id === "hungry-pests") {
    return await handleHungryPests(gameState, currentPlayer, currentPlayerAgent, logFn);
  } else {
    // Other event cards not yet implemented
    const message = `Event card ${eventCard.name} drawn, but not yet implemented`;
    logFn("event", message);
    return {
      eventProcessed: false,
      errorMessage: `Event card ${eventCard.id} not implemented`
    };
  }
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