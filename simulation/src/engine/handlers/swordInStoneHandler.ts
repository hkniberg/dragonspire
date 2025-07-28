import { GameState } from "@/game/GameState";
import { CarriableItem, Decision, DecisionContext, Player, Tile, TileTier } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { createDropItemDecision, handleDropItemDecision } from "@/players/PlayerUtils";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Create a half sword item (outcome 1 of sword-in-stone)
 */
function createHalfSword(): CarriableItem {
  return {
    treasureCard: {
      id: "half-sword",
      name: "Half Sword",
      tier: 2 as TileTier,
      description: "It broke off. Gain +2 might.",
      count: 1,
      carriable: true
    },
    combatBonus: 2
  };
}

/**
 * Create a Cloudslicer item (outcome 3 of sword-in-stone)
 */
function createCloudslicer(): CarriableItem {
  return {
    treasureCard: {
      id: "cloudslicer",
      name: "Cloudslicer",
      tier: 2 as TileTier,
      description: "A legendary blade. Gain +4 might.",
      count: 1,
      carriable: true
    },
    combatBonus: 4
  };
}

export interface SwordInStoneResult {
  cardProcessed: boolean;
  cardId?: string;
  treasureName?: string;
  effectApplied?: string;
  cardReturnedToDeck?: boolean;
  errorMessage?: string;
}

/**
 * Handle the sword-in-stone treasure card with its complex random outcomes
 */
export async function handleSwordInStone(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<SwordInStoneResult> {
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    const errorMessage = `Champion${championId} not found for player ${player.name}`;
    logFn("event", errorMessage);
    return {
      cardProcessed: false,
      errorMessage
    };
  }

  // Present the decision to attempt pulling the sword
  const decisionContext: DecisionContext = {
    type: "sword_in_stone_attempt",
    description: `Champion${championId} found a Sword in a Stone! Attempt to pull it out?`,
    options: [
      {
        id: "attempt_pull",
        description: "Attempt to pull the sword from the stone"
      },
      {
        id: "leave_sword",
        description: "Leave the sword alone"
      }
    ]
  };

  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice.id === "leave_sword") {
    logFn("event", `Champion${championId} decided not to attempt pulling the sword.`);
    return {
      cardProcessed: true,
      cardId: "sword-in-stone",
      treasureName: "Sword in a Stone",
      effectApplied: "Left sword untouched"
    };
  }

  // Roll D3 to determine the sword's effect
  const roll = rollD3();
  logFn("event", `Champion${championId} attempts to pull the Sword in a Stone! Rolling D3... rolled ${roll}!`);

  switch (roll) {
    case 1:
      // It breaks off - get half sword (+2 might)
      return await handleHalfSwordOutcome(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);

    case 2:
      // Card goes back to the top of the deck
      logFn("event", `The sword resists! It cannot be pulled from the stone and the magic fades away.`);
      return {
        cardProcessed: true,
        cardId: "sword-in-stone",
        treasureName: "Sword in a Stone",
        effectApplied: "Sword resisted, magic faded",
        cardReturnedToDeck: true
      };

    case 3:
      // Get Cloudslicer (+4 might)
      return await handleCloudslicerOutcome(gameState, tile, player, playerAgent, championId, champion, logFn, thinkingLogger);

    default:
      const errorMessage = `Invalid roll result for sword in stone: ${roll}`;
      logFn("event", errorMessage);
      return {
        cardProcessed: false,
        errorMessage
      };
  }
}

/**
 * Handle outcome 1: Get half sword (+2 might)
 */
async function handleHalfSwordOutcome(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<SwordInStoneResult> {
  const halfSword = createHalfSword();

  if (champion.items.length < 2) {
    // Add the half sword directly
    champion.items.push(halfSword);
    logFn("event", `The sword breaks off! Champion${championId} gained a Half Sword (+2 might)!`);
    return {
      cardProcessed: true,
      cardId: "sword-in-stone",
      treasureName: "Sword in a Stone",
      effectApplied: "Gained Half Sword (+2 might)"
    };
  } else {
    // Need to ask what to drop for the half sword
    return await handleInventoryFullForSword(gameState, tile, player, playerAgent, championId, champion, halfSword, "Half Sword", logFn, thinkingLogger);
  }
}

/**
 * Handle outcome 3: Get Cloudslicer (+4 might)
 */
async function handleCloudslicerOutcome(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<SwordInStoneResult> {
  const cloudslicer = createCloudslicer();

  if (champion.items.length < 2) {
    // Add Cloudslicer directly
    champion.items.push(cloudslicer);
    logFn("event", `SUCCESS! Champion${championId} pulled out the legendary Cloudslicer (+4 might)!`);
    return {
      cardProcessed: true,
      cardId: "sword-in-stone",
      treasureName: "Sword in a Stone",
      effectApplied: "Gained Cloudslicer (+4 might)"
    };
  } else {
    // Need to ask what to drop for Cloudslicer
    return await handleInventoryFullForSword(gameState, tile, player, playerAgent, championId, champion, cloudslicer, "Cloudslicer", logFn, thinkingLogger);
  }
}

/**
 * Handle inventory full case when pulling a sword from the stone
 */
async function handleInventoryFullForSword(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  champion: any,
  swordItem: CarriableItem,
  swordName: string,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<SwordInStoneResult> {
  // Use the new utility for drop item decision
  const dropDecision = createDropItemDecision(
    championId,
    swordName,
    champion,
    `The ${swordName} was pulled from the stone.`,
    true,
    `Leave the ${swordName} on the ground`
  );

  const decision: Decision = await playerAgent.makeDecision(gameState, [], dropDecision.decisionContext, thinkingLogger);

  const itemAcquired = handleDropItemDecision(
    decision,
    champion,
    swordItem,
    tile,
    championId,
    swordName,
    logFn
  );

  if (itemAcquired) {
    const bonus = swordItem.combatBonus || 0;
    return {
      cardProcessed: true,
      cardId: "sword-in-stone",
      treasureName: "Sword in a Stone",
      effectApplied: `Gained ${swordName} (+${bonus} might)`
    };
  } else {
    return {
      cardProcessed: true,
      cardId: "sword-in-stone",
      treasureName: "Sword in a Stone",
      effectApplied: `Left ${swordName} on ground`
    };
  }
} 