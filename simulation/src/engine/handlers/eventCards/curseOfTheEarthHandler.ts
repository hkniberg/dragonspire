import { GameState } from "@/game/GameState";
import { DecisionContext, EventCardResult, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

export async function handleCurseOfTheEarth(
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<EventCardResult> {
  // Check if player has enough gold to pay the Bogwitch
  const hasEnoughGold = player.resources.gold >= 2;

  if (!hasEnoughGold) {
    logFn("event", `${player.name} cannot afford to pay the Bogwitch (needs 2 gold, has ${player.resources.gold})`);
    return {
      eventProcessed: true,
      playersAffected: [],
    };
  }

  // Ask the player if they want to pay 2 gold to curse the lands
  const decisionContext: DecisionContext = {
    type: "curse_of_the_earth",
    description: `The Bogwitch offers to curse the lands for 2 gold. If you pay, ALL players (including you) will lose 2 might as their weapons rust and crumble. Do you want to pay?`,
    options: [
      { choice: "yes", description: "Pay 2 gold to curse all players (-2 might to everyone)" },
      { choice: "no", description: "Refuse the Bogwitch's offer" }
    ]
  };

  const decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

  if (decision.choice === "yes") {
    // Deduct 2 gold from the player
    player.resources.gold -= 2;
    logFn("event", `${player.name} pays the Bogwitch 2 gold to curse the lands!`);

    // All players lose 2 might (but not below 0)
    const resourcesChanged: Record<string, { food?: number; wood?: number; ore?: number; gold?: number }> = {};
    const playersAffected: string[] = [];

    for (const affectedPlayer of gameState.players) {
      const mightLoss = Math.min(2, affectedPlayer.might);
      if (mightLoss > 0) {
        affectedPlayer.might -= mightLoss;
        playersAffected.push(affectedPlayer.name);
        logFn("event", `${affectedPlayer.name} loses ${mightLoss} might as weapons rust and crumble (${affectedPlayer.might} might remaining)`);
      }
    }

    // Record the gold payment
    resourcesChanged[player.name] = { gold: -2 };

    return {
      eventProcessed: true,
      playersAffected,
      resourcesChanged,
    };
  } else {
    logFn("event", `${player.name} refuses the Bogwitch's offer`);
    return {
      eventProcessed: true,
      playersAffected: [],
    };
  }
} 