// Lords of Doomspire Game Types

export type ResourceType = "food" | "wood" | "ore" | "gold";
export type TileTier = 1 | 2 | 3;
export type BiomeType = "plains" | "mountains" | "woodlands";
export type OceanPosition = "nw" | "ne" | "sw" | "se";
export type TileType =
  | "empty"
  | "home"
  | "resource"
  | "adventure"
  | "chapel"
  | "trader"
  | "mercenary"
  | "doomspire"
  | "oasis";

export interface Position {
  row: number;
  col: number;
}

export interface Monster {
  id: string;
  name: string;
  tier: TileTier;
  icon: string;
  might: number; // Might needed to beat it
  fame: number; // Fame gained for winning
  resources: Record<ResourceType, number>; // Resources gained for beating it
}

export interface Tile {
  position: Position;
  tier?: TileTier;
  explored?: boolean; // starts true for all tier 1 tiles, and false for all other tiles
  resources?: Record<ResourceType, number>; // only applicable for resource tiles
  isStarred?: boolean; // For victory condition. Only applicable for resource tiles
  claimedBy?: number; // Player ID who claimed this tile. Only applicable for resource tiles
  monster?: Monster; // only applicable for adventure tiles
  adventureTokens?: number; // Number of adventure tokens on the tile. Only applicable for adventure tiles
  tileType?: TileType;
  backColor?: string; // Background color set by BoardBuilder
  borderColor?: string; // Border color set by BoardBuilder
  tileGroup?: number; // Optional group identifier - when one tile in group is explored, all tiles in group are explored
}

export interface Champion {
  id: number;
  position: Position;
  playerId: number;
  treasures: string[];
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
