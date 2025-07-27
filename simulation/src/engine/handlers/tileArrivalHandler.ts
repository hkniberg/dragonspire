import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { CarriableItem, Player, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import {
  resolveChampionVsChampionCombat,
  resolveChampionVsDragonEncounter,
  resolveChampionVsMonsterCombat
} from "./combatHandler";

export interface ExplorationResult {
  wasExplored: boolean;
  fameAwarded: number;
}

export interface ChampionCombatResult {
  combatOccurred: boolean;
  attackerWon?: boolean;
  defendingChampionDefeated?: {
    playerName: string;
    championId: number;
    healingCost: "gold" | "fame";
  };
  fameAwarded?: number;
  combatDetails?: string;
}

export interface MonsterCombatResult {
  combatOccurred: boolean;
  championWon?: boolean;
  championDefeated?: {
    healingCost: "gold" | "fame";
  };
  monsterDefeated?: {
    fameAwarded: number;
    resourcesAwarded: {
      food: number;
      wood: number;
      ore: number;
      gold: number;
    };
  };
  combatDetails?: string;
}

export interface DoomspireResult {
  entered: boolean;
  alternativeVictory?: {
    type: "Fame Victory" | "Gold Victory" | "Economic Victory";
    playerName: string;
  };
  dragonCombat?: {
    championWon: boolean;
    championDefeated?: {
      healingCost: "gold" | "fame";
    };
    combatVictory?: {
      playerName: string;
    };
    combatDetails: string;
  };
}

export interface TileClaimingResult {
  claimRequested: boolean;
  claimSuccessful?: boolean;
  reason?: string;
}

export interface SpecialTileResult {
  interactionOccurred: boolean;
  adventureCardDrawn?: boolean;
  tokensRemaining?: number;
}

/**
 * Handle tile exploration when a champion arrives at an unexplored tile
 */
export function handleExploration(
  gameState: GameState,
  tile: Tile,
  player: Player,
  logFn: (type: string, content: string) => void
): ExplorationResult {
  if (tile.explored) {
    return { wasExplored: true, fameAwarded: 0 };
  }

  // Mark tile as explored
  tile.explored = true;

  // Mark tile group as explored if it has one
  if (tile.tileGroup) {
    gameState.board.setTileGroupToExplored(tile.tileGroup);
  }

  // Award fame for exploration
  const fameAwarded = GameSettings.FAME_AWARD_FOR_EXPLORATION;
  player.fame += fameAwarded;

  logFn("exploration", `Explored new territory and got ${fameAwarded} fame`);

  return { wasExplored: false, fameAwarded };
}

/**
 * Handle combat with opposing champions on the tile
 */
export function handleChampionCombat(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): ChampionCombatResult {
  const combatResult = resolveChampionVsChampionCombat(gameState, tile, player, championId, logFn);

  if (!combatResult.combatOccurred) {
    return { combatOccurred: false };
  }

  if (combatResult.victory) {
    return {
      combatOccurred: true,
      attackerWon: true,
      defendingChampionDefeated: combatResult.victory.opponentEffects ? {
        playerName: combatResult.victory.opponentEffects.playerName,
        championId: championId, // Note: This should ideally be the defending champion's ID
        healingCost: combatResult.victory.opponentEffects.healingCost
      } : undefined,
      fameAwarded: combatResult.victory.fameAwarded,
      combatDetails: combatResult.combatDetails
    };
  } else {
    return {
      combatOccurred: true,
      attackerWon: false,
      combatDetails: combatResult.combatDetails
    };
  }
}

/**
 * Handle combat with monsters on the tile
 */
export function handleMonsterCombat(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): MonsterCombatResult {
  const combatResult = resolveChampionVsMonsterCombat(gameState, tile, player, championId, logFn);

  if (!combatResult.combatOccurred) {
    return { combatOccurred: false };
  }

  if (combatResult.victory) {
    return {
      combatOccurred: true,
      championWon: true,
      monsterDefeated: {
        fameAwarded: combatResult.victory.fameAwarded || 0,
        resourcesAwarded: combatResult.victory.resourcesAwarded || { food: 0, wood: 0, ore: 0, gold: 0 }
      },
      combatDetails: combatResult.combatDetails
    };
  } else {
    return {
      combatOccurred: true,
      championWon: false,
      championDefeated: {
        healingCost: combatResult.defeat?.healingCost || "fame"
      },
      combatDetails: combatResult.combatDetails
    };
  }
}

/**
 * Handle arrival at the Doomspire tile (dragon combat and victory conditions)
 */
export function handleDoomspireTile(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): DoomspireResult {
  const dragonEncounter = resolveChampionVsDragonEncounter(gameState, tile, player, championId, logFn);

  if (!dragonEncounter.encounterOccurred) {
    return { entered: false };
  }

  if (dragonEncounter.alternativeVictory) {
    return {
      entered: true,
      alternativeVictory: dragonEncounter.alternativeVictory
    };
  }

  if (dragonEncounter.combatResult) {
    const combatResult = dragonEncounter.combatResult;

    if (combatResult.victory) {
      return {
        entered: true,
        dragonCombat: {
          championWon: true,
          combatVictory: {
            playerName: player.name
          },
          combatDetails: combatResult.combatDetails!
        }
      };
    } else if (combatResult.defeat) {
      return {
        entered: true,
        dragonCombat: {
          championWon: false,
          championDefeated: {
            healingCost: combatResult.defeat.healingCost
          },
          combatDetails: combatResult.combatDetails!
        }
      };
    }
  }

  // Should not reach here
  return { entered: false };
}

/**
 * Handle claiming of resource tiles
 */
export function handleTileClaiming(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  claimTile: boolean,
  logFn: (type: string, content: string) => void
): TileClaimingResult {
  if (!claimTile) {
    return { claimRequested: false };
  }

  if (tile.tileType !== "resource") {
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Only resource tiles can be claimed"
    };
  }

  if (tile.claimedBy !== undefined) {
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Tile is already claimed"
    };
  }

  const currentClaimedCount = gameState.board.findTiles((tile) => tile.claimedBy === player.name).length;

  if (currentClaimedCount >= player.maxClaims) {
    logFn("event", `Champion${championId} could not claim resource tile (${tile.position.row}, ${tile.position.col}) (max claims reached)`);
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Max claims reached"
    };
  }

  // Successful claim
  tile.claimedBy = player.name;
  logFn("event", `Champion${championId} claimed resource tile (${tile.position.row}, ${tile.position.col}), which can provide ${formatResources(tile.resources)}`);

  return {
    claimRequested: true,
    claimSuccessful: true
  };
}

