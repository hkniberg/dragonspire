import { Position } from "./types";

export function formatResources(
  resources: Record<string, number> | undefined
): string {
  if (!resources) return "None";

  const resourceSymbols = {
    food: "🌾",
    wood: "🪵",
    ore: "🪨",
    gold: "💰",
  };

  const formatted = Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => {
      const symbol = resourceSymbols[type as keyof typeof resourceSymbols];
      return amount > 1 ? `${amount}${symbol}` : symbol;
    })
    .join(" ");

  return formatted || "None";
};

export function formatPosition(position: Position): string {
  return `(${position.row}, ${position.col})`;
}

