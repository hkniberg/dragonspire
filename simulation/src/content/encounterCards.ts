import { TileTier } from '../lib/types';

export interface Encounter {
    name: string;
    tier: TileTier;
    icon: string;
    description: string;
    follower: boolean; // Whether this encounter can become a follower
    count: number; // How many cards of this encounter to include in deck
}

// All encounter cards in the game
export const ENCOUNTERS: Encounter[] = [
    // Tier 1 Encounter Cards
    {
        name: 'Angry dog',
        tier: 1,
        icon: '🐕',
        description: 'Give it 1 food or get chased home.',
        follower: false,
        count: 2
    },
    {
        name: 'Old beggar',
        tier: 1,
        icon: '🧙',
        description: 'Refuses to leave until you pay him 1 gold. Can be passed to any champion you walk "through".',
        follower: true,
        count: 2
    },
    {
        name: 'Priestess',
        tier: 1,
        icon: '👩‍⚕️',
        description: 'Heals you for free if you lose a fight.',
        follower: true,
        count: 1
    },

    // Tier 2 Encounter Cards
    {
        name: 'Proud Mercenary',
        tier: 2,
        icon: '⚔️',
        description: 'Each combat you may pay 3x gold and gain ten temporary +2 arms.',
        follower: true,
        count: 1
    },
    {
        name: 'Brawler',
        tier: 2,
        icon: '👊',
        description: 'Each combat you may feed him 3x food and gain temporary +2 arms.',
        follower: true,
        count: 1
    },
    {
        name: 'Witch',
        tier: 2,
        icon: '🧙‍♀️',
        description: 'Each combat you may roll 1xD3: (1-2) +1 arms, (2) Run away for free, (3) +2 arms.',
        follower: true,
        count: 1
    }
];

// Helper function to get encounter by name
export function getEncounterByName(name: string): Encounter | undefined {
    return ENCOUNTERS.find(encounter => encounter.name === name);
}

// Helper function to get all encounters by tier
export function getEncountersByTier(tier: TileTier): Encounter[] {
    return ENCOUNTERS.filter(encounter => encounter.tier === tier);
}

// Helper function to get all follower encounters
export function getFollowerEncounters(): Encounter[] {
    return ENCOUNTERS.filter(encounter => encounter.follower);
} 