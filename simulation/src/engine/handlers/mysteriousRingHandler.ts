import { GameState } from "@/game/GameState";
import { CarriableItem, Decision, DecisionContext, Player, Tile, TileTier } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Create a stuck ring item (outcome 1 of mysterious ring)
 */
function createStuckRing(): CarriableItem {
  return {
    treasureCard: {
      id: "stuck-ring",
      name: "Stuck ring",
      tier: 1 as TileTier,
      description: "The ring does nothing and is stuck on your knight",
      count: 1,
      carriable: true
    },
    stuck: true
  };
}

/**
 * Create a dragonsbane ring item (outcome 3 of mysterious ring)
 */
function createDragonsbaneRing(): CarriableItem {
  return {
    treasureCard: {
      id: "dragonsbane-ring",
      name: "Mysterious Ring (Dragon Slayer)",
      tier: 1 as TileTier,
      description: "+3 might against dragons",
      count: 1,
      carriable: true
    }
  };
}

// Helper function to get the name of a CarriableItem
function getItemName(item: CarriableItem): string {
  if (item.treasureCard) {
    return item.treasureCard.name;
  }
  if (item.traderItem) {
    return item.traderItem.name;
  }
  return 'Unknown Item';
}

export interface MysteriousRingResult {
  cardProcessed: boolean;
  cardId?: string;
  treasureName?: string;
  effectApplied?: string;
  errorMessage?: string;
}

/**
 * Handle the mysterious-ring treasure card with all its complex random outcomes
 */
export async function handleMysteriousRing(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    const errorMessage = `Champion${championId} not found for player ${player.name}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  // Roll 1d3 to determine the ring's effect
  const roll = rollD3();
  logFn("event", `Champion${championId} found a Mysterious Ring! Rolling 1d3... rolled ${roll}!`);

  switch (roll) {
    case 1:
      // The ring does nothing and is stuck on your knight
      return await handleStuckRingOutcome(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);

    case 2:
      // Swap location with any knight, then the ring breaks
      return await handleRingSwap(gameState, player, playerAgent, championId, champion, logFn, thinkingLogger);

    case 3:
      // +3 might against dragons (permanent effect)
      return await handleDragonsbaneRingOutcome(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);

    default:
      const errorMessage = `Invalid roll result for mysterious ring: ${roll}`;
      logFn("event", errorMessage);
      return {
        cardProcessed: false,
        errorMessage
      };
  }
}

/**
 * Handle outcome 1: Ring gets stuck and does nothing
 */
async function handleStuckRingOutcome(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  if (champion.items.length < 2) {
    // Add the ring directly (marked as "stuck")
    const stuckRing = createStuckRing();
    champion.items.push(stuckRing);
    logFn("event", `The ring does nothing and is now stuck on Champion${championId}!`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Ring is stuck (does nothing)"
    };
  } else {
    // Need to ask what to drop for the stuck ring
    return await handleInventoryFullForStuckRing(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);
  }
}

/**
 * Handle outcome 2: Swap location with any knight, then ring breaks
 */
async function handleRingSwap(
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  // Get all champions on the board (excluding the current champion)
  const allChampions: Array<{ playerName: string; championId: number; position: { row: number; col: number } }> = [];

  for (const gamePlayer of gameState.players) {
    for (const gameChampion of gamePlayer.champions) {
      // Skip the current champion and champions at home
      if (gamePlayer.name === player.name && gameChampion.id === championId) continue;
      if (gameChampion.position.row === gamePlayer.homePosition.row && gameChampion.position.col === gamePlayer.homePosition.col) continue;

      allChampions.push({
        playerName: gamePlayer.name,
        championId: gameChampion.id,
        position: gameChampion.position
      });
    }
  }

  if (allChampions.length === 0) {
    logFn("event", `No other champions on the board to swap with! The ring breaks uselessly.`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Ring broke (no champions to swap with)"
    };
  }

  // Present choice of champions to swap with
  const decisionContext: DecisionContext = {
    type: "mysterious_ring_swap",
    description: `Champion${championId} can swap locations with any champion! Choose who to swap with:`,
    options: allChampions.map((target, index) => ({
      id: `swap_${index}`,
      description: `Swap with ${target.playerName}'s Champion${target.championId} at (${target.position.row}, ${target.position.col})`,
      targetChampion: target
    }))
  };

  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);
  const targetChampion = decision.choice.targetChampion;

  if (!targetChampion) {
    const errorMessage = `Invalid swap target selected`;
    return { cardProcessed: false, errorMessage };
  }

  // Perform the swap
  const currentPosition = { ...champion.position };
  const targetGamePlayer = gameState.getPlayer(targetChampion.playerName);
  const targetGameChampion = targetGamePlayer?.champions.find(c => c.id === targetChampion.championId);

  if (!targetGameChampion) {
    const errorMessage = `Target champion not found: ${targetChampion.playerName} Champion${targetChampion.championId}`;
    return { cardProcessed: false, errorMessage };
  }

  // Swap positions
  champion.position = { ...targetGameChampion.position };
  targetGameChampion.position = currentPosition;

  logFn("event", `Champion${championId} swapped positions with ${targetChampion.playerName}'s Champion${targetChampion.championId}! The ring breaks after use.`);

  return {
    cardProcessed: true,
    cardId: "mysterious-ring",
    treasureName: "Mysterious Ring",
    effectApplied: `Swapped with ${targetChampion.playerName}'s Champion${targetChampion.championId}`
  };
}

