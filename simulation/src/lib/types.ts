// Lords of Doomspire Game Types

export type ResourceType = 'food' | 'wood' | 'ore' | 'gold';
export type TileType = 'plains' | 'mountains' | 'woodlands' | 'water' | 'special';
export type TileTier = 1 | 2 | 3;

export interface Position {
    row: number;
    col: number;
}

export interface Tile {
    position: Position;
    type: TileType;
    tier: TileTier;
    explored: boolean;
    resourceType?: ResourceType;
    resourceAmount?: number;
    isStarred?: boolean; // For victory condition
    claimedBy?: number; // Player ID who claimed this tile
    hasMonster?: boolean;
    monsterStrength?: number;
    specialLocation?: 'chapel' | 'trader' | 'mercenary' | 'doomspire';
}

export interface Champion {
    id: number;
    position: Position;
    playerId: number;
}

export interface Player {
    id: number;
    name: string;
    fame: number;
    might: number;
    resources: Record<ResourceType, number>;
    flagsPlaced: number;
    maxFlags: number;
    champions: Champion[];
    boatPosition: number; // Water zone 0-3 (NW, NE, SW, SE)
}

export interface GameAction {
    type: 'move_and_act' | 'harvest' | 'build' | 'boat_travel';
    playerId: number;
    dieValue: number;
    championId?: number;
    targetPosition?: Position;
    resourcesCollected?: Record<ResourceType, number>;
    buildingType?: string;
} 