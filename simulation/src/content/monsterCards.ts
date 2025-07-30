import { BiomeType, TileTier } from "../lib/types";

export interface MonsterCard {
  id: string;
  name: string;
  tier: TileTier;
  biome: BiomeType;
  icon: string;
  might: number;
  fame: number;
  resources: Record<string, number>;
  count: number; // How many cards of this monster to include in deck
  isBeast?: boolean; // Whether this monster is classified as a beast (default false)
  disabled?: boolean; // If true, card is not added to deck but still shown in UI
  imagePromptGuidance?: string; // If provided, this will be used to generate the image for the card
}

export function getMonsterCardById(id: string): MonsterCard | undefined {
  return MONSTER_CARDS.find((monster) => monster.id === id);
}

// All monsters in the game
export const MONSTER_CARDS: MonsterCard[] = [
  // Plains Biome Monsters
  {
    id: "wolf",
    name: "Wolf",
    tier: 1,
    biome: "plains",
    icon: "🐺",
    might: 2,
    fame: 1,
    resources: { food: 2, wood: 0, ore: 0, gold: 0 },
    count: 2,
    isBeast: true,
  },
  {
    id: "boar",
    name: "Boar",
    tier: 1,
    biome: "plains",
    icon: "🐗",
    might: 2,
    fame: 1,
    resources: { food: 2, wood: 0, ore: 0, gold: 0 },
    count: 2,
    isBeast: true,
  },
  {
    id: "bandit",
    name: "Bandit",
    tier: 1,
    biome: "plains",
    icon: "🗡️",
    might: 3,
    fame: 1,
    resources: { food: 0, wood: 0, ore: 0, gold: 2 },
    count: 1,
  },

  // Mountains Biome Monsters
  {
    id: "dwerm",
    name: "Dwerm",
    tier: 1,
    biome: "mountains",
    icon: "⛏️",
    might: 2,
    fame: 1,
    resources: { food: 0, wood: 0, ore: 2, gold: 0 },
    count: 2,
  },
  {
    id: "rock-golem",
    name: "Rock golem",
    tier: 1,
    biome: "mountains",
    icon: "🗿",
    might: 3,
    fame: 1,
    resources: { food: 0, wood: 0, ore: 2, gold: 0 },
    count: 2,
  },
  {
    id: "troll-spawn",
    name: "Troll spawn",
    tier: 1,
    biome: "mountains",
    icon: "👹",
    might: 5,
    fame: 2,
    resources: { food: 0, wood: 0, ore: 2, gold: 2 },
    count: 1,
  },

  // Woodlands Biome Monsters
  {
    id: "sprout",
    name: "Sprout",
    tier: 1,
    biome: "woodlands",
    icon: "🌱",
    might: 2,
    fame: 1,
    resources: { food: 0, wood: 2, ore: 0, gold: 0 },
    count: 2,
    imagePromptGuidance: "A mischevious plant spirit",
  },
  {
    id: "fairy",
    name: "Fairy",
    tier: 1,
    biome: "woodlands",
    icon: "🧚",
    might: 2,
    fame: 1,
    resources: { food: 0, wood: 2, ore: 0, gold: 0 },
    count: 2,
    imagePromptGuidance: "A scary but beautiful fairy",
  },
  {
    id: "entling",
    name: "Entling",
    tier: 1,
    biome: "woodlands",
    icon: "🌳",
    might: 4,
    fame: 1,
    resources: { food: 0, wood: 3, ore: 0, gold: 0 },
    count: 1,
    imagePromptGuidance: "The young gangly version of an ent, dangerous and intelligent.",
  },

  // TIER 2 MONSTERS
  // Plains Biome Tier 2 Monsters
  {
    id: "bear",
    name: "Bear",
    tier: 2,
    biome: "plains",
    icon: "🐻",
    might: 5,
    fame: 2,
    resources: { food: 3, wood: 0, ore: 0, gold: 0 },
    count: 2,
    isBeast: true,
  },
  {
    id: "assassin",
    name: "Assassin",
    tier: 2,
    biome: "plains",
    icon: "🗡️",
    might: 5,
    fame: 2,
    resources: { food: 0, wood: 0, ore: 0, gold: 3 },
    count: 1,
  },

  // Mountains Biome Tier 2 Monsters
  {
    id: "iron-golem",
    name: "Iron golem",
    tier: 2,
    biome: "mountains",
    icon: "⚙️",
    might: 5,
    fame: 2,
    resources: { food: 0, wood: 0, ore: 3, gold: 0 },
    count: 2,
  },
  {
    id: "troll",
    name: "Troll",
    tier: 2,
    biome: "mountains",
    icon: "👹",
    might: 7,
    fame: 3,
    resources: { food: 0, wood: 0, ore: 3, gold: 3 },
    count: 1,
  },

  // Woodlands Biome Tier 2 Monsters
  {
    id: "elven-huntress",
    name: "Elven huntress",
    tier: 2,
    biome: "woodlands",
    icon: "🏹",
    might: 4,
    fame: 1,
    resources: { food: 0, wood: 3, ore: 0, gold: 0 },
    count: 2,
    imagePromptGuidance: "A battle-hardened cold-blooded female elven warrior",
  },
  {
    id: "ent",
    name: "Ent",
    tier: 2,
    biome: "woodlands",
    icon: "🌲",
    might: 6,
    fame: 2,
    resources: { food: 0, wood: 4, ore: 0, gold: 0 },
    count: 1,
  },

  // TIER 3 MONSTERS
  // Plains Biome Tier 3 Monsters (Beast tile)
  {
    id: "wyrm",
    name: "Wyrm",
    tier: 3,
    biome: "plains",
    icon: "🐲",
    might: 7,
    fame: 3,
    resources: { food: 3, wood: 0, ore: 0, gold: 3 },
    count: 1,
    isBeast: true,
  },
  {
    id: "fallen-knight",
    name: "Fallen Knight",
    tier: 3,
    biome: "plains",
    icon: "⚔️",
    might: 8,
    fame: 4,
    resources: { food: 0, wood: 0, ore: 4, gold: 4 },
    count: 1,
  },

  // Mountains Biome Tier 3 Monsters
  {
    id: "demon-core",
    name: "Demon core",
    tier: 3,
    biome: "mountains",
    icon: "👹",
    might: 8,
    fame: 4,
    resources: { food: 0, wood: 0, ore: 4, gold: 3 },
    count: 1,
  },
  {
    id: "troll-lord",
    name: "Troll lord",
    tier: 3,
    biome: "mountains",
    icon: "👑",
    might: 10,
    fame: 5,
    resources: { food: 0, wood: 0, ore: 5, gold: 5 },
    count: 1,
  },

  // Woodlands Biome Tier 3 Monsters
  {
    id: "three-eyed-ape",
    name: "Three eyed ape",
    tier: 3,
    biome: "woodlands",
    icon: "🐒",
    might: 7,
    fame: 3,
    resources: { food: 3, wood: 3, ore: 0, gold: 0 },
    count: 1,
    isBeast: true,
  },
  {
    id: "ancient",
    name: "Ancient",
    tier: 3,
    biome: "woodlands",
    icon: "🌳",
    might: 9,
    fame: 4,
    resources: { food: 0, wood: 4, ore: 4, gold: 0 },
    count: 1,
  },
];
