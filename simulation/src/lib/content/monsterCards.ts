import { BiomeType, TileTier } from '../types';

export interface Monster {
    name: string;
    tier: TileTier;
    biome: BiomeType;
    icon: string;
    might: number;
    fame: number;
    resources: Record<string, number>;
    count: number; // How many cards of this monster to include in deck
}

// All monsters in the game
export const MONSTERS: Monster[] = [
    // Plains Biome Monsters
    {
        name: 'Wolf',
        tier: 1,
        biome: 'plains',
        icon: '🐺',
        might: 2,
        fame: 1,
        resources: { food: 2, wood: 0, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Boar',
        tier: 1,
        biome: 'plains',
        icon: '🐗',
        might: 2,
        fame: 1,
        resources: { food: 2, wood: 0, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Bandit',
        tier: 1,
        biome: 'plains',
        icon: '🗡️',
        might: 3,
        fame: 1,
        resources: { food: 0, wood: 0, ore: 0, gold: 2 },
        count: 1
    },

    // Mountains Biome Monsters
    {
        name: 'Dwerm',
        tier: 1,
        biome: 'mountains',
        icon: '⛏️',
        might: 2,
        fame: 1,
        resources: { food: 0, wood: 0, ore: 2, gold: 0 },
        count: 2
    },
    {
        name: 'Rock golem',
        tier: 1,
        biome: 'mountains',
        icon: '🗿',
        might: 3,
        fame: 1,
        resources: { food: 0, wood: 0, ore: 2, gold: 0 },
        count: 2
    },
    {
        name: 'Troll spawn',
        tier: 1,
        biome: 'mountains',
        icon: '👹',
        might: 5,
        fame: 2,
        resources: { food: 0, wood: 0, ore: 2, gold: 2 },
        count: 1
    },

    // Woodlands Biome Monsters
    {
        name: 'Sprout',
        tier: 1,
        biome: 'woodlands',
        icon: '🌱',
        might: 2,
        fame: 1,
        resources: { food: 0, wood: 2, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Fairy',
        tier: 1,
        biome: 'woodlands',
        icon: '🧚',
        might: 2,
        fame: 1,
        resources: { food: 0, wood: 2, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Entling',
        tier: 1,
        biome: 'woodlands',
        icon: '🌳',
        might: 4,
        fame: 1,
        resources: { food: 0, wood: 3, ore: 0, gold: 0 },
        count: 1
    },

    // TIER 2 MONSTERS
    // Plains Biome Tier 2 Monsters
    {
        name: 'Bear',
        tier: 2,
        biome: 'plains',
        icon: '🐻',
        might: 5,
        fame: 2,
        resources: { food: 3, wood: 0, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Assassin',
        tier: 2,
        biome: 'plains',
        icon: '🗡️',
        might: 5,
        fame: 2,
        resources: { food: 0, wood: 0, ore: 0, gold: 3 },
        count: 1
    },

    // Mountains Biome Tier 2 Monsters
    {
        name: 'Iron golem',
        tier: 2,
        biome: 'mountains',
        icon: '⚙️',
        might: 5,
        fame: 2,
        resources: { food: 0, wood: 0, ore: 3, gold: 0 },
        count: 2
    },
    {
        name: 'Troll',
        tier: 2,
        biome: 'mountains',
        icon: '👹',
        might: 7,
        fame: 3,
        resources: { food: 0, wood: 0, ore: 3, gold: 3 },
        count: 1
    },

    // Woodlands Biome Tier 2 Monsters
    {
        name: 'Elven huntress',
        tier: 2,
        biome: 'woodlands',
        icon: '🏹',
        might: 4,
        fame: 1,
        resources: { food: 0, wood: 3, ore: 0, gold: 0 },
        count: 2
    },
    {
        name: 'Ent',
        tier: 2,
        biome: 'woodlands',
        icon: '🌲',
        might: 6,
        fame: 2,
        resources: { food: 0, wood: 4, ore: 0, gold: 0 },
        count: 1
    },

    // TIER 3 MONSTERS
    // Plains Biome Tier 3 Monsters (Beast tile)
    {
        name: 'Wyrm',
        tier: 3,
        biome: 'plains',
        icon: '🐲',
        might: 7,
        fame: 3,
        resources: { food: 3, wood: 0, ore: 0, gold: 3 },
        count: 1
    },
    {
        name: 'Fallen Knight',
        tier: 3,
        biome: 'plains',
        icon: '⚔️',
        might: 8,
        fame: 4,
        resources: { food: 0, wood: 0, ore: 4, gold: 4 },
        count: 1
    },

    // Mountains Biome Tier 3 Monsters
    {
        name: 'Demon core',
        tier: 3,
        biome: 'mountains',
        icon: '👹',
        might: 8,
        fame: 4,
        resources: { food: 0, wood: 0, ore: 4, gold: 3 },
        count: 1
    },
    {
        name: 'Troll lord',
        tier: 3,
        biome: 'mountains',
        icon: '👑',
        might: 10,
        fame: 5,
        resources: { food: 0, wood: 0, ore: 5, gold: 5 },
        count: 1
    },

    // Woodlands Biome Tier 3 Monsters
    {
        name: 'Three eyed ape',
        tier: 3,
        biome: 'woodlands',
        icon: '🐒',
        might: 7,
        fame: 3,
        resources: { food: 3, wood: 3, ore: 0, gold: 0 },
        count: 1
    },
    {
        name: 'Ancient',
        tier: 3,
        biome: 'woodlands',
        icon: '🌳',
        might: 9,
        fame: 4,
        resources: { food: 0, wood: 4, ore: 4, gold: 0 },
        count: 1
    }
];

// Helper function to get monster by name
export function getMonsterByName(name: string): Monster | undefined {
    return MONSTERS.find(monster => monster.name === name);
}

// Helper function to get all monsters by tier
export function getMonstersByTier(tier: TileTier): Monster[] {
    return MONSTERS.filter(monster => monster.tier === tier);
}

// Helper function to get all monsters by biome
export function getMonstersByBiome(biome: BiomeType): Monster[] {
    return MONSTERS.filter(monster => monster.biome === biome);
} 