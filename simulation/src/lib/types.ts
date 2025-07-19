// Lords of Doomspire Game Types

export type ResourceType = 'food' | 'wood' | 'ore' | 'gold';
export type TileTier = 1 | 2 | 3;
export type TileType = 'plains' | 'mountains' | 'woodlands' | 'water';
export type OceanPosition = 'nw' | 'ne' | 'sw' | 'se';
export type TreasureType = 'rustyShield' | 'brokenSword';

export interface Position {
    row: number;
    col: number;
}

export interface Monster {
    name: string;
    tier: TileTier;
    icon: string;
    might: number; // Might needed to beat it
    fame: number; // Fame gained for winning
    resources: Record<ResourceType, number>; // Resources gained for beating it
}

export interface Tile {
    position: Position;
    tier: TileTier;
    explored: boolean;
    resources?: Record<ResourceType, number>;
    isStarred?: boolean; // For victory condition
    claimedBy?: number; // Player ID who claimed this tile
    monster?: Monster;
    tileType?: 'home' | 'resource' | 'adventure' | 'chapel' | 'trader' | 'mercenary' | 'doomspire';
}

export interface Champion {
    id: number;
    position: Position;
    playerId: number;
    treasures: TreasureType[];
}

export interface Boat {
    id: number;
    playerId: number;
    position: OceanPosition;
}

export interface Player {
    id: number;
    name: string;
    fame: number;
    might: number;
    resources: Record<ResourceType, number>;
    maxClaims: number;
    champions: Champion[];
    boats: Boat[];
    homePosition: Position;
}

export interface MoveChampionAction {
    type: 'moveChampion';
    playerId: number;
    championId: number;
    path: Position[];
}

export interface MoveBoatAction {
    type: 'moveBoat';
    playerId: number;
    boatId: number;
    path: string[]; // Ocean tiles as strings
    championId?: number; // Optional champion being picked up
    championDropPosition?: Position; // Where to drop off the champion
}

export interface HarvestAction {
    type: 'harvest';
    playerId: number;
    resources: Record<ResourceType, number>; // Resources and amounts to harvest
}

export type GameAction = MoveChampionAction | MoveBoatAction | HarvestAction;

export interface DiceUsage {
    diceNumber: number;
    action: GameAction;
} 