/**
 * Handle outcome 3: +3 might against dragons
 */
async function handleDragonsbaneRingOutcome(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  if (champion.items.length < 2) {
    // Add the ring with dragon bonus
    const dragonRing = createDragonsbaneRing();
    champion.items.push(dragonRing);
    logFn("event", `The ring glows with power! Champion${championId} gains +3 might against dragons!`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Gained +3 might against dragons"
    };
  } else {
    // Need to ask what to drop for the dragon ring
    return await handleInventoryFullForDragonRing(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);
  }
}

/**
 * Handle inventory full case for stuck ring (outcome 1)
 */
async function handleInventoryFullForStuckRing(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  // Check if both items are stuck - if so, we can't make space for the stuck ring
  if (champion.items[0].stuck && champion.items[1].stuck) {
    logFn("event", `Champion${championId} found a Mysterious Ring that would get stuck, but their inventory is full of other stuck items! The ring disappears in frustration.`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Ring disappeared (no space for stuck items)"
    };
  }

  const droppableOptions: any[] = [];

  // Only include items that aren't stuck
  if (!champion.items[0].stuck) {
    droppableOptions.push({
      id: "drop_first",
      description: `Drop ${getItemName(champion.items[0])} for the stuck ring`,
      itemToDrop: champion.items[0]
    });
  }

  if (!champion.items[1].stuck) {
    droppableOptions.push({
      id: "drop_second",
      description: `Drop ${getItemName(champion.items[1])} for the stuck ring`,
      itemToDrop: champion.items[1]
    });
  }

  const decisionContext: DecisionContext = {
    type: "choose_item_to_drop",
    description: `Champion${championId}'s inventory is full! The Mysterious Ring does nothing but gets stuck anyway. Choose what to drop:`,
    options: droppableOptions
  };

  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);
  const itemToDrop = decision.choice.itemToDrop;

  // Remove the item from champion's inventory
  const itemIndex = champion.items.indexOf(itemToDrop);
  if (itemIndex > -1) {
    champion.items.splice(itemIndex, 1);
  }

  // Add dropped item to tile
  if (!tile.items) {
    tile.items = [];
  }
  tile.items.push(itemToDrop);

  // Add stuck ring to champion
  const stuckRing = createStuckRing();
  champion.items.push(stuckRing);

  logFn("event", `Champion${championId} dropped ${getItemName(itemToDrop)} and the Mysterious Ring got stuck on their finger!`);

  return {
    cardProcessed: true,
    cardId: "mysterious-ring",
    treasureName: "Mysterious Ring",
    effectApplied: "Ring is stuck (dropped item)"
  };
}

/**
 * Handle inventory full case for dragon ring (outcome 3)
 */
async function handleInventoryFullForDragonRing(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<MysteriousRingResult> {
  const droppableOptions: any[] = [];

  // Only include items that aren't stuck
  if (!champion.items[0].stuck) {
    droppableOptions.push({
      id: "drop_first",
      description: `Drop ${getItemName(champion.items[0])} for the dragon ring`,
      itemToDrop: champion.items[0]
    });
  }

  if (!champion.items[1].stuck) {
    droppableOptions.push({
      id: "drop_second",
      description: `Drop ${getItemName(champion.items[1])} for the dragon ring`,
      itemToDrop: champion.items[1]
    });
  }

  // Always allow leaving the treasure
  droppableOptions.push({
    id: "leave_treasure",
    description: `Leave the dragon ring on the ground`
  });

  const decisionContext: DecisionContext = {
    type: "choose_item_to_drop",
    description: `Champion${championId}'s inventory is full! The Mysterious Ring grants +3 might against dragons. Choose what to drop:`,
    options: droppableOptions
  };

  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice.id === "leave_treasure") {
    // Leave the dragon ring on the tile
    if (!tile.items) {
      tile.items = [];
    }
    const dragonRing = createDragonsbaneRing();
    tile.items.push(dragonRing);
    logFn("event", `Champion${championId} left the powerful Mysterious Ring on the ground.`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Left dragon ring on ground"
    };
  } else {
    // Drop an existing item and take the dragon ring
    const itemToDrop = decision.choice.itemToDrop;

    // Remove the item from champion's inventory
    const itemIndex = champion.items.indexOf(itemToDrop);
    if (itemIndex > -1) {
      champion.items.splice(itemIndex, 1);
    }

    // Add dropped item to tile
    if (!tile.items) {
      tile.items = [];
    }
    tile.items.push(itemToDrop);

    // Add dragon ring to champion
    const dragonRing = createDragonsbaneRing();
    champion.items.push(dragonRing);

    logFn("event", `Champion${championId} dropped ${getItemName(itemToDrop)} and the Mysterious Ring glows with dragon-slaying power!`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Gained +3 might against dragons"
    };
  }
} 