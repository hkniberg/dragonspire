// Action Log Formatter Utilities for consistent formatting across CLI and web

import { ActionLogEntry, ActionResult, GameLogEntry } from "../players/Player";

/**
 * Format individual action result with dice value for concise display
 */
export function formatActionResult(result: ActionResult): string {
  if (!result.success) {
    const dicePrefix =
      result.diceValuesUsed && result.diceValuesUsed.length > 0 ? `[${result.diceValuesUsed.join("+")}]: ` : "[?]: ";
    return `${dicePrefix}FAILED - ${result.summary}`;
  }

  const dicePrefix =
    result.diceValuesUsed && result.diceValuesUsed.length > 0 ? `[${result.diceValuesUsed.join("")}]: ` : "";
  return `${dicePrefix}${result.summary}`;
}

/**
 * Format turn log with strategic assessment for unified display (CLI and web)
 */
export function formatActionLogEntry(turnLog: ActionLogEntry, onlyShowAssessmentForPlayerId?: number): string[] {
  const lines: string[] = [];

  // Turn header with dice
  lines.push(`--- Round ${turnLog.round}, ${turnLog.playerName} ---`);
  lines.push(`Dice rolled: [${turnLog.diceRolls.join(",")}]`);

  // Actions with dice values
  const successfulActions = turnLog.actions.filter(({ result }) => result.success);
  for (const { action, result } of successfulActions) {
    lines.push(formatActionResult(result));
  }

  // Only show aggregated harvest summary if there are multiple harvest actions
  const harvestActions = turnLog.actions.filter(({ action, result }) => action.type === "harvest" && result.success);

  if (harvestActions.length > 1) {
    const allHarvestedResources: Record<string, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

    for (const { action } of harvestActions) {
      if (action.type === "harvest") {
        for (const [resource, amount] of Object.entries(action.resources)) {
          allHarvestedResources[resource] = (allHarvestedResources[resource] || 0) + amount;
        }
      }
    }

    const harvestSummary = Object.entries(allHarvestedResources)
      .filter(([_, amount]) => amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(", ");

    if (harvestSummary) {
      lines.push(`Total harvested: ${harvestSummary}`);
    }
  }

  // Add strategic assessment if available and should be shown
  if (
    turnLog.strategicAssessment &&
    (onlyShowAssessmentForPlayerId === undefined || turnLog.playerId === onlyShowAssessmentForPlayerId)
  ) {
    lines.push("");
    lines.push(`💭 Strategic Assessment: ${turnLog.strategicAssessment}`);
  }

  return lines;
}

/**
 * Format GameLogEntry (new format used by GameMaster) for display
 */
export function formatGameLogEntry(logEntry: GameLogEntry): string {
  const typeEmoji = {
    movement: "🚶",
    combat: "⚔️",
    harvest: "🌾",
    assessment: "💭",
    event: "🎯",
    system: "🔧",
  };

  const emoji = typeEmoji[logEntry.type] || "📝";
  const prefix = `[Round ${logEntry.round}] ${emoji}`;

  if (logEntry.type === "system" && logEntry.playerId === -1) {
    return `${prefix} ${logEntry.content}`;
  } else {
    return `${prefix} ${logEntry.playerName}: ${logEntry.content}`;
  }
}

/**
 * Group GameLogEntries by round for better display
 */
export function groupGameLogEntriesByRound(gameLog: GameLogEntry[]): Array<{ round: number; entries: GameLogEntry[] }> {
  const groupedByRound: Record<number, GameLogEntry[]> = {};

  for (const entry of gameLog) {
    if (!groupedByRound[entry.round]) {
      groupedByRound[entry.round] = [];
    }
    groupedByRound[entry.round].push(entry);
  }

  return Object.entries(groupedByRound)
    .map(([round, entries]) => ({ round: parseInt(round), entries }))
    .sort((a, b) => a.round - b.round);
}
