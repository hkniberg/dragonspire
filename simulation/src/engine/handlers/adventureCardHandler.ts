import { getEventCardById } from "@/content/eventCards";
import { getMonsterCardById } from "@/content/monsterCards";
import { GameState } from "@/game/GameState";
import { Monster, Player, Tile } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { resolveMonsterBattle } from "../actions/battleCalculator";
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

  // Create a Monster object and place it on the tile
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

  tile.monster = monster;
  logFn("event", `Champion${championId} drew monster card: ${monster.name}!`);

  // Now handle monster combat using the existing logic
  const combatResult = resolveMonsterBattle(player.might, monster.might);

  if (combatResult.championWins) {
    // Champion won - award fame and resources, remove monster from tile
    const fameAwarded = monster.fame || 0;
    player.fame += fameAwarded;
    player.resources.food += monster.resources.food;
    player.resources.wood += monster.resources.wood;
    player.resources.ore += monster.resources.ore;
    player.resources.gold += monster.resources.gold;

    // Remove monster from tile
    tile.monster = undefined;

    logFn("combat", `Defeated ${monster.name} (${combatResult.championTotal} vs ${combatResult.monsterTotal}), gained ${fameAwarded} fame and got food:${monster.resources.food} wood:${monster.resources.wood} ore:${monster.resources.ore} gold:${monster.resources.gold}`);

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
  } else {
    // Champion lost, monster stays on tile, champion will be sent home by caller
    logFn("combat", `Fought ${monster.name}, but was defeated (${combatResult.championTotal} vs ${combatResult.monsterTotal}), returned home. ${monster.name} remains on the tile`);

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
  logFn: (type: string, content: string) => void
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
    const eventResult = await handleEventCard(eventCard, gameState, player, playerAgent, gameLog, logFn);

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
export function handleTreasureCard(
  cardId: string,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): AdventureCardResult {
  // Treasure cards not yet implemented
  logFn("event", `Champion${championId} drew treasure card ${cardId}, but treasure cards aren't implemented yet.`);

  return {
    cardProcessed: false,
    cardType: "treasure",
    cardId,
    errorMessage: "Treasure cards not implemented"
  };
}

/**
 * Handle encounter cards drawn from adventure decks
 */
export function handleEncounterCard(
  cardId: string,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): AdventureCardResult {
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
export function handleFollowerCard(
  cardId: string,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): AdventureCardResult {
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
  logFn: (type: string, content: string) => void
): Promise<AdventureCardResult> {
  const cardType = adventureCard.type;
  const cardId = adventureCard.id;

  switch (cardType) {
    case "monster":
      return handleMonsterCard(cardId, gameState, tile, player, championId, logFn);

    case "event":
      return await handleEventCardFromAdventure(cardId, gameState, player, playerAgent, championId, gameLog, logFn);

    case "treasure":
      return handleTreasureCard(cardId, player, championId, logFn);

    case "encounter":
      return handleEncounterCard(cardId, player, championId, logFn);

    case "follower":
      return handleFollowerCard(cardId, player, championId, logFn);

    default:
      const errorMessage = `Champion${championId} drew unknown card type ${cardType} with id ${cardId}`;
      logFn("event", errorMessage);
      return {
        cardProcessed: false,
        errorMessage
      };
  }
} 