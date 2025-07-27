// Lords of Doomspire Game Types

import type { TraderItem } from "../content/traderItems";
import type { TreasureCard } from "../content/treasureCards";

export type ResourceType = "food" | "wood" | "ore" | "gold";
export type TileTier = 1 | 2 | 3;
export type BiomeType = "plains" | "mountains" | "woodlands";
export type OceanPosition = "nw" | "ne" | "sw" | "se";
export type TileType =
  | "empty"
  | "home"
  | "resource"
  | "adventure"
  | "temple"
  | "trader"
  | "mercenary"
  | "doomspire"
  | "oasis"
  | "wolfDen"
  | "bearCave";

export const NON_COMBAT_TILES: TileType[] = ["home", "temple", "trader", "mercenary"];

export interface Position {
  row: number;
  col: number;
}

export interface CarriableItem {
  treasureCard?: TreasureCard;
  traderItem?: TraderItem;
}

export interface Monster {
  id: string;
  name: string;
  tier: TileTier;
  icon: string;
  might: number; // Might needed to beat it
  fame: number; // Fame gained for winning
  resources: Record<ResourceType, number>; // Resources gained for beating it
  isBeast?: boolean; // Whether this monster is classified as a beast (default false)
}

export interface Tile {
  position: Position;
  tier?: TileTier;
  explored?: boolean; // starts true for all tier 1 tiles, and false for all other tiles
  resources?: Record<ResourceType, number>; // Only applicable for resource tiles
  isStarred?: boolean; // Only applicable for resource tiles
  claimedBy?: string; // Player name who claimed this tile. Applicable for resource tiles and home tiles
  monster?: Monster; // only applicable for adventure tiles
  adventureTokens?: number; // Number of adventure tokens on the tile. Only applicable for adventure tiles
  tileType?: TileType;
  backColor?: string; // Background color set by BoardBuilder
  borderColor?: string; // Border color set by BoardBuilder
  tileGroup?: number; // Optional group identifier - when one tile in group is explored, all tiles in group are explored
  items?: CarriableItem[]; // Items present on this tile
}

export interface Champion {
  id: number;
  position: Position;
  playerName: string;
  items: CarriableItem[]; // Items held by the champion
}

export interface Boat {
  id: number;
  playerName: string;
  position: OceanPosition;
}

export interface Player {
  name: string;
  color: string; // Player's assigned color (hex code)
  fame: number;
  might: number;
  resources: Record<ResourceType, number>;
  maxClaims: number;
  champions: Champion[];
  boats: Boat[];
  homePosition: Position;
  extraInstructions?: string; // Optional extra instructions for AI players
}


export type PlayerType = "random" | "claude" | "human";

/**
 * Turn context provided to players for dice decisions
 */
export interface TurnContext {
  turnNumber: number;
  diceRolled: number[];
  remainingDiceValues: number[];
}

/**
 * Context for runtime decisions that arise during action resolution
 */
export interface DecisionContext {
  type: string; // e.g., 'fight_or_flee', 'choose_card', 'choose_target'
  description: string; // Human readable description of the situation
  options: any[]; // Available choices (type depends on decision type)
}

/**
 * Generic decision made by a player
 */
export interface Decision {
  choice: any; // The chosen option from DecisionContext.options
  reasoning?: string; // Optional reasoning for debugging
}

/**
 * Champion loot decision types
 */
export interface ChampionLootOption {
  type: "resource" | "item";
  resourceType?: ResourceType; // Only set if type is "resource"
  itemIndex?: number; // Index in the defeated champion's items array, only set if type is "item"
  displayName: string; // Human readable name for the option
}

export interface ChampionLootContext {
  type: "champion_loot";
  description: string;
  defeatedPlayerName: string;
  defeatedChampionId: number;
  winningChampionId: number;
  options: ChampionLootOption[];
}

export type GameLogEntryType = "dice" | "movement" | "boat" | "exploration" | "combat" | "harvest" | "assessment" | "event" | "system" | "victory" | "thinking";

/**
 * Tagged log entry in the sequential game log
 */
export interface GameLogEntry {
  round: number;
  playerName: string;
  type: GameLogEntryType;
  content: string; // High-level description of what happened
}
