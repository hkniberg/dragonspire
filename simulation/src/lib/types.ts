// Lords of Doomspire Game Types

export type ResourceType = 'food' | 'wood' | 'ore' | 'gold';
export type TileTier = 1 | 2 | 3;
export type BiomeType = 'plains' | 'mountains' | 'woodlands';
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
    explored: boolean; // starts true for all tier 1 tiles, and false for all other tiles
    resources?: Record<ResourceType, number>; // only applicable for resource tiles
    isStarred?: boolean; // For victory condition. Only applicable for resource tiles
    claimedBy?: number; // Player ID who claimed this tile. Only applicable for resource tiles
    monster?: Monster; // only applicable for adventure tiles
    adventureTokens?: number; // Number of adventure tokens on the tile. Only applicable for adventure tiles
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
    extraInstructions?: string; // Optional extra instructions for AI players
}

export type DiceAction = MoveChampionAction | MoveBoatAction | HarvestAction;

export interface MoveChampionAction {
    type: 'moveChampion';
    playerId: number;
    championId: number;
    path: Position[];
    claimTile?: boolean; // If true, claims the destination tile (last position in path)
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

// Utility functions for game logic
export function isHomeTile(tile: Tile): boolean {
    return tile.tileType === 'home';
}

export function isHomeTilePosition(position: Position): boolean {
    // Home tiles are at the four corners of the 8x8 board
    return (position.row === 0 && position.col === 0) ||
        (position.row === 0 && position.col === 7) ||
        (position.row === 7 && position.col === 0) ||
        (position.row === 7 && position.col === 7);
} 