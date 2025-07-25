// Lords of Doomspire Player Interface

import { GameState } from '../game/GameState';
import { GameAction } from '../lib/types';

export type PlayerType = 'random' | 'claude' | 'human';

/**
 * Turn context provided to players for dice decisions
 */
export interface TurnContext {
    turnNumber: number;
    diceRolled: number[];
    remainingDiceValues: number[];
}

/**
 * Context for runtime decisions that arise during action resolution
 */
export interface DecisionContext {
    type: string; // e.g., 'fight_or_flee', 'choose_card', 'choose_target'
    description: string; // Human readable description of the situation
    options: any[]; // Available choices (type depends on decision type)
    metadata?: any; // Additional context specific to the decision type
}

/**
 * Player's declared intent for dice usage (extends GameAction)
 */
export type DiceAction = GameAction;

/**
 * Generic decision made by a player
 */
export interface Decision {
    choice: any; // The chosen option from DecisionContext.options
    reasoning?: string; // Optional reasoning for debugging
}

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
 * Tagged log entry in the sequential game log
 */
export interface GameLogEntry {
    round: number;
    playerId: number;
    playerName: string;
    type: 'movement' | 'combat' | 'harvest' | 'diary' | 'event' | 'system';
    content: string; // High-level description of what happened
    metadata?: any; // Additional structured data if needed
}

/**
 * Action log entry for a completed turn (for backwards compatibility with existing code)
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
 * Function provided by GameMaster for executing actions during turn resolution
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
     * Decide what to do with a single die value
     * @param gameState Current game state
     * @param gameLog Sequential log of all game events so far
     * @param turnContext Information about the current turn and remaining dice
     * @returns DiceAction intent declaring what the player wants to do
     */
    decideDiceAction(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext
    ): Promise<DiceAction>;

    /**
     * Make a runtime decision when choices arise during action resolution
     * @param gameState Current game state
     * @param gameLog Sequential log of all game events so far
     * @param decisionContext Description of the choice to be made
     * @returns Decision object with the chosen option
     */
    makeDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext
    ): Promise<Decision>;

    /**
     * Write a high-level diary entry for strategic reflection at the start of each turn
     * @param gameState Current game state
     * @param gameLog Sequential log of all game events so far
     * @returns String describing the player's thoughts and strategy (or undefined to skip)
     */
    writeDiaryEntry(
        gameState: GameState,
        gameLog: readonly GameLogEntry[]
    ): Promise<string | undefined>;

    /**
     * Legacy method for backwards compatibility - will be removed
     * @deprecated Use the new decideDiceAction/makeDecision pattern instead
     */
    executeTurn?(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction,
        actionLog: readonly ActionLogEntry[]
    ): Promise<string | undefined>;

    /**
     * Legacy method for backwards compatibility - will be removed  
     * @deprecated Use the new makeDecision method instead
     */
    handleEventCardChoice?(
        gameState: GameState,
        eventCardId: string,
        availableChoices: any[]
    ): Promise<any>;
} 