import { getTreasureCardById } from "@/content/treasureCards";
import { GameState } from "@/game/GameState";
import { Decision, DecisionContext, Player, Tile } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { handleMysteriousRing } from "./mysteriousRingHandler";

export interface TreasureCardResult {
  cardProcessed: boolean;
  cardId?: string;
  errorMessage?: string;
}

/**
 * Handle treasure cards drawn from adventure decks
 */
export async function handleTreasureCard(
  cardId: string,
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<TreasureCardResult> {
  const treasureCard = getTreasureCardById(cardId);
  if (!treasureCard) {
    const errorMessage = `Champion${championId} drew unknown treasure card ${cardId}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  logFn("event", `Champion${championId} found treasure: ${treasureCard.name}!`);

  // Handle specific treasure cards
  switch (cardId) {
    case "broken-shield":
      return await handleBrokenShield(gameState, player, playerAgent, championId, logFn, thinkingLogger);

    case "rusty-sword":
      return await handleRustySword(gameState, tile, player, playerAgent, championId, logFn, thinkingLogger);

    case "mysterious-ring":
      return await handleMysteriousRing(gameState, tile, player, playerAgent, championId, logFn, thinkingLogger);

    default:
      // Handle as generic carriable/non-carriable treasure
      return await handleGenericTreasure(treasureCard, gameState, tile, player, playerAgent, championId, logFn, thinkingLogger);
  }
}

/**
 * Handle the broken-shield treasure card
 */
async function handleBrokenShield(
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<TreasureCardResult> {
  // Check if player has enough ore for the might option
  if (player.resources.ore < 2) {
    // Not enough ore, automatically choose the first option
    player.resources.ore += 1;
    logFn("event", `Champion${championId} found a Broken Shield! Not enough ore (2 required) for the might option, so automatically gained +1 ore.`);
    return {
      cardProcessed: true,
      cardId: "broken-shield"
    };
  }

  // Player has enough ore, present the choice
  const decisionContext: DecisionContext = {
    type: "broken_shield_choice",
    description: `Champion${championId} found a Broken Shield! Choose one:`,
    options: [
      {
        id: "gain_ore",
        description: "Gain +1 ore"
      },
      {
        id: "gain_might",
        description: "Spend 2 ore to gain +1 might"
      }
    ]
  };

  // Ask the player to make a decision
  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice.id === "gain_ore") {
    player.resources.ore += 1;
    logFn("event", `Champion${championId} chose to gain +1 ore from the Broken Shield.`);
    return {
      cardProcessed: true,
      cardId: "broken-shield"
    };
  } else if (decision.choice.id === "gain_might") {
    player.resources.ore -= 2;
    player.might += 1;
    logFn("event", `Champion${championId} spent 2 ore to gain +1 might from the Broken Shield.`);
    return {
      cardProcessed: true,
      cardId: "broken-shield"
    };
  } else {
    const errorMessage = `Invalid choice for broken shield: ${decision.choice.id}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }
}

/**
 * Handle the rusty-sword treasure card
 */
async function handleRustySword(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<TreasureCardResult> {
  // Find the champion
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    const errorMessage = `Champion${championId} not found for player ${player.name}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  // Check if champion has space for the item
  if (champion.items.length < 2) {
    // Add the item directly
    champion.items.push({ treasureCard: { id: "rusty-sword", name: "Rusty sword", tier: 1, description: "Gain `+2 might`. This **item breaks** after *one fight*.", count: 2, carriable: true } });
    logFn("event", `Champion${championId} picked up a Rusty sword (+2 might, breaks after one fight).`);
    return {
      cardProcessed: true,
      cardId: "rusty-sword"
    };
  }

  // Champion's inventory is full, need to ask what to drop
  const droppableOptions: any[] = [];

  // Only include items that aren't stuck
  if (!champion.items[0].stuck) {
    droppableOptions.push({
      id: "drop_first",
      description: `Drop ${getItemName(champion.items[0])} and take the Rusty sword`,
      itemToDrop: champion.items[0]
    });
  }

  if (!champion.items[1].stuck) {
    droppableOptions.push({
      id: "drop_second",
      description: `Drop ${getItemName(champion.items[1])} and take the Rusty sword`,
      itemToDrop: champion.items[1]
    });
  }

  // Always allow leaving the treasure
  droppableOptions.push({
    id: "leave_treasure",
    description: `Leave the Rusty sword on the ground`
  });

  const decisionContext: DecisionContext = {
    type: "choose_item_to_drop",
    description: `Champion${championId}'s inventory is full! Choose what to do with the Rusty sword:`,
    options: droppableOptions
  };

  // Ask the player to make a decision
  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice.id === "leave_treasure") {
    // Leave the treasure on the tile
    if (!tile.items) {
      tile.items = [];
    }
    tile.items.push({ treasureCard: { id: "rusty-sword", name: "Rusty sword", tier: 1, description: "Gain `+2 might`. This **item breaks** after *one fight*.", count: 2, carriable: true } });
    logFn("event", `Champion${championId} left the Rusty sword on the ground.`);
    return {
      cardProcessed: true,
      cardId: "rusty-sword"
    };
  } else {
    // Drop an existing item and take the treasure
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

    // Add new treasure to champion
    champion.items.push({ treasureCard: { id: "rusty-sword", name: "Rusty sword", tier: 1, description: "Gain `+2 might`. This **item breaks** after *one fight*.", count: 2, carriable: true } });

    logFn("event", `Champion${championId} dropped ${getItemName(itemToDrop)} and picked up the Rusty sword (+2 might, breaks after one fight).`);
    return {
      cardProcessed: true,
      cardId: "rusty-sword"
    };
  }
}

