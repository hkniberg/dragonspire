import { AdventureThemeType, MarketResourceType, OceanPosition, Position } from './types';

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
  conquerWithMight?: boolean; // Conquer tile using military might (costs 1 might)
  inciteRevolt?: boolean; // Incite revolt using fame (costs 1 fame, frees up tile but doesn't claim it)
  preferredAdventureTheme?: AdventureThemeType; // Preferred theme when drawing adventure cards
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

// Build action is now just a string representing the type of build action
export type BuildAction = "blacksmith" | "market" | "recruitChampion" | "buildBoat" | "chapel" | "upgradeChapelToMonastery" | "warshipUpgrade" | "fletcher";

export interface BuildingUsageDecision {
  useBlacksmith?: boolean;
  sellAtMarket?: Record<MarketResourceType, number>;
  useFletcher?: boolean;
}

// New combined interface for harvest phase decisions
export interface BuildingDecision {
  buildingUsageDecision?: BuildingUsageDecision;
  buildAction?: BuildAction;
  reasoning?: string;
}

// Dice actions no longer include build actions
export interface DiceAction {
  actionType: "championAction" | "boatAction" | "harvestAction";
  championAction?: ChampionAction;
  boatAction?: BoatAction;
  harvestAction?: HarvestAction;
  reasoning?: string;
}
