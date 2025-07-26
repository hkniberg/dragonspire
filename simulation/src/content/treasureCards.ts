import { TileTier } from "../lib/types";

export interface TreasureCard {
  id: string;
  name: string;
  tier: TileTier;
  description: string;
  count: number; // How many cards of this treasure to include in deck
}

export function getTreasureCardById(id: string): TreasureCard | undefined {
  return TREASURE_CARDS.find((treasure) => treasure.id === id);
}

// All treasure cards in the game
export const TREASURE_CARDS: TreasureCard[] = [
  // Tier 1 Treasure Cards
  {
    id: "broken-shield",
    name: "Broken Shield",
    tier: 1,
    description: `Choose one:  
Gain \`+1 ore\`, **OR**  
Spend \`2 ore\` to gain \`+1 might\``,
    count: 2,
  },
  {
    id: "rusty-sword",
    name: "Rusty sword",
    tier: 1,
    description: "Gain `+2 might`. This **item breaks** after *one fight*.",
    count: 2,
  },
  {
    id: "mysterious-ring",
    name: "Mysterious Ring",
    tier: 1,
    description: `Roll \`1d3\`:  
**(1)** The ring is *stuck* (can remove at **temple**)  
**(2)** **Swap** location with any knight  
**(3)** \`+3 might\` against **dragons** & **drakes**`,
    count: 1,
  },

  // Tier 2 Treasure Cards
  {
    id: "long-sword",
    name: "Löng Swörd",
    tier: 2,
    description: "It's a **löng swörd**. Gain `+2 might`.",
    count: 1,
  },
  {
    id: "porcupine",
    name: "Porcupine",
    tier: 2,
    description: "If the opponent has **more might**, this *shield* grants `+2 might`.",
    count: 1,
  },
  {
    id: "sword-in-stone",
    name: "Sword in a stone",
    tier: 2,
    description: `Card stays here until someone **pulls it out**. Roll \`3+D3\`:  
**(3)** You break off half and gain \`+2 might\`  
**(9)** You gain **Cloudslicer** and gain \`+4 might\``,
    count: 1,
  },
];
