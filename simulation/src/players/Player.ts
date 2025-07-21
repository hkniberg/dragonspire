// Lords of Doomspire Player Interface

import { GameState } from '../game/GameState';
import { GameAction } from '../lib/types';

export type PlayerType = 'random' | 'claude' | 'human';

/**
 * Result of executing an action
 */
export interface ActionResult {
    newGameState: GameState;
    summary: string;
    success: boolean;
}

/**
 * Function provided to players for executing actions during their turn
 */
export type ExecuteActionFunction = (action: GameAction) => ActionResult;

/**
 * Interface that all player implementations must follow
 */
export interface Player {
    /**
     * Get the player's display name
     */
    getName(): string;

    /**
     * Get the player's type identifier
     */
    getType(): PlayerType;

    /**
     * Execute a complete turn for this player
     * @param gameState Current game state
     * @param diceRolls Available dice values for this turn
     * @param executeAction Function to execute actions and get immediate feedback
     */
    executeTurn(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction
    ): Promise<void>;
} 