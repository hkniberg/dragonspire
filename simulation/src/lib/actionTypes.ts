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
  conquerWithFame?: boolean; // Conquer tile using treachery (costs 1 fame)
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

export interface BuildAction {
  diceValueUsed: number;
  buildActionType: "blacksmith" | "market" | "recruitChampion" | "buildBoat" | "chapel" | "upgradeChapelToMonastery" | "warshipUpgrade";
}

export interface BuildingUsageDecision {
  useBlacksmith?: boolean;
  sellAtMarket?: Record<MarketResourceType, number>;
}

// Nested DiceAction structure for Claude communication (matches schema)
export interface DiceAction {
  actionType: "championAction" | "boatAction" | "harvestAction" | "buildAction";
  championAction?: ChampionAction;
  boatAction?: BoatAction;
  harvestAction?: HarvestAction;
  buildAction?: BuildAction;
  reasoning?: string;
}
