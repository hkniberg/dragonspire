import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { DecisionContext, GameLogEntry, Player, Position, ResourceType, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import { PlayerAgent } from "@/players/PlayerAgent";

export interface FleeContext {
  combatType: 'champion' | 'monster' | 'dragon';
  isActivelyChosen: boolean;
  gameState: GameState;
  player: Player;
  championId: number;
  tile: Tile;
  opponentName?: string; // For champion combat
}

export interface FleeResult {
  attemptedFlee: boolean;
  fleeSuccessful?: boolean;
  destination?: Position;
  fameLoss?: number;
  resourceLoss?: string;
  reasoning?: string;
}

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Check if a player can attempt to flee from combat
 */
export function canPlayerFlee(context: FleeContext): boolean {
  // Players who actively chose to fight cannot flee
  return !context.isActivelyChosen;
}

/**
 * Find the closest unoccupied tile owned by the player
 */
export function findClosestOwnedTile(gameState: GameState, player: Player, currentPosition: Position): Position | null {
  const ownedTiles = gameState.board.findTiles(tile => tile.claimedBy === player.name);

  if (ownedTiles.length === 0) {
    return null;
  }

  let closestTile: Tile | null = null;
  let minDistance = Infinity;

  for (const tile of ownedTiles) {
    // Check if tile is safe (no opposing champions)
    const opposingChampions = gameState.getOpposingChampionsAtPosition(player.name, tile.position);
    if (opposingChampions.length > 0) {
      continue; // Tile has opposing champions
    }

    // Calculate Manhattan distance
    const distance = Math.abs(tile.position.row - currentPosition.row) +
      Math.abs(tile.position.col - currentPosition.col);

    if (distance < minDistance) {
      minDistance = distance;
      closestTile = tile;
    }
  }

  return closestTile ? closestTile.position : null;
}

/**
 * Handle resource loss when fleeing (partial success on flee roll)
 */
async function handleFleeResourceLoss(
  player: Player,
  championId: number,
  playerAgent: PlayerAgent,
  gameState: GameState,
  gameLog: readonly GameLogEntry[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<{ lossDescription: string }> {
  // Check what resources the player has available
  const availableResourceTypes: Array<{ type: ResourceType; name: string; amount: number }> = [];

  if (player.resources.food > 0) {
    availableResourceTypes.push({ type: "food", name: "Food", amount: player.resources.food });
  }
  if (player.resources.wood > 0) {
    availableResourceTypes.push({ type: "wood", name: "Wood", amount: player.resources.wood });
  }
  if (player.resources.ore > 0) {
    availableResourceTypes.push({ type: "ore", name: "Ore", amount: player.resources.ore });
  }
  if (player.resources.gold > 0) {
    availableResourceTypes.push({ type: "gold", name: "Gold", amount: player.resources.gold });
  }

  // Case 1: No resources available - lose 1 fame instead (unless fame is already 0)
  if (availableResourceTypes.length === 0) {
    if (player.fame > 0) {
      player.fame--;
      logFn("combat", `Champion${championId} lost 1 fame from fleeing (no resources available)`);
      return { lossDescription: "fame" };
    } else {
      logFn("combat", `Champion${championId} had no resources or fame to lose from fleeing`);
      return { lossDescription: "" };
    }
  }

  // Case 2: Only one resource type available - automatically use it
  if (availableResourceTypes.length === 1) {
    const resourceType = availableResourceTypes[0];
    player.resources[resourceType.type]--;
    logFn("combat", `Champion${championId} lost 1 ${resourceType.name.toLowerCase()} from fleeing`);
    return { lossDescription: resourceType.name.toLowerCase() };
  }

  // Case 3: Multiple resource types available - ask player to choose
  const currentResources = formatResources(player.resources, ", ");
  const decisionContext: DecisionContext = {
    description: `Choose which resource to lose from fleeing (you have: ${currentResources}):`,
    options: availableResourceTypes.map(resource => ({
      id: resource.type,
      description: `1 ${resource.name} (you have ${resource.amount})`
    }))
  };

  try {
    const decision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);
    const chosenOption = decision.choice as ResourceType;

    // Check if the chosen resource type is valid and available
    const chosenResource = availableResourceTypes.find(r => r.type === chosenOption);
    if (chosenResource && player.resources[chosenOption] > 0) {
      player.resources[chosenOption]--;
      logFn("combat", `Champion${championId} lost 1 ${chosenResource.name.toLowerCase()} from fleeing`);
      return { lossDescription: chosenResource.name.toLowerCase() };
    }

    // Fallback if invalid choice - use first available resource
    const fallbackResource = availableResourceTypes[0];
    player.resources[fallbackResource.type]--;
    logFn("combat", `Champion${championId} lost 1 ${fallbackResource.name.toLowerCase()} from fleeing (fallback)`);
    return { lossDescription: fallbackResource.name.toLowerCase() };
  } catch (error) {
    // Error getting decision - use first available resource as fallback
    const fallbackResource = availableResourceTypes[0];
    player.resources[fallbackResource.type]--;
    logFn("combat", `Champion${championId} lost 1 ${fallbackResource.name.toLowerCase()} from fleeing (error fallback)`);
    return { lossDescription: fallbackResource.name.toLowerCase() };
  }
}

/**
 * Handle the flee decision and outcome
 */
export async function handleFleeDecision(
  context: FleeContext,
  playerAgent: PlayerAgent,
  gameLog: readonly GameLogEntry[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<FleeResult> {
  // Check if fleeing is allowed
  if (!canPlayerFlee(context)) {
    return {
      attemptedFlee: false,
      reasoning: "Cannot flee - actively chose to fight"
    };
  }

  // Create decision context for fight/flee choice
  const decisionContext: DecisionContext = {
    description: `Choose action for ${context.combatType} combat:`,
    options: [
      {
        id: "fight",
        description: "Fight"
      },
      {
        id: "flee",
        description: "Attempt to flee"
      }
    ]
  };

  // Ask player to decide
  const decision = await playerAgent.makeDecision(context.gameState, gameLog, decisionContext, thinkingLogger);

  if (decision.choice === "fight") {
    return {
      attemptedFlee: false,
      reasoning: decision.reasoning || "Chose to fight"
    };
  }

  // Player chose to flee - handle outcome
  if (context.combatType === 'dragon') {
    // Dragon fleeing always succeeds
    const champion = context.gameState.getChampion(context.player.name, context.championId);
    if (champion) {
      champion.position = context.player.homePosition;
    }
    context.player.fame = Math.max(0, context.player.fame - GameSettings.DEFEAT_FAME_PENALTY);

    logFn("combat", `Champion${context.championId} fled from the dragon, returned home and lost ${GameSettings.DEFEAT_FAME_PENALTY} fame`);

    return {
      attemptedFlee: true,
      fleeSuccessful: true,
      destination: context.player.homePosition,
      fameLoss: GameSettings.DEFEAT_FAME_PENALTY,
      reasoning: decision.reasoning || "Fled from dragon"
    };
  }

  // Normal combat (monster/champion) - roll for outcome
  const fleeRoll = rollD3();
  logFn("combat", `Champion${context.championId} attempts to flee, rolled [${fleeRoll}]`);

  if (fleeRoll === 1) {
    // Failure - combat proceeds normally
    logFn("combat", `Flee attempt failed, combat proceeds`);
    return {
      attemptedFlee: true,
      fleeSuccessful: false,
      reasoning: decision.reasoning || "Flee attempt failed"
    };
  }

  const champion = context.gameState.getChampion(context.player.name, context.championId);
  if (!champion) {
    return {
      attemptedFlee: true,
      fleeSuccessful: false,
      reasoning: "Champion not found"
    };
  }

  if (fleeRoll === 2) {
    // Partial success - flee to closest owned tile and lose 1 resource
    const closestOwnedTile = findClosestOwnedTile(context.gameState, context.player, champion.position);

    let destination: Position;
    if (closestOwnedTile) {
      destination = closestOwnedTile;
      logFn("combat", `Champion${context.championId} fled to closest owned tile at (${destination.row}, ${destination.col})`);
    } else {
      destination = context.player.homePosition;
      logFn("combat", `Champion${context.championId} fled to home tile (no owned tiles available)`);
    }

    champion.position = destination;

    // Handle resource loss from fleeing
    const { lossDescription } = await handleFleeResourceLoss(
      context.player,
      context.championId,
      playerAgent,
      context.gameState,
      gameLog,
      logFn,
      thinkingLogger
    );

    return {
      attemptedFlee: true,
      fleeSuccessful: true,
      destination,
      resourceLoss: lossDescription || undefined,
      fameLoss: lossDescription === "fame" ? 1 : undefined,
      reasoning: decision.reasoning || "Fled to closest owned tile"
    };
  }

  // fleeRoll === 3 - Success - flee to home tile without loss
  champion.position = context.player.homePosition;
  logFn("combat", `Champion${context.championId} fled to home tile without loss`);

  return {
    attemptedFlee: true,
    fleeSuccessful: true,
    destination: context.player.homePosition,
    reasoning: decision.reasoning || "Fled to home"
  };
} 