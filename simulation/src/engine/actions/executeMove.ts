// Lords of Doomspire Movement Execution

import { GameState } from "../../game/GameState";
import { MovementValidator } from "../../lib/MovementValidator";
import type { MoveBoatAction, MoveChampionAction } from "../../lib/actionTypes";
import type { Position } from "../../lib/types";

/**
 * Execute a champion movement action
 */
export async function executeChampionMove(
  gameState: GameState,
  action: MoveChampionAction,
  playerId: number,
  diceValues?: number[],
): Promise<{ gameState: GameState; actualDestination: Position; success: boolean; errorMessage?: string }> {
  const player = gameState.getPlayerById(playerId);
  if (!player) {
    return {
      gameState,
      actualDestination: { row: -1, col: -1 },
      success: false,
      errorMessage: `Player ${playerId} not found`,
    };
  }

  const champion = gameState.getChampionById(playerId, action.championId);
  if (!champion) {
    return {
      gameState,
      actualDestination: { row: -1, col: -1 },
      success: false,
      errorMessage: `Champion ${action.championId} not found for player ${playerId}`,
    };
  }

  // Validate path using the MovementValidator
  const validation = MovementValidator.validateChampionPath(champion, action.path);
  if (!validation.isValid) {
    return {
      gameState,
      actualDestination: champion.position,
      success: false,
      errorMessage: validation.errorMessage!,
    };
  }

  // Determine the actual path, handling whether it includes starting position or not
  let pathToProcess = action.path;
  const startsFromCurrentPosition =
    action.path.length > 0 &&
    action.path[0].row === champion.position.row &&
    action.path[0].col === champion.position.col;

  if (startsFromCurrentPosition) {
    // Path includes starting position, skip it for processing
    pathToProcess = action.path.slice(1);
  }

  // If no movement after removing start position, champion stays in place
  if (pathToProcess.length === 0) {
    return {
      gameState,
      actualDestination: champion.position,
      success: true,
    };
  }

  // Check for unexplored tiles along the movement path and stop at the first one
  let actualDestination = pathToProcess[pathToProcess.length - 1];

  // Check each position in the path (all are movement positions now)
  for (let i = 0; i < pathToProcess.length; i++) {
    const position = pathToProcess[i];
    const tile = gameState.getTile(position);

    // If the tile is unexplored (explored === false), stop here
    if (tile && tile.explored === false) {
      actualDestination = position;
      break;
    }
  }

  // Update champion position in game state
  const updatedChampions = player.champions.map((c) =>
    c.id === action.championId ? { ...c, position: actualDestination } : c,
  );

  const updatedPlayer = { ...player, champions: updatedChampions };
  const updatedGameState = gameState.withUpdates({
    players: gameState.players.map((p) => (p.id === playerId ? updatedPlayer : p)),
  });

  return {
    gameState: updatedGameState,
    actualDestination,
    success: true,
  };
}

/**
 * Execute a boat movement action
 */
export async function executeBoatMove(
  gameState: GameState,
  action: MoveBoatAction,
  playerId: number,
  diceValues?: number[],
): Promise<{ gameState: GameState; success: boolean; errorMessage?: string }> {
  const player = gameState.getPlayerById(playerId);
  if (!player) {
    return {
      gameState,
      success: false,
      errorMessage: `Player ${playerId} not found`,
    };
  }

  const boat = player.boats.find((b) => b.id === action.boatId);
  if (!boat) {
    return {
      gameState,
      success: false,
      errorMessage: `Boat ${action.boatId} not found for player ${playerId}`,
    };
  }

  // Validate path using the MovementValidator
  const validation = MovementValidator.validateBoatPath(action.path);
  if (!validation.isValid) {
    return {
      gameState,
      success: false,
      errorMessage: validation.errorMessage!,
    };
  }

  // Move the boat to the destination
  const destination = action.path[action.path.length - 1];
  const updatedBoats = player.boats.map((b) =>
    b.id === action.boatId
      ? { ...b, position: destination as any } // Type assertion for ocean position
      : b,
  );

  let updatedGameState = gameState.withUpdates({
    players: gameState.players.map((p) => (p.id === playerId ? { ...p, boats: updatedBoats } : p)),
  });

  // Handle champion transport if specified
  if (action.championId && action.championDropPosition) {
    const champion = player.champions.find((c) => c.id === action.championId);
    if (!champion) {
      return {
        gameState,
        success: false,
        errorMessage: `Champion ${action.championId} not found for player ${playerId}`,
      };
    }

    // Update champion position
    const updatedChampions = player.champions.map((c) =>
      c.id === action.championId ? { ...c, position: action.championDropPosition! } : c,
    );

    const updatedPlayer = { ...player, champions: updatedChampions };
    updatedGameState = updatedGameState.withUpdates({
      players: updatedGameState.players.map((p) => (p.id === playerId ? updatedPlayer : p)),
    });
  }

  return {
    gameState: updatedGameState,
    success: true,
  };
}
