// Action Log Formatter Utilities for consistent formatting across CLI and web

import { ActionLogEntry, ActionResult } from '../players/Player';

/**
 * Format individual action result with dice value for concise display
 */
export function formatActionResult(result: ActionResult): string {
    if (!result.success) {
        const dicePrefix = result.diceValuesUsed && result.diceValuesUsed.length > 0
            ? `[${result.diceValuesUsed.join('+')}]: `
            : '[?]: ';
        return `${dicePrefix}FAILED - ${result.summary}`;
    }

    const dicePrefix = result.diceValuesUsed && result.diceValuesUsed.length > 0
        ? `[${result.diceValuesUsed.join('')}]: `
        : '';
    return `${dicePrefix}${result.summary}`;
}

/**
 * Format turn log with diary entry for unified display (CLI and web)
 */
export function formatActionLogEntry(turnLog: ActionLogEntry): string[] {
    const lines: string[] = [];

    // Turn header with dice
    lines.push(`--- Round ${turnLog.round}, ${turnLog.playerName} ---`);
    lines.push(`Dice rolled: [${turnLog.diceRolls.join(',')}]`);

    // Actions with dice values
    const successfulActions = turnLog.actions.filter(({ result }) => result.success);
    for (const { action, result } of successfulActions) {
        lines.push(formatActionResult(result));
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

    // Add diary entry if it exists
    if (turnLog.diaryEntry) {
        lines.push('');
        lines.push(`💭 Player Diary: ${turnLog.diaryEntry}`);
    }

    return lines;
} 