/**
 * Handle special tiles (adventure/oasis) that provide cards
 */
export function handleSpecialTiles(
  tile: Tile,
  championId: number,
  logFn: (type: string, content: string) => void
): SpecialTileResult {
  if ((tile.tileType !== "adventure" && tile.tileType !== "oasis") ||
    !tile.adventureTokens || tile.adventureTokens <= 0) {
    return { interactionOccurred: false };
  }

  // Remove one adventure token
  tile.adventureTokens = Math.max(0, tile.adventureTokens - 1);

  return {
    interactionOccurred: true,
    adventureCardDrawn: true,
    tokensRemaining: tile.adventureTokens
  };
}

export interface ItemManagementResult {
  itemsPickedUp: string[];
  itemsDropped: string[];
  failedPickups: Array<{
    itemId: string;
    reason: string;
  }>;
  failedDrops: Array<{
    itemId: string;
    reason: string;
  }>;
}

export interface MercenaryResult {
  actionRequested: boolean;
  actionSuccessful?: boolean;
  reason?: string;
  mightGained?: number;
  goldSpent?: number;
}

export interface TempleResult {
  actionRequested: boolean;
  actionSuccessful?: boolean;
  reason?: string;
  mightGained?: number;
  fameSacrificed?: number;
}

/**
 * Handle item pickup and drop actions
 */