/**
 * Handle generic treasure cards (carriable/non-carriable)
 */
async function handleGenericTreasure(
  treasureCard: any,
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<TreasureCardResult> {
  // Check if this treasure can be carried as an item
  if (!treasureCard.carriable) {
    // For non-carriable treasures, just log the effect (implementation depends on specific treasure)
    logFn("event", `${treasureCard.name} effect: ${treasureCard.description}`);
    return {
      cardProcessed: true,
      cardId: treasureCard.id
    };
  }

  // Find the champion
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    const errorMessage = `Champion${championId} not found for player ${player.name}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  // Check if champion has space for the item
  if (champion.items.length < 2) {
    // Add the item directly
    champion.items.push({ treasureCard });
    logFn("event", `Champion${championId} picked up ${treasureCard.name}.`);
    return {
      cardProcessed: true,
      cardId: treasureCard.id
    };
  }

  // Champion's inventory is full, need to ask what to drop
  const droppableOptions: any[] = [];

  // Only include items that aren't stuck
  if (!champion.items[0].stuck) {
    droppableOptions.push({
      id: "drop_first",
      description: `Drop ${getItemName(champion.items[0])} and take ${treasureCard.name}`,
      itemToDrop: champion.items[0]
    });
  }

  if (!champion.items[1].stuck) {
    droppableOptions.push({
      id: "drop_second",
      description: `Drop ${getItemName(champion.items[1])} and take ${treasureCard.name}`,
      itemToDrop: champion.items[1]
    });
  }

  // Always allow leaving the treasure
  droppableOptions.push({
    id: "leave_treasure",
    description: `Leave ${treasureCard.name} on the ground`
  });

  const decisionContext: DecisionContext = {
    type: "choose_item_to_drop",
    description: `Champion${championId}'s inventory is full! Choose what to do with ${treasureCard.name}:`,
    options: droppableOptions
  };

  // Ask the player to make a decision
  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice.id === "leave_treasure") {
    // Leave the treasure on the tile
    if (!tile.items) {
      tile.items = [];
    }
    tile.items.push({ treasureCard });
    logFn("event", `Champion${championId} left ${treasureCard.name} on the ground.`);
    return {
      cardProcessed: true,
      cardId: treasureCard.id
    };
  } else {
    // Drop an existing item and take the treasure
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

    // Add new treasure to champion
    champion.items.push({ treasureCard });

    logFn("event", `Champion${championId} dropped ${getItemName(itemToDrop)} and picked up ${treasureCard.name}.`);
    return {
      cardProcessed: true,
      cardId: treasureCard.id
    };
  }
}

// Helper function to get the name of a CarriableItem
function getItemName(item: any): string {
  if (item.treasureCard) {
    return item.treasureCard.name;
  }
  if (item.traderItem) {
    return item.traderItem.name;
  }
  // Fallback for old string-based items during migration
  return typeof item === 'string' ? item : 'Unknown Item';
} 