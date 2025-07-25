import { Position, ResourceType } from './types';

// Individual action interfaces (without type field) - used by execute functions
export interface MoveChampionAction {
  championId: number;
  path: Position[];
  claimTile?: boolean; // If true, claims the destination tile (last position in path)
}

export interface MoveBoatAction {
  boatId: number;
  path: string[]; // Ocean tiles as strings
  championId?: number; // Optional champion being picked up
  championDropPosition?: Position; // Where to drop off the champion
}

export interface HarvestAction {
  resources: Record<ResourceType, number>; // Resources and amounts to harvest
}

// Flat action types with type field - used by game engine
export interface GameMoveChampionAction {
  type: "moveChampion";
  championId: number;
  path: Position[];
  claimTile?: boolean;
}

export interface GameMoveBoatAction {
  type: "moveBoat";
  boatId: number;
  path: string[];
  championId?: number;
  championDropPosition?: Position;
}

export interface GameHarvestAction {
  type: "harvest";
  resources: Record<ResourceType, number>;
}

export type GameAction = GameMoveChampionAction | GameMoveBoatAction | GameHarvestAction;

// Nested DiceAction structure for Claude communication (matches schema)
export interface DiceAction {
  type: "moveChampion" | "moveBoat" | "harvest";
  moveChampion?: MoveChampionAction;
  moveBoat?: MoveBoatAction;
  harvest?: HarvestAction;
  reasoning: string;
}

export interface DiceUsage {
  diceNumber: number;
  action: GameAction;
} 