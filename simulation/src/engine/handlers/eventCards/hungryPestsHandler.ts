import { GameState } from "@/game/GameState";
import { DecisionContext, EventCardResult, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Handle the Hungry Pests event card
 */
export async function handleHungryPests(
  gameState: GameState,
  currentPlayer: Player,
  currentPlayerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<EventCardResult> {
  logFn("event", "Hungry Pests! Choose 1 player who loses 1 food to starved rats.");

  // Create decision context for choosing target player
  const availablePlayers = gameState.players.map(p => ({
    name: p.name,
    displayName: `${p.name} (${p.resources.food} food)`
  }));

  const decisionContext: DecisionContext = {
    type: "choose_target_player",
    description: "Choose which player loses 1 food to the hungry pests",
    options: availablePlayers
  };

  try {
    // Ask current player to make the decision
    const decision = await currentPlayerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);
    const targetPlayerName = decision.choice.name;

    // Apply the food loss to the chosen player
    const targetPlayer = gameState.getPlayer(targetPlayerName);
    if (targetPlayer) {
      const foodLost = Math.min(1, targetPlayer.resources.food);
      targetPlayer.resources.food = Math.max(0, targetPlayer.resources.food - 1);
      logFn("event", `${currentPlayer.name} chose ${targetPlayerName} to lose 1 food to hungry pests`);

      return {
        eventProcessed: true,
        playersAffected: [targetPlayerName],
        resourcesChanged: {
          [targetPlayerName]: { food: -foodLost }
        }
      };
    } else {
      const errorMessage = `Error: Could not find target player ${targetPlayerName}`;
      logFn("event", errorMessage);
      return {
        eventProcessed: false,
        errorMessage
      };
    }
  } catch (error) {
    const errorMessage = `Error processing Hungry Pests decision: ${error}`;
    logFn("event", errorMessage);
    return {
      eventProcessed: false,
      errorMessage
    };
  }
} 