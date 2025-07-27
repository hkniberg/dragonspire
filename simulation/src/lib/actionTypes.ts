import { OceanPosition, Position } from './types';

export interface ChampionAction {
  diceValueUsed: number;
  championId: number;
  movementPathIncludingStartPosition?: Position[];
  tileAction?: TileAction;
}

export interface TileAction {
  claimTile?: boolean;
  useTrader?: boolean;
  useMercenary?: boolean;
  useTemple?: boolean;
  pickUpItems?: string[]; // Array of item IDs to pick up from the tile
  dropItems?: string[]; // Array of item IDs to drop on the tile
}

export interface BoatAction {
  diceValueUsed: number;
  boatId: number;
  movementPathIncludingStartPosition?: OceanPosition[]; // Ocean tiles as strings
  championIdToPickUp?: number; // Optional champion being picked up
  championDropPosition?: Position; // Where to drop off the champion
  championTileAction?: TileAction;
}

export interface HarvestAction {
  diceValuesUsed: number[];
  tilePositions: Position[]; // Tiles to harvest from
}

// Nested DiceAction structure for Claude communication (matches schema)
export interface DiceAction {
  actionType: "championAction" | "boatAction" | "harvestAction";
  championAction?: ChampionAction;
  boatAction?: BoatAction;
  harvestAction?: HarvestAction;
  reasoning?: string;
}
