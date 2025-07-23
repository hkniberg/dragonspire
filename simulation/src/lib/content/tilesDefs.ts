

export type Resource = 'food' | 'wood' | 'ore' | 'gold';
export type ResourceList = Resource[];
export type TileDef = 'home' | 'adventure' | 'adventure2' | 'adventure3' | 'doomspire' | 'chapel' | 'trader' | 'mercenary' | 'oasis' | 'oasis2' | ResourceList | Resource;

// L-shaped tile group.
export interface TileTrioDef {
    corner: TileDef;
    right: TileDef;
    below: TileDef;
    count?: number; // How many trios like tihs are in the box, default 1
}

export const HOME_TILE_TRIOS: TileTrioDef[] = [
    {
        corner: "home",
        right: "wood",
        below: "adventure",
    },
    {
        corner: "home",
        right: "adventure",
        below: "food",
    },
    {
        corner: "home",
        right: "ore",
        below: "adventure",
    },


    {
        corner: "home",
        right: "adventure",
        below: "food",
    },
]

export const TIER_1_TRIOS: TileTrioDef[] = [
    {
        corner: "chapel",
        right: "wood",
        below: "adventure",
    },
    {
        corner: "food",
        right: "ore",
        below: "adventure",
    },
    {
        corner: "adventure",
        right: ["food", "wood"],
        below: "adventure2",
    },
    {
        corner: "adventure",
        right: "mercenary",
        below: "food",
    },
    {
        corner: "adventure2",
        right: "ore",
        below: "wood",
    },
    {
        corner: ["food", "food"],
        right: "wood",
        below: "adventure",
    },
    {
        corner: "adventure",
        right: "food",
        below: "wood",
    },
    {
        corner: "food",
        right: "adventure2",
        below: "oasis",
    },
    {
        corner: "oasis",
        right: "gold",
        below: ["ore", "ore"],
    },
    {
        corner: "gold",
        right: "wood",
        below: "oasis",
    },
    {
        corner: "ore",
        right: "adventure",
        below: "trader",
    },
    {
        corner: "wood",
        right: "adventure",
        below: "adventure2",
    },
];

export const TIER_2_TRIOS: TileTrioDef[] = [
    {
        corner: "adventure2",
        right: ["food", "wood"],
        below: ["food", "food"],
    },
    {
        corner: "adventure2",
        right: ["ore", "ore"],
        below: ["gold", "gold"],
    },
    {
        corner: ["wood", "wood"],
        right: "oasis2",
        below: ["food", "wood"],
    },
]

export const TIER_3_TRIOS: TileTrioDef[] = [
    {
        corner: "adventure3",
        right: "adventure3",
        below: "doomspire",
    },
    {
        corner: "doomspire",
        right: "adventure3",
        below: "adventure3",
    },
    {
        corner: "adventure3",
        right: "doomspire",
        below: "adventure3",
    },
    {
        corner: "adventure3",
        right: "adventure3",
        below: "doomspire",
    },
]