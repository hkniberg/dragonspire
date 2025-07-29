import { GameState } from "@/game/GameState";
import { DecisionContext, EventCardResult, Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Handle the Thieving Crows event card
 * Player chooses which resource gets stolen: food, wood, or ore. 
 * All players lose all of that resource.
 */
export async function handleThievingCrows(
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<EventCardResult> {
  logFn("event", "Thieving crows descend upon the island! Choose which resource they steal from everyone:");

  // Ask the player to choose which resource type gets stolen
  const decisionContext: DecisionContext = {
    description: `The thieving crows are here! Choose which resource they steal from ALL players:`,
    options: [
      { id: "food", description: "All players lose all their food" },
      { id: "wood", description: "All players lose all their wood" },
      { id: "ore", description: "All players lose all their ore" }
    ]
  };

  const decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);
  const chosenResource = decision.choice as ResourceType;

  logFn("event", `${player.name} chooses ${chosenResource} - the crows steal all ${chosenResource} from everyone!`);

  const resourcesChanged: Record<string, { food?: number; wood?: number; ore?: number; gold?: number }> = {};
  const playersAffected: string[] = [];

  // All players lose all of the chosen resource
  for (const affectedPlayer of gameState.players) {
    const amountLost = affectedPlayer.resources[chosenResource];

    if (amountLost > 0) {
      affectedPlayer.resources[chosenResource] = 0;

      // Track the change (negative amount since it's a loss)
      resourcesChanged[affectedPlayer.name] = {};
      resourcesChanged[affectedPlayer.name][chosenResource] = -amountLost;

      playersAffected.push(affectedPlayer.name);
      logFn("event", `${affectedPlayer.name} loses ${amountLost} ${chosenResource} to the thieving crows!`);
    }
  }

  if (playersAffected.length === 0) {
    logFn("event", `No one had any ${chosenResource} for the crows to steal - they fly away disappointed`);
  }

  return {
    eventProcessed: true,
    playersAffected,
    resourcesChanged
  };
} 