export function handleItemManagement(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  pickUpItems: string[] = [],
  dropItems: string[] = [],
  logFn: (type: string, content: string) => void
): ItemManagementResult {
  const result: ItemManagementResult = {
    itemsPickedUp: [],
    itemsDropped: [],
    failedPickups: [],
    failedDrops: []
  };

  const champion = gameState.getChampion(player.name, championId);
  if (!champion) {
    return result;
  }

  // Initialize tile items array if it doesn't exist
  if (!tile.items) {
    tile.items = [];
  }

  // Handle item drops first (to potentially make space for pickups)
  for (const itemId of dropItems) {
    const itemToDropObj = findCarriableItemById(champion.items, itemId);
    if (!itemToDropObj) {
      result.failedDrops.push({
        itemId,
        reason: "Champion doesn't have this item"
      });
      continue;
    }

    // Remove from champion inventory and add to tile
    const itemIndex = champion.items.indexOf(itemToDropObj);
    champion.items.splice(itemIndex, 1);
    tile.items.push(itemToDropObj);
    result.itemsDropped.push(itemId);

    const itemName = getCarriableItemName(itemToDropObj);
    logFn("event", `Champion ${championId} dropped ${itemName} on tile (${tile.position.row}, ${tile.position.col})`);
  }

  // Handle item pickups
  for (const itemId of pickUpItems) {
    const itemToPickUpObj = findCarriableItemById(tile.items, itemId);
    if (!itemToPickUpObj) {
      result.failedPickups.push({
        itemId,
        reason: "Item not available on this tile"
      });
      continue;
    }

    // Check inventory space (max 2 items)
    if (champion.items.length >= 2) {
      result.failedPickups.push({
        itemId,
        reason: "Champion inventory is full (max 2 items)"
      });
      continue;
    }

    // Remove from tile and add to champion inventory
    const itemIndex = tile.items.indexOf(itemToPickUpObj);
    tile.items.splice(itemIndex, 1);
    champion.items.push(itemToPickUpObj);
    result.itemsPickedUp.push(itemId);

    const itemName = getCarriableItemName(itemToPickUpObj);
    logFn("event", `Champion ${championId} picked up ${itemName} from tile (${tile.position.row}, ${tile.position.col})`);
  }

  return result;
}

/**
 * Handle mercenary camp action (buy might for gold)
 */
export function handleMercenaryAction(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  useMercenary: boolean,
  logFn: (type: string, content: string) => void
): MercenaryResult {
  if (!useMercenary) {
    return { actionRequested: false };
  }

  if (tile.tileType !== "mercenary") {
    return {
      actionRequested: true,
      actionSuccessful: false,
      reason: "Can only use mercenary action on mercenary tiles"
    };
  }

  if (player.resources.gold < 3) {
    return {
      actionRequested: true,
      actionSuccessful: false,
      reason: "Not enough gold (need 3 gold)"
    };
  }

  // Successful mercenary purchase
  player.resources.gold -= 3;
  player.might += 1;

  logFn("event", `Champion ${championId} hired mercenaries for 3 gold, gaining 1 might`);

  return {
    actionRequested: true,
    actionSuccessful: true,
    mightGained: 1,
    goldSpent: 3
  };
}

/**
 * Handle temple action (sacrifice fame for might)
 */
export function handleTempleAction(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  useTemple: boolean,
  logFn: (type: string, content: string) => void
): TempleResult {
  if (!useTemple) {
    return { actionRequested: false };
  }

  if (tile.tileType !== "temple") {
    return {
      actionRequested: true,
      actionSuccessful: false,
      reason: "Can only use temple action on temple tiles"
    };
  }

  if (player.fame < 3) {
    return {
      actionRequested: true,
      actionSuccessful: false,
      reason: "Not enough fame (need 3 fame)"
    };
  }

  // Successful temple sacrifice
  player.fame -= 3;
  player.might += 1;

  logFn("event", `Champion ${championId} sacrificed 3 fame at the temple, gaining 1 might`);

  return {
    actionRequested: true,
    actionSuccessful: true,
    mightGained: 1,
    fameSacrificed: 3
  };
}

// Helper function to find a CarriableItem by ID (either treasure or trader item)
function findCarriableItemById(items: CarriableItem[], itemId: string): CarriableItem | undefined {
  return items.find(item =>
    item.treasureCard?.id === itemId || item.traderItem?.id === itemId
  );
}

// Helper function to get the ID of a CarriableItem
function getCarriableItemId(item: CarriableItem): string {
  return item.treasureCard?.id || item.traderItem?.id || 'unknown';
}

// Helper function to get the name of a CarriableItem
function getCarriableItemName(item: CarriableItem): string {
  return item.treasureCard?.name || item.traderItem?.name || 'Unknown Item';
} 