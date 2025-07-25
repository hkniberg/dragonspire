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
    diceValuesUsed?: number[]; // Track which dice values were used for this action
    cardDrawn?: {
        cardType: string;
        cardName: string;
        effect: string; // Description of what happened
    };
}


/**
 * Action log entry for a completed turn
 */
export interface ActionLogEntry {
    round: number;
    playerId: number;
    playerName: string;
    diceRolls: number[];
    actions: Array<{ action: GameAction; result: ActionResult }>;
    diaryEntry?: string; // Optional diary entry from the player
}

/**
 * Function provided to players for executing actions during their turn
 */
export type ExecuteActionFunction = (action: GameAction, diceValues?: number[]) => Promise<ActionResult>;


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
     * @param actionLog Read-only history of all previous turns in the game
     * @returns Optional diary entry describing the player's thoughts/strategy for this turn
     */
    executeTurn(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction,
        actionLog: readonly ActionLogEntry[]
    ): Promise<string | undefined>;

    /**
     * Handle an event card that requires a player choice
     * @param gameState Current game state
     * @param eventCardId The ID of the event card being resolved
     * @param availableChoices Array of available choices (type depends on the event)
     * @returns The chosen option
     */
    handleEventCardChoice(
        gameState: GameState,
        eventCardId: string,
        availableChoices: any[]
    ): Promise<any>;
} 