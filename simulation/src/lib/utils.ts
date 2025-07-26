import { Position } from "./types";

export function formatResources(
  resources: Record<string, number> | undefined
): string {
  if (!resources) return "None";

  const formatted = Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => {
      return `${amount} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    })
    .join(" ");

  return formatted || "None";
};

export function formatPosition(position: Position): string {
  return `(${position.row}, ${position.col})`;
}

