import { getEventCardById } from "@/content/eventCards";
import { getMonsterCardById } from "@/content/monsterCards";
import { getTreasureCardById } from "@/content/treasureCards";
import { GameState } from "@/game/GameState";
import { Decision, DecisionContext, Monster, Player, Tile } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { resolveMonsterPlacementAndCombat } from "./combatHandler";
import { EventCardResult, handleEventCard } from "./eventCardHandler";

export interface AdventureCardResult {
  cardProcessed: boolean;
  cardType?: string;
  cardId?: string;
  monsterPlaced?: {
    monsterName: string;
    combatOccurred: boolean;
    championWon?: boolean;
    championDefeated?: boolean;
    monsterRemains?: boolean;
  };
  eventTriggered?: EventCardResult;
  errorMessage?: string;
}

/**
 * Handle monster cards drawn from adventure decks
 */
export function handleMonsterCard(
  cardId: string,
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): AdventureCardResult {
  // Look up the monster details
  const monsterCard = getMonsterCardById(cardId);
  if (!monsterCard) {
    const errorMessage = `Champion${championId} drew unknown monster card ${cardId}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  // Create a Monster object
  const monster: Monster = {
    id: monsterCard.id,
    name: monsterCard.name,
    tier: monsterCard.tier,
    icon: monsterCard.icon,
    might: monsterCard.might,
    fame: monsterCard.fame,
    resources: {
      food: monsterCard.resources.food || 0,
      wood: monsterCard.resources.wood || 0,
      ore: monsterCard.resources.ore || 0,
      gold: monsterCard.resources.gold || 0,
    },
  };

  // Use the combat handler for placement and combat
  const combatResult = resolveMonsterPlacementAndCombat(gameState, monster, tile, player, championId, logFn);

  if (combatResult.victory) {
    return {
      cardProcessed: true,
      cardType: "monster",
      cardId,
      monsterPlaced: {
        monsterName: monster.name,
        combatOccurred: true,
        championWon: true,
        championDefeated: false,
        monsterRemains: false
      }
    };
  } else if (combatResult.defeat) {
    return {
      cardProcessed: true,
      cardType: "monster",
      cardId,
      monsterPlaced: {
        monsterName: monster.name,
        combatOccurred: true,
        championWon: false,
        championDefeated: true,
        monsterRemains: true
      }
    };
  } else {
    // This shouldn't happen, but handle gracefully
    return {
      cardProcessed: false,
      errorMessage: "Unexpected combat result"
    };
  }
}

/**
 * Handle event cards drawn from adventure decks
 */
export async function handleEventCardFromAdventure(
  cardId: string,
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<AdventureCardResult> {
  const eventCard = getEventCardById(cardId);
  if (!eventCard) {
    const errorMessage = `Champion${championId} drew unknown event card ${cardId}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  logFn("event", `Champion${championId} drew event card: ${eventCard.name}!`);

  try {
    const eventResult = await handleEventCard(eventCard, gameState, player, playerAgent, gameLog, logFn, thinkingLogger);

    return {
      cardProcessed: true,
      cardType: "event",
      cardId,
      eventTriggered: eventResult
    };
  } catch (error) {
    const errorMessage = `Error handling event card ${cardId}: ${error}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }
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
): Promise<AdventureCardResult> {
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

  // Check if this treasure can be carried as an item
  if (!treasureCard.carriable) {
    // For non-carriable treasures, just log the effect (implementation depends on specific treasure)
    logFn("event", `${treasureCard.name} effect: ${treasureCard.description}`);
    return {
      cardProcessed: true,
      cardType: "treasure",
      cardId
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
      cardType: "treasure",
      cardId
    };
  }

  // Champion's inventory is full, need to ask what to drop
  const decisionContext: DecisionContext = {
    type: "choose_item_to_drop",
    description: `Champion${championId}'s inventory is full! Choose what to do with ${treasureCard.name}:`,
    options: [
      {
        id: "drop_first",
        description: `Drop ${getItemName(champion.items[0])} and take ${treasureCard.name}`,
        itemToDrop: champion.items[0]
      },
      {
        id: "drop_second",
        description: `Drop ${getItemName(champion.items[1])} and take ${treasureCard.name}`,
        itemToDrop: champion.items[1]
      },
      {
        id: "leave_treasure",
        description: `Leave ${treasureCard.name} on the ground`
      }
    ]
  };

  // Ask the player to make a decision
  const decision: Decision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

  if (decision.choice.id === "leave_treasure") {
    // Leave the treasure on the tile
    if (!tile.items) {
      tile.items = [];
    }
    tile.items.push({ treasureCard });
    logFn("event", `Champion${championId} left ${treasureCard.name} on the ground.`);
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
  }

  return {
    cardProcessed: true,
    cardType: "treasure",
    cardId
  };
}

/**
 * Handle encounter cards drawn from adventure decks
 */
export async function handleEncounterCard(
  cardId: string,
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<AdventureCardResult> {
  // Encounter cards not yet implemented
  logFn("event", `Champion${championId} drew encounter card ${cardId}, but encounter cards aren't implemented yet.`);

  return {
    cardProcessed: false,
    cardType: "encounter",
    cardId,
    errorMessage: "Encounter cards not implemented"
  };
}

/**
 * Handle follower cards drawn from adventure decks
 */
export async function handleFollowerCard(
  cardId: string,
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<AdventureCardResult> {
  // Follower cards not yet implemented
  logFn("event", `Champion${championId} drew follower card ${cardId}, but follower cards aren't implemented yet.`);

  return {
    cardProcessed: false,
    cardType: "follower",
    cardId,
    errorMessage: "Follower cards not implemented"
  };
}

/**
 * Main adventure card handler dispatcher
 */
export async function handleAdventureCard(
  adventureCard: any,
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: any[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<AdventureCardResult> {
  const cardType = adventureCard.type;
  const cardId = adventureCard.id;

  switch (cardType) {
    case "monster":
      return handleMonsterCard(cardId, gameState, tile, player, championId, logFn);

    case "event":
      return await handleEventCardFromAdventure(cardId, gameState, player, playerAgent, championId, gameLog, logFn, thinkingLogger);

    case "treasure":
      return await handleTreasureCard(cardId, gameState, tile, player, playerAgent, championId, gameLog, logFn, thinkingLogger);

    case "encounter":
      return await handleEncounterCard(cardId, gameState, tile, player, playerAgent, championId, gameLog, logFn, thinkingLogger);

    case "follower":
      return await handleFollowerCard(cardId, gameState, tile, player, playerAgent, championId, gameLog, logFn, thinkingLogger);

    default:
      const errorMessage = `Champion${championId} drew unknown card type ${cardType} with id ${cardId}`;
      logFn("event", errorMessage);
      return {
        cardProcessed: false,
        errorMessage
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