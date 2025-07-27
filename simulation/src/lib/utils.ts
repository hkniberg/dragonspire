import { Position } from "./types";

export function formatResources(
  resources: Record<string, number> | undefined,
  separator: string = " "
): string {
  if (!resources) return "None";

  const formatted = Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => {
      return `${amount} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    })
    .join(separator);

  return formatted || "None";
};

export function formatPosition(position: Position): string {
  return `(${position.row}, ${position.col})`;
}

/**
 * Calculate Manhattan distance between two positions
 */
export function getManhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

