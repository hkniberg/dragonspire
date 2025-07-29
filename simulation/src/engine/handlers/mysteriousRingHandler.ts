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
    },
    combatBonus: 3 // Note: This bonus only applies against dragons, handled specially in calculateItemEffects
  };
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
    description: `Champion${championId} can swap locations with any champion! Choose who to swap with:`,
    options: allChampions.map((target, index) => ({
      id: `swap_${index}`,
      description: `Swap with ${target.playerName}'s Champion${target.championId} at (${target.position.row}, ${target.position.col})`
    }))
  };

  const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  // Parse the choice to get the target champion index
  const choiceMatch = decision.choice.match(/^swap_(\d+)$/);
  if (!choiceMatch) {
    const errorMessage = `Invalid swap choice: ${decision.choice}`;
    return { cardProcessed: false, errorMessage };
  }

  const targetIndex = parseInt(choiceMatch[1]);
  const targetChampion = allChampions[targetIndex];

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

  // Use the new utility for drop item decision (forced drop, can't refuse)
  const dropDecision = createDropItemDecision(
    championId,
    "stuck ring",
    champion,
    "The Mysterious Ring does nothing but gets stuck anyway.",
    false // Can't refuse stuck ring
  );

  const decision: Decision = await playerAgent.makeDecision(gameState, [], dropDecision.decisionContext, thinkingLogger);

  // Add stuck ring to champion
  const stuckRing = createStuckRing();

  const itemAcquired = handleDropItemDecision(
    decision,
    champion,
    stuckRing,
    tile,
    championId,
    "stuck ring",
    logFn
  );

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
  // Use the new utility for drop item decision
  const dropDecision = createDropItemDecision(
    championId,
    "dragon ring",
    champion,
    "The Mysterious Ring grants +3 might against dragons.",
    true,
    "Leave the dragon ring on the ground"
  );

  const decision: Decision = await playerAgent.makeDecision(gameState, [], dropDecision.decisionContext, thinkingLogger);

  // Create dragon ring
  const dragonRing = createDragonsbaneRing();

  const itemAcquired = handleDropItemDecision(
    decision,
    champion,
    dragonRing,
    tile,
    championId,
    "dragon ring",
    logFn
  );

  if (itemAcquired) {
    logFn("event", `The Mysterious Ring glows with dragon-slaying power!`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Gained +3 might against dragons"
    };
  } else {
    logFn("event", `Champion${championId} left the powerful Mysterious Ring on the ground.`);
    return {
      cardProcessed: true,
      cardId: "mysterious-ring",
      treasureName: "Mysterious Ring",
      effectApplied: "Left dragon ring on ground"
    };
  }
} 