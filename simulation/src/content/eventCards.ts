import { TileTier } from "../lib/types";

export interface EventCard {
  id: string;
  name: string;
  tier: TileTier;
  description: string;
  count: number; // How many cards of this event to include in deck
  disabled?: boolean; // If true, card is not added to deck but still shown in UI
  imagePromptGuidance?: string; // If provided, this will be used to generate the image for the card
}

// Helper function to get event by ID
export function getEventCardById(id: string): EventCard | undefined {
  return EVENT_CARDS.find((event) => event.id === id);
}

// All event cards in the game
export const EVENT_CARDS: EventCard[] = [
  // Tier 1 Event Cards
  {
    id: "hungry-pests",
    name: "Hungry pests",
    tier: 1,
    description: "Choose **1 player** who loses `1 food` to a mischief of *starved rats*.",
    count: 2,
  },
  {
    id: "market-day",
    name: "Market day",
    tier: 1,
    description: `Decide if today is **Market Day**.  
If so, *every player* must send **1 champion** to the trader, or refuse and pay \`1 gold\` in tax.`,
    count: 2,
  },
  {
    id: "thug-ambush",
    name: "Thug Ambush",
    tier: 1,
    description: `Roll \`1+D3\`:  
**(1)** They steal \`1 gold\` (if you have any)  
**(2)** Fight *bandit* \`might 3\`, if you win, gain \`1 fame\` and \`2 gold\`  
**(3)** You scare them off and gain \`1 fame\``,
    count: 2,
  },
  {
    id: "landslide",
    name: "Landslide",
    tier: 1,
    description: `Roll \`1+D3\`:  
**(1)** Flee to your **home tile**  
**(2)** Flee to your nearest **claimed tile** (unoccupied)  
**(3)** Miracle! You survive and find \`+2 ore\``,
    count: 2,
  },
  {
    id: "sudden-storm",
    name: "Sudden storm",
    tier: 1,
    description: "All **boats** move into an adjacent *sea*. All **oases** gain `+1 mystery card`.",
    count: 2,
  },

  // Tier 2 Event Cards
  {
    disabled: true,
    id: "hornet-swarm",
    name: "Hornet swarm",
    tier: 2,
    description: "Roll `2D3` to flee the swarm. The player to your right chooses direction, you must then move in that direction. Any **champion** passed by or through must *repeat this*.",
    count: 1,
  },
  {
    id: "druid-rampage",
    name: "Druid rampage",
    tier: 2,
    description:
      "A *wild-eyed Druid* hands you a **runed dagger**. `+1 might`. Once you leave, he turns into a *Bear*.",
    count: 1,
  },
  {
    id: "you-got-riches",
    name: "You got riches!",
    tier: 2,
    description:
      "A shouting **genie** is granting everyone wishes. All players collect `1x food, ore, wood, gold`. All *oasis* also gain `+1 mystery card`.",
    count: 1,
  },
  // Tier 3 Event Cards
  {
    id: "curse-of-the-earth",
    name: "Curse of the Earth",
    tier: 3,
    description: "You may pay the Bogwitch `2x gold` to **curse the lands**. If so *all* players (including you) lose `2 might` (if they have it), as their weapons rust and crumble.",
    count: 1,
  },
  {
    id: "thieving-crows",
    name: "Thieving crows",
    tier: 3,
    description: "Choose which resource gets stolen: food, wood, or ore. All players lose all of that resource. The crows are not interested in gold.",
    count: 1,
  },
  {
    id: "dragon-raid",
    name: "Dragon raid",
    tier: 3,
    description: "Each player loses 1D3 claimed tiles of their choice. Home tiles are never raided.",
    count: 1,
  },
  {
    id: "sea-monsters",
    name: "Sea monsters",
    tier: 3,
    description: `Sea monsters invade one **ocean tile** of your choice. For each **boat** there, the boat owner decides:  
**Captain fights to the end.** Gain \`+2 fame\`, lose the boat.  
**Captain flees.** Lose \`−1 fame\`, move the boat one step.`,
    count: 1,
  },
];
