import { TileTier } from '../lib/types';

export interface Event {
    name: string;
    tier: TileTier;
    icon: string;
    description: string;
    count: number; // How many cards of this event to include in deck
}

// All event cards in the game
export const EVENTS: Event[] = [
    // Tier 1 Event Cards
    {
        name: 'Hungry pests',
        tier: 1,
        icon: '🐀',
        description: 'Choose 1 player who loses 1 food to a mischief of starved rats.',
        count: 2
    },
    {
        name: 'Market day',
        tier: 1,
        icon: '🏪',
        description: 'Open trade for all players this turn. Move 1 champion to the trader (yours).',
        count: 2
    },
    {
        name: 'Thug Ambush',
        tier: 1,
        icon: '🗡️',
        description: 'Roll 1+D3: (1) They steal 1 gold, (2) Fight bandit arms 3, (3) You scare them off +1 fame.',
        count: 2
    },
    {
        name: 'Landslide',
        tier: 1,
        icon: '🏔️',
        description: 'Roll 1+D3: (1) Run back to start, (2) Move to nearest selected tile, (3) Miracle find +2 ore.',
        count: 2
    },
    {
        name: 'Sudden storm',
        tier: 1,
        icon: '⛈️',
        description: 'All boats move into an adjacent sea. All oases gain +1 mystery card.',
        count: 2
    },

    // Tier 2 Event Cards
    {
        name: 'Hornet swarm',
        tier: 2,
        icon: '🐝',
        description: 'Roll 3+D3 and move the total amount in steps. Any champion you pass by must repeat this.',
        count: 1
    },
    {
        name: 'Druid rampage',
        tier: 2,
        icon: '🧙‍♂️',
        description: 'A wild-eyed Druid hands you a runed dagger. +1 arms. Once you leave, he turns into a Bear A:5.',
        count: 1
    },
    {
        name: 'You got riches!',
        tier: 2,
        icon: '🧞‍♂️',
        description: 'A shouting genie is granting everyone wishes. All players collect 1x food, ore, wood, gold. All oasis also gain +1 mystery card.',
        count: 1
    },

    // Tier 3 Event Cards
    {
        name: 'Curse of the earth',
        tier: 3,
        icon: '🪦',
        description: 'All players lose -2 arms, as their weapons rust and crumble.',
        count: 1
    },
    {
        name: 'Thieving crows',
        tier: 3,
        icon: '🐦‍⬛',
        description: 'All players lose all of whichever stockpiled resource they have the most of.',
        count: 1
    },
    {
        name: 'Dragon raid',
        tier: 3,
        icon: '🐉',
        description: 'All players must remove 2x Claims from tiles in the outer region.',
        count: 1
    }
];

// Helper function to get event by name
export function getEventByName(name: string): Event | undefined {
    return EVENTS.find(event => event.name === name);
}

// Helper function to get all events by tier
export function getEventsByTier(tier: TileTier): Event[] {
    return EVENTS.filter(event => event.tier === tier);
} 