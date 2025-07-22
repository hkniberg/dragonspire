// Game Logger Utility for consistent formatting across CLI and web

import { ActionResult } from '../players/Player';
import { GameAction } from './types';

export interface DetailedTurnLog {
    round: number;
    playerId: number;
    playerName: string;
    diceRolls: number[];
    actions: Array<{ action: GameAction; result: ActionResult }>;
    turnSummary: string;
    detailedActions: string[];
}

export class GameLogger {
    /**
     * Format individual action result for display
     */
    static formatActionResult(action: GameAction, result: ActionResult, playerName: string): string {
        const status = result.success ? "succeeded" : "failed";
        const actionType = action.type;
        return `${playerName} ${actionType} ${status}: ${result.summary}`;
    }

    /**
     * Format individual action result with dice value for concise display
     */
    static formatActionResultConcise(action: GameAction, result: ActionResult): string {
        if (!result.success) {
            const dicePrefix = result.diceValuesUsed && result.diceValuesUsed.length > 0
                ? `[${result.diceValuesUsed.join('+')}]: `
                : '[?]: ';
            return `${dicePrefix}FAILED - ${result.summary}`;
        }

        const dicePrefix = result.diceValuesUsed && result.diceValuesUsed.length > 0
            ? `[${result.diceValuesUsed.join('+')}]: `
            : '';
        return `${dicePrefix}${result.summary}`;
    }

    /**
     * Convert a basic turn log to a detailed turn log with formatted action strings
     */
    static enhanceWithDetailedActions(turnLog: {
        round: number;
        playerId: number;
        playerName: string;
        diceRolls: number[];
        actions: Array<{ action: GameAction; result: ActionResult }>;
        turnSummary: string;
    }): DetailedTurnLog {
        const detailedActions = turnLog.actions.map(({ action, result }) =>
            this.formatActionResult(action, result, turnLog.playerName)
        );

        return {
            ...turnLog,
            detailedActions
        };
    }

    /**
     * Convert a basic turn log to a concise format
     */
    static formatTurnConcise(turnLog: {
        round: number;
        playerId: number;
        playerName: string;
        diceRolls: number[];
        actions: Array<{ action: GameAction; result: ActionResult }>;
        turnSummary: string;
        diaryEntry?: string;
    }): string[] {
        const lines: string[] = [];

        // Turn header with dice
        lines.push(`--- Round ${turnLog.round}, ${turnLog.playerName} ---`);
        lines.push(`Dice rolled: [${turnLog.diceRolls.join(',')}]`);

        // Actions with dice values
        const successfulActions = turnLog.actions.filter(({ result }) => result.success);
        for (const { action, result } of successfulActions) {
            lines.push(this.formatActionResultConcise(action, result));
        }

        // Only show aggregated harvest summary if there are multiple harvest actions
        const harvestActions = turnLog.actions.filter(({ action, result }) =>
            action.type === 'harvest' && result.success
        );

        if (harvestActions.length > 1) {
            const allHarvestedResources: Record<string, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

            for (const { action } of harvestActions) {
                if (action.type === 'harvest') {
                    for (const [resource, amount] of Object.entries(action.resources)) {
                        allHarvestedResources[resource] = (allHarvestedResources[resource] || 0) + amount;
                    }
                }
            }

            const harvestSummary = Object.entries(allHarvestedResources)
                .filter(([_, amount]) => amount > 0)
                .map(([resource, amount]) => `${amount} ${resource}`)
                .join(', ');

            if (harvestSummary) {
                lines.push(`Total harvested: ${harvestSummary}`);
            }
        }

        return lines;
    }

    /**
     * Format turn log with diary entry for unified display (CLI and web)
     */
    static formatTurnUnified(turnLog: {
        round: number;
        playerId: number;
        playerName: string;
        diceRolls: number[];
        actions: Array<{ action: GameAction; result: ActionResult }>;
        turnSummary: string;
        diaryEntry?: string;
    }): string[] {
        const lines = this.formatTurnConcise(turnLog);

        // Add diary entry if it exists
        if (turnLog.diaryEntry) {
            lines.push('');
            lines.push(`💭 Player Diary: ${turnLog.diaryEntry}`);
        }

        return lines;
    }

    /**
     * Format turn header for display
     */
    static formatTurnHeader(round: number, playerId: number, playerName: string): string {
        return `--- Round ${round}, Player ${playerId} (${playerName}) ---`;
    }

    /**
     * Format dice rolls for display
     */
    static formatDiceRolls(diceRolls: number[]): string {
        return `Dice rolled: [${diceRolls.join(', ')}]`;
    }

    /**
     * Format turn start message
     */
    static formatTurnStart(playerName: string, diceRolls: number[]): string {
        return `${playerName} starting turn with dice: [${diceRolls.join(', ')}]`;
    }

    /**
     * Format turn end message
     */
    static formatTurnEnd(playerName: string): string {
        return `${playerName} ending turn`;
    }

    /**
     * Format turn summary
     */
    static formatTurnSummary(turnSummary: string): string {
        return `Turn Summary: ${turnSummary}`;
    }

    /**
     * Get all log messages for a turn in CLI format
     */
    static getCliTurnMessages(detailedTurnLog: DetailedTurnLog): string[] {
        const messages: string[] = [];

        // Turn header
        messages.push(this.formatTurnHeader(detailedTurnLog.round, detailedTurnLog.playerId, detailedTurnLog.playerName));

        // Dice rolls
        messages.push(this.formatDiceRolls(detailedTurnLog.diceRolls));

        // Turn start
        messages.push(this.formatTurnStart(detailedTurnLog.playerName, detailedTurnLog.diceRolls));

        // Individual actions
        messages.push(...detailedTurnLog.detailedActions);

        // Turn end
        messages.push(this.formatTurnEnd(detailedTurnLog.playerName));

        // Turn summary
        messages.push(this.formatTurnSummary(detailedTurnLog.turnSummary));

        return messages;
    }
} 