import { getTreasureCardById } from "@/content/treasureCards";
import { GameState } from "@/game/GameState";
import { Decision, DecisionContext, GameLogEntry, Player, Tile, TileTier } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { canChampionCarryMoreItems, createDropItemDecision, handleDropItemDecision } from "@/players/PlayerUtils";
import { handleMysteriousRing } from "./cardHandlers/mysteriousRingHandler";
import { handleSwordInStone } from "./cardHandlers/swordInStoneHandler";

// Broken Shield card constants
const BROKEN_SHIELD_ORE_COST = 2;
const BROKEN_SHIELD_ORE_REWARD = 1;

export interface TreasureCardResult {
  cardProcessed: boolean;
  cardId?: string;
  cardReturnedToDeck?: boolean; // For cards that should be returned to the top of the deck
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
  gameLog: readonly GameLogEntry[],
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

    case "sword-in-stone":
      return await handleSwordInStone(gameState, tile, player, playerAgent, championId, logFn, thinkingLogger);

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
  if (player.resources.ore < BROKEN_SHIELD_ORE_COST) {
    // Not enough ore, automatically choose the first option
    player.resources.ore += BROKEN_SHIELD_ORE_REWARD;
    logFn("event", `Champion${championId} found a Broken Shield! Not enough ore (${BROKEN_SHIELD_ORE_COST} required) for the might option, so automatically gained +${BROKEN_SHIELD_ORE_REWARD} ore.`);
    return {
      cardProcessed: true,
      cardId: "broken-shield"
    };
  }

  // Player has enough ore, present the choice
  const decisionContext: DecisionContext = {
    description: `Champion${championId} found a Broken Shield! Choose one:`,
    options: [
      {
        id: "gain_ore",
        description: `Gain +${BROKEN_SHIELD_ORE_REWARD} ore`
      },
      {
        id: "gain_might",
        description: `Spend ${BROKEN_SHIELD_ORE_COST} ore to gain +1 might`
      }
    ]
  };

  // Ask the player to make a decision
  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice === "gain_ore") {
    player.resources.ore += BROKEN_SHIELD_ORE_REWARD;
    logFn("event", `Champion${championId} chose to gain +${BROKEN_SHIELD_ORE_REWARD} ore from the Broken Shield.`);

    return {
      cardProcessed: true,
      cardId: "broken-shield"
    };
  } else if (decision.choice === "gain_might") {
    if (player.resources.ore >= BROKEN_SHIELD_ORE_COST) {
      player.resources.ore -= BROKEN_SHIELD_ORE_COST;
      player.might += 1;
      logFn("event", `Champion${championId} spent ${BROKEN_SHIELD_ORE_COST} ore to gain +1 might from the Broken Shield.`);

      return {
        cardProcessed: true,
        cardId: "broken-shield"
      };
    } else {
      logFn("event", `Champion${championId} doesn't have enough ore (need ${BROKEN_SHIELD_ORE_COST}, have ${player.resources.ore}). Gained +${BROKEN_SHIELD_ORE_REWARD} ore instead.`);
      player.resources.ore += BROKEN_SHIELD_ORE_REWARD;

      return {
        cardProcessed: true,
        cardId: "broken-shield"
      };
    }
  } else {
    const errorMessage = `Invalid choice for broken shield: ${decision.choice}`;
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
  if (canChampionCarryMoreItems(champion)) {
    // Add the item directly
    const rustySword = {
      treasureCard: {
        id: "rusty-sword",
        name: "Rusty sword",
        tier: 1 as TileTier,
        description: "Gain `+2 might`. This **item breaks** after *one fight*.",
        count: 2,
        carriable: true
      },
      combatBonus: 2
    };
    champion.items.push(rustySword);
    logFn("event", `Champion${championId} picked up a Rusty sword (+2 might, breaks after one fight).`);
    return {
      cardProcessed: true,
      cardId: "rusty-sword"
    };
  }

  // Use the new utility for drop item decision
  const rustySword = {
    treasureCard: {
      id: "rusty-sword",
      name: "Rusty sword",
      tier: 1 as TileTier,
      description: "Gain `+2 might`. This **item breaks** after *one fight*.",
      count: 2,
      carriable: true
    },
    combatBonus: 2
  };

  const dropDecision = createDropItemDecision(
    championId,
    "Rusty sword",
    champion,
    undefined,
    true,
    "Leave the Rusty sword on the ground"
  );

  const decision: Decision = await playerAgent.makeDecision(gameState, [], dropDecision.decisionContext, thinkingLogger);

  const itemAcquired = handleDropItemDecision(
    decision,
    champion,
    rustySword,
    tile,
    championId,
    "Rusty sword",
    logFn
  );

  return {
    cardProcessed: true,
    cardId: "rusty-sword"
  };
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
  if (canChampionCarryMoreItems(champion)) {
    // Add the item directly
    champion.items.push({ treasureCard });
    logFn("event", `Champion${championId} picked up ${treasureCard.name}.`);
    return {
      cardProcessed: true,
      cardId: treasureCard.id
    };
  }

  // Use the new utility for drop item decision
  const dropDecision = createDropItemDecision(
    championId,
    treasureCard.name,
    champion,
    undefined,
    true,
    `Leave ${treasureCard.name} on the ground`
  );

  const decision: Decision = await playerAgent.makeDecision(gameState, [], dropDecision.decisionContext, thinkingLogger);

  const itemAcquired = handleDropItemDecision(
    decision,
    champion,
    { treasureCard },
    tile,
    championId,
    treasureCard.name,
    logFn
  );

  return {
    cardProcessed: true,
    cardId: treasureCard.id
  };
} 