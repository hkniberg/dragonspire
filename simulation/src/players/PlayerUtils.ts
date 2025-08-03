import { GameState } from "@/game/GameState";
import { CarriableItem, Champion, Decision, DecisionContext, DecisionOption, Player, Position, ResourceType, Tile } from "@/lib/types";
import { GameSettings } from "@/lib/GameSettings";

export interface Direction {
  row: number;
  col: number;
  name: string;
}

export const DIRECTIONS: Direction[] = [
  { row: -1, col: 0, name: "north" },
  { row: 1, col: 0, name: "south" },
  { row: 0, col: -1, name: "west" },
  { row: 0, col: 1, name: "east" },
];

/**
 * Check if a position is within the board bounds
 */
export function isValidBoardPosition(position: Position): boolean {
  return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

/**
 * Get detailed information about harvestable resources, taking blockading into account
 *
 * A player can harvest from:
 * - Any tile that is claimed by them and doesn't have an opposing champion on it
 * - Any tile that is claimed by an opposing player and has their champion on it (blockading)
 */
export interface HarvestableResourcesInfo {
  ownedNonBlockedTiles: Tile[];
  ownedBlockedTiles: Tile[];
  blockadedOpponentTiles: Tile[];
  totalHarvestableResources: Record<ResourceType, number>;
}

export function getHarvestableResourcesInfo(gameState: GameState, playerName: string): HarvestableResourcesInfo {
  const ownedNonBlockedTiles: Tile[] = [];
  const ownedBlockedTiles: Tile[] = [];
  const blockadedOpponentTiles: Tile[] = [];
  const totalHarvestableResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

  // Get the player's champions positions
  const player = gameState.getPlayer(playerName);
  if (!player) {
    return {
      ownedNonBlockedTiles,
      ownedBlockedTiles,
      blockadedOpponentTiles,
      totalHarvestableResources,
    };
  }

  const playerChampionPositions = new Set<string>();
  for (const champion of player.champions) {
    playerChampionPositions.add(`${champion.position.row},${champion.position.col}`);
  }

  // Check all tiles on the board
  for (const row of gameState.board.getTilesGrid()) {
    for (const tile of row) {
      if (!tile.resources) {
        continue; // Not a resource tile
      }

      const tileKey = `${tile.position.row},${tile.position.col}`;
      const hasPlayerChampion = playerChampionPositions.has(tileKey);

      // Check if any opposing champions are on this tile
      let hasOpposingChampion = false;
      for (const otherPlayer of gameState.players) {
        if (otherPlayer.name === playerName) {
          continue; // Skip the current player
        }

        for (const champion of otherPlayer.champions) {
          if (champion.position.row === tile.position.row && champion.position.col === tile.position.col) {
            hasOpposingChampion = true;
            break;
          }
        }
        if (hasOpposingChampion) {
          break;
        }
      }

      // Case 1: Tile is claimed by the player
      if (tile.claimedBy === playerName) {
        if (!hasOpposingChampion) {
          // Player owns this tile and it's not blockaded
          ownedNonBlockedTiles.push(tile);
          for (const [resourceType, amount] of Object.entries(tile.resources)) {
            totalHarvestableResources[resourceType as ResourceType] += amount as number;
          }
        } else {
          // Player owns this tile but it's blockaded
          ownedBlockedTiles.push(tile);
        }
      }

      // Case 2: Tile is claimed by an opposing player and player's champion is on it (blockading)
      if (tile.claimedBy !== undefined && tile.claimedBy !== playerName && hasPlayerChampion) {
        // Check if the tile is protected by adjacent knights or warships of the owner
        if (!gameState.isClaimProtected(tile)) {
          blockadedOpponentTiles.push(tile);
          for (const [resourceType, amount] of Object.entries(tile.resources)) {
            totalHarvestableResources[resourceType as ResourceType] += amount as number;
          }
        }
      }
    }
  }

  return {
    ownedNonBlockedTiles,
    ownedBlockedTiles,
    blockadedOpponentTiles,
    totalHarvestableResources,
  };
}

/**
 * Get the total harvestable resources for a player, taking blockading into account
 *
 * A player can harvest from:
 * - Any tile that is claimed by them and doesn't have an opposing champion on it
 * - Any tile that is claimed by an opposing player and has their champion on it (blockading)
 */
export function getHarvestableResources(gameState: GameState, playerName: string): Record<ResourceType, number> {
  return getHarvestableResourcesInfo(gameState, playerName).totalHarvestableResources;
}

/**
 * Get a list of buildings that the player can afford to use
 */
export function getUsableBuildings(player: Player): string[] {
  const usableBuildings: string[] = [];

  // Check for Blacksmith
  const hasBlacksmith = player.buildings.includes("blacksmith");
  if (hasBlacksmith && canAfford(player, GameSettings.BLACKSMITH_USAGE_COST)) {
    usableBuildings.push("blacksmith");
  }

  // Check for Market
  const hasMarket = player.buildings.includes("market");
  if (hasMarket) {
    const totalResources = player.resources.food + player.resources.wood + player.resources.ore;
    if (totalResources >= GameSettings.MARKET_EXCHANGE_RATE) {
      usableBuildings.push("market");
    }
  }

  // Check for Fletcher
  const hasFletcher = player.buildings.includes("fletcher");
  if (hasFletcher && canAfford(player, GameSettings.FLETCHER_USAGE_COST)) {
    usableBuildings.push("fletcher");
  }

  return usableBuildings;
}

/**
 * Get available item slots for a champion
 */
export function getChampionAvailableItemSlots(champion: Champion): number {
  const capacity = getChampionItemCapacity(champion);
  return Math.max(0, capacity - champion.items.length);
}

/**
 * Get the name of a CarriableItem
 */
function getItemName(item: CarriableItem): string {
  if (item.treasureCard) {
    return item.treasureCard.name;
  }
  if (item.traderItem) {
    return item.traderItem.name;
  }
  return 'Unknown Item';
}

/**
 * Result of a drop item decision
 */
export interface DropItemDecisionResult {
  /** The DecisionContext to present to the player */
  decisionContext: DecisionContext;
  /** Whether the decision includes an option to refuse the new item */
  canRefuse: boolean;
}

/**
 * Create a decision context for choosing what item to drop when inventory is full
 * 
 * @param championId - ID of the champion whose inventory is full
 * @param newItemName - Name of the new item being offered
 * @param champion - The champion whose inventory is full
 * @param newItemDescription - Optional description of what the new item does
 * @param canRefuseNewItem - Whether the player can refuse the new item (vs must drop something)
 * @param refuseActionText - Text for the refuse action (e.g., "Leave on ground", "Refuse item")
 * @returns DecisionContext and metadata about the decision
 */
export function createDropItemDecision(
  championId: number,
  newItemName: string,
  champion: Champion,
  newItemDescription?: string,
  canRefuseNewItem: boolean = true,
  refuseActionText: string = `Leave the ${newItemName} on the ground`
): DropItemDecisionResult {
  const droppableOptions: DecisionOption[] = [];

  // Add options to drop existing items (only if not stuck or unstealable)
  champion.items.forEach((item, index) => {
    if (!item.stuck) {
      const dropText = canRefuseNewItem
        ? `Drop ${getItemName(item)} and take the ${newItemName}`
        : `Drop ${getItemName(item)} for the ${newItemName}`;

      droppableOptions.push({
        id: `drop_${index}`,
        description: dropText
      });
    }
  });

  // Add refuse option if allowed
  if (canRefuseNewItem) {
    droppableOptions.push({
      id: "refuse_item",
      description: refuseActionText
    });
  }

  // Build the description
  let description = `Champion${championId}'s inventory is full!`;
  if (newItemDescription) {
    description += ` ${newItemDescription}`;
  }
  description += ` Choose what to do with the ${newItemName}:`;

  const decisionContext: DecisionContext = {
    description,
    options: droppableOptions
  };

  return {
    decisionContext,
    canRefuse: canRefuseNewItem
  };
}

/**
 * Handle the result of a drop item decision
 * 
 * @param decision - The player's decision
 * @param champion - The champion whose inventory is being modified
 * @param newItem - The new item being offered (null if just dropping)
 * @param tile - The tile where dropped items should be placed
 * @param championId - ID of the champion for logging
 * @param newItemName - Name of the new item for logging
 * @param logFn - Logging function
 * @returns true if the new item was taken, false if refused
 */
export function handleDropItemDecision(
  decision: Decision,
  champion: Champion,
  newItem: CarriableItem | null,
  tile: Tile,
  championId: number,
  newItemName: string,
  logFn: (type: string, content: string) => void
): boolean {
  if (decision.choice === "refuse_item") {
    // Player refused the new item
    if (newItem) {
      // Place the refused item on the tile
      if (!tile.items) {
        tile.items = [];
      }
      tile.items.push(newItem);
    }
    logFn("event", `Champion${championId} left the ${newItemName} on the ground.`);
    return false;
  } else {
    // Handle dropping an item based on the decision choice
    const itemIndex = parseInt(decision.choice.replace('drop_', ''), 10);
    if (itemIndex >= 0 && itemIndex < champion.items.length) {
      const itemToDrop = champion.items[itemIndex];

      // Remove the item from champion's inventory
      champion.items.splice(itemIndex, 1);

      // Add dropped item to tile
      if (!tile.items) {
        tile.items = [];
      }
      tile.items.push(itemToDrop);

      // Add new item to champion's inventory
      if (newItem) {
        champion.items.push(newItem);
      }

      const droppedItemName = getItemName(itemToDrop);
      logFn("event", `Champion${championId} dropped ${droppedItemName} and took the ${newItemName}.`);
      return true;
    } else {
      logFn("event", `Unknown drop decision: ${decision.choice}`);
      return false;
    }
  }
}

/**
 * Check if a player has a specific trader item among any of their champions
 */
export function hasTraderItem(player: Player, itemId: string): boolean {
  return player.champions.some(champion =>
    champion.items.some(item => item.traderItem?.id === itemId)
  );
}

/**
 * Check if a specific champion has a trader item
 */
export function championHasTraderItem(champion: Champion, itemId: string): boolean {
  return champion.items.some(item => item.traderItem?.id === itemId);
}

/**
 * Calculate the item carrying capacity for a champion
 * Base capacity is 2, backpack adds 2 more (total 4 including the backpack itself)
 */
export function getChampionItemCapacity(champion: Champion): number {
  const baseCapacity = 2;
  const hasBackpack = championHasTraderItem(champion, "backpack");
  return hasBackpack ? baseCapacity + 2 : baseCapacity;
}

/**
 * Check if a champion can carry more items
 */
export function canChampionCarryMoreItems(champion: Champion): boolean {
  const capacity = getChampionItemCapacity(champion);
  return champion.items.length < capacity;
}

// Removed canAffordBuilding - use canAfford(player, GameSettings.BUILDING_COST) instead

/**
 * Deduct resources from a player's inventory
 */
export function deductResources(player: Player, resourceType: ResourceType, amount: number): boolean {
  if (player.resources[resourceType] < amount) {
    return false;
  }
  player.resources[resourceType] -= amount;
  return true;
}

/**
 * Deduct gold from a player's inventory
 */
export function deductGold(player: Player, amount: number): boolean {
  return deductResources(player, "gold", amount);
}

/**
 * Deduct ore from a player's inventory
 */
export function deductOre(player: Player, amount: number): boolean {
  return deductResources(player, "ore", amount);
}

/**
 * Deduct food from a player's inventory
 */
export function deductFood(player: Player, amount: number): boolean {
  return deductResources(player, "food", amount);
}

/**
 * Deduct wood from a player's inventory
 */
export function deductWood(player: Player, amount: number): boolean {
  return deductResources(player, "wood", amount);
}

/**
 * Check if a player can afford a given cost
 */
export function canAfford(player: Player, cost: Record<ResourceType, number>): boolean {
  return player.resources.food >= cost.food &&
    player.resources.wood >= cost.wood &&
    player.resources.ore >= cost.ore &&
    player.resources.gold >= cost.gold;
}

/**
 * Deduct resources from a player based on a cost object
 */
export function deductCost(player: Player, cost: Record<ResourceType, number>): void {
  player.resources.food -= cost.food;
  player.resources.wood -= cost.wood;
  player.resources.ore -= cost.ore;
  player.resources.gold -= cost.gold;
}
