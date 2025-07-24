import { TileTier } from '../lib/types';

export interface Encounter {
    id: string;
    name: string;
    tier: TileTier;
    description: string;
    follower: boolean; // Whether this encounter can become a follower
    count: number; // How many cards of this encounter to include in deck
}

// All encounter cards in the game
export const ENCOUNTERS: Encounter[] = [
    // Tier 1 Encounter Cards
    {
        id: 'angry-dog',
        name: 'Angry dog',
        tier: 1,
        description: 'Give it `1 food` or get **chased home**.',
        follower: false,
        count: 2
    },
    {
        id: 'old-beggar',
        name: 'Old beggar',
        tier: 1,
        description: 'Refuses to leave until you pay him `1 gold`. Can be **passed** to any *champion* you walk "through".',
        follower: true,
        count: 2
    },
    {
        id: 'priestess',
        name: 'Priestess',
        tier: 1,
        description: '**Heals** you for *free* if you lose a fight.',
        follower: true,
        count: 1
    },

    // Tier 2 Encounter Cards
    {
        id: 'proud-mercenary',
        name: 'Proud Mercenary',
        tier: 2,
        description: 'Each **combat** you may pay `3x gold` and gain ten temporary `+2 arms`.',
        follower: true,
        count: 1
    },
    {
        id: 'brawler',
        name: 'Brawler',
        tier: 2,
        description: 'Each **combat** you may feed him `3x food` and gain temporary `+2 arms`.',
        follower: true,
        count: 1
    },
    {
        id: 'witch',
        name: 'Witch',
        tier: 2,
        description: `Each **combat** you may roll \`1xD3\`:  
**(1-2)** \`+1 arms\`  
**(2)** *Run away* for free  
**(3)** \`+2 arms\``,
        follower: true,
        count: 1
    }
];

// Helper function to get encounter by name
export function getEncounterByName(name: string): Encounter | undefined {
    return ENCOUNTERS.find(encounter => encounter.name === name);
}

// Helper function to get encounter by id
export function getEncounterById(id: string): Encounter | undefined {
    return ENCOUNTERS.find(encounter => encounter.id === id);
}

// Helper function to get all encounters by tier
export function getEncountersByTier(tier: TileTier): Encounter[] {
    return ENCOUNTERS.filter(encounter => encounter.tier === tier);
}

// Helper function to get all follower encounters
export function getFollowerEncounters(): Encounter[] {
    return ENCOUNTERS.filter(encounter => encounter.follower);
} 