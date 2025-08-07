import { AdventureThemeType, TileTier } from "../lib/types";

export interface TreasureCard {
  id: string;
  name: string;
  tier: TileTier;
  description: string;
  count: number; // How many cards of this treasure to include in deck
  carriable: boolean; // Whether this treasure can be carried as an item
  disabled?: boolean; // If true, card is not added to deck but still shown in UI
  imagePromptGuidance?: string; // If provided, this will be used to generate the image for the card
  theme?: AdventureThemeType;
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
    carriable: false,
  },
  {
    id: "rusty-sword",
    name: "Rusty sword",
    tier: 1,
    description: "Gain `+2 might`. This **item breaks** after *one fight*.",
    count: 2,
    carriable: true,
  },
  {
    id: "mysterious-ring",
    name: "Mysterious Ring",
    tier: 1,
    description: `Roll \`1d3\`:
**(1)** The ring does nothing and is *stuck* on your knight
**(2)** **Swap** location with any knight, then the ring breaks.
**(3)** \`+3 might\` against **dragons**`,
    count: 2,
    carriable: true,
  },

  // Tier 2 Treasure Cards
  {
    id: "long-sword",
    name: "Löng Swörd",
    tier: 2,
    description: "It's a **löng swörd**. Gain `+2 might`.",
    count: 1,
    carriable: true,
    imagePromptGuidance: "Make it long, to distinguish it from a short sword.",
  },
  {
    id: "porcupine",
    name: "Porcupine",
    tier: 2,
    description: "If the opponent has **more might**, this *shield* grants `+2 might`.",
    count: 1,
    carriable: true,
    imagePromptGuidance: "A spiky shield, not the animal",
  },
  {
    id: "sword-in-stone",
    name: "Sword in a stone",
    tier: 2,
    description: `Attempt to pull the sword! Roll \`D3\`:
**(1)** It breaks off. You get **half a sword** which gives \`+2 might\`
**(2)** Card goes back to the top of the deck where it came from.
**(3)** You gain **Cloudslicer** which gives \`+4 might\``,
    count: 1,
    carriable: false, // This stays on the tile until someone pulls it out
  },
  {
    id: "staff-of-protection",
    name: "Staff of protection",
    tier: 2,
    description: `You encounter a dying wizard leaning on an interesting looking staff. Choose one:
**(1)** Steal it (lose \`2 fame\`). The staff protects all neighbouring tiles, even diagonally.
**(2)** Give him \`2 food\` (earn \`1 fame\`)
**(3)** Move on`,
    count: 2,
    carriable: true,
  },
];
