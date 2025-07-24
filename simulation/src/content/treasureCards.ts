import { TileTier } from '../lib/types';

export interface Treasure {
    name: string;
    tier: TileTier;
    icon: string;
    description: string;
    count: number; // How many cards of this treasure to include in deck
}

// All treasure cards in the game
export const TREASURES: Treasure[] = [
    // Tier 1 Treasure Cards
    {
        name: 'Broken Shield',
        tier: 1,
        icon: '🛡️',
        description: 'Choose one: Gain +1 ore, OR spend 2 ore to gain +1 arms.',
        count: 2
    },
    {
        name: 'A rusty sword',
        tier: 1,
        icon: '⚔️',
        description: 'Gain +2 arms. This item breaks after one fight.',
        count: 2
    },
    {
        name: 'Mysterious Ring',
        tier: 1,
        icon: '💍',
        description: 'Roll 1d3: (1) The ring is stuck and does nothing (can be removed at the chapel), (2) Swap your location with any other player, (3) Gain immunity to fire and +3 arms when fighting dragons and drakes.',
        count: 1
    },

    // Tier 2 Treasure Cards
    {
        name: 'Löng Swörd',
        tier: 2,
        icon: '🗡️',
        description: "It's a löng swörd. Gain +2 arms.",
        count: 1
    },
    {
        name: 'Porcupine',
        tier: 2,
        icon: '🛡️',
        description: 'If the opponent has more arms, this shield grants +2 arms.',
        count: 1
    },
    {
        name: 'Sword in a stone',
        tier: 2,
        icon: '⚔️',
        description: 'Card stays here until someone pulls it out. Roll 3+D3: (3) You break off half and gain +4 arms, (4) You gain Cloudslicer (+4 the Legendary sword, +2 arms).',
        count: 1
    }
];

// Helper function to get treasure by name
export function getTreasureByName(name: string): Treasure | undefined {
    return TREASURES.find(treasure => treasure.name === name);
}

// Helper function to get all treasures by tier
export function getTreasuresByTier(tier: TileTier): Treasure[] {
    return TREASURES.filter(treasure => treasure.tier === tier);
} 