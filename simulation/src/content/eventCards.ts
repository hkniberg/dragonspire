import { TileTier } from '../lib/types';

export interface EventCard {
    id: string;
    name: string;
    tier: TileTier;
    description: string;
    count: number; // How many cards of this event to include in deck
}

// Helper function to get event by ID
export function getEventCardById(id: string): EventCard | undefined {
    return EVENT_CARDS.find(event => event.id === id);
}


// All event cards in the game
export const EVENT_CARDS: EventCard[] = [
    // Tier 1 Event Cards
    {
        id: 'hungry-pests',
        name: 'Hungry pests',
        tier: 1,
        description: 'Choose 1 player who loses 1 food to a mischief of starved rats.',
        count: 2
    },
    {
        id: 'market-day',
        name: 'Market day',
        tier: 1,
        description: 'Open trade for all players this turn. Move 1 champion to the trader (yours).',
        count: 2
    },
    {
        id: 'thug-ambush',
        name: 'Thug Ambush',
        tier: 1,
        description: 'Roll 1+D3: (1) They steal 1 gold, (2) Fight bandit arms 3, (3) You scare them off +1 fame.',
        count: 2
    },
    {
        id: 'landslide',
        name: 'Landslide',
        tier: 1,
        description: 'Roll 1+D3: (1) Run back to start, (2) Move to nearest selected tile, (3) Miracle find +2 ore.',
        count: 2
    },
    {
        id: 'sudden-storm',
        name: 'Sudden storm',
        tier: 1,
        description: 'All boats move into an adjacent sea. All oases gain +1 mystery card.',
        count: 2
    },

    // Tier 2 Event Cards
    {
        id: 'hornet-swarm',
        name: 'Hornet swarm',
        tier: 2,
        description: 'Roll 3+D3 and move the total amount in steps. Any champion you pass by must repeat this.',
        count: 1
    },
    {
        id: 'druid-rampage',
        name: 'Druid rampage',
        tier: 2,
        description: 'A wild-eyed Druid hands you a runed dagger. +1 arms. Once you leave, he turns into a Bear A:5.',
        count: 1
    },
    {
        id: 'you-got-riches',
        name: 'You got riches!',
        tier: 2,
        description: 'A shouting genie is granting everyone wishes. All players collect 1x food, ore, wood, gold. All oasis also gain +1 mystery card.',
        count: 1
    },

    // Tier 3 Event Cards
    {
        id: 'curse-of-the-earth',
        name: 'Curse of the earth',
        tier: 3,
        description: 'All players lose -2 arms, as their weapons rust and crumble.',
        count: 1
    },
    {
        id: 'thieving-crows',
        name: 'Thieving crows',
        tier: 3,
        description: 'All players lose all of whichever stockpiled resource they have the most of.',
        count: 1
    },
    {
        id: 'dragon-raid',
        name: 'Dragon raid',
        tier: 3,
        description: 'All players must remove 2x Claims from tiles in the outer region.',
        count: 1
    }
];


