import { GameState } from "@/game/GameState";
import { DecisionContext, EventCardResult, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Handle the Market Day event card
 */
export async function handleMarketDay(
  gameState: GameState,
  currentPlayer: Player,
  currentPlayerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  getPlayerAgent?: (playerName: string) => PlayerAgent | undefined
): Promise<EventCardResult> {
  logFn("event", "Market Day! Decide if today is Market Day.");

  // First decision: Is today Market Day?
  const marketDayDecision: DecisionContext = {
    type: "yes_no",
    description: "Do you declare today to be Market Day? If so, every player must send 1 champion to the trader or pay 1 gold in tax.",
    options: [
      { name: "yes", displayName: "Yes, today is Market Day" },
      { name: "no", displayName: "No, not today" }
    ]
  };

  try {
    const decision = await currentPlayerAgent.makeDecision(gameState, [], marketDayDecision, thinkingLogger);

    if (decision.choice.name === "no") {
      logFn("event", `${currentPlayer.name} decided today is not Market Day. Event ends.`);
      return {
        eventProcessed: true
      };
    }

    logFn("event", `${currentPlayer.name} declared today is Market Day! All players must send 1 champion to a trader or pay 1 gold.`);

    // Find all trader tiles
    const traderTiles = gameState.board.findTiles(tile => tile.tileType === "trader");
    if (traderTiles.length === 0) {
      logFn("event", "No trader tiles found on the board!");
      return {
        eventProcessed: false,
        errorMessage: "No trader tiles available"
      };
    }

    const playersAffected: string[] = [];
    const resourcesChanged: Record<string, { gold?: number }> = {};

    // Prepare all player decisions to process in parallel
    const playerDecisionPromises: Promise<void>[] = [];

    for (const player of gameState.players) {
      // Find champions not already at trader tiles
      const availableChampions = player.champions.filter(champion => {
        const currentTile = gameState.getTile(champion.position);
        return currentTile && currentTile.tileType !== "trader";
      });

      // If all champions are already at trader tiles, player doesn't need to do anything
      if (availableChampions.length === 0 && player.champions.length > 0) {
        logFn("event", `${player.name} already has all champions at trader tiles, no action needed.`);
        continue;
      }

      // Build decision options
      const options = [];

      // Add champion options
      for (const champion of availableChampions) {
        options.push({
          name: `champion-${champion.id}`,
          displayName: `Send Champion ${champion.id} to trader`
        });
      }

      // Add pay gold option if player has gold
      if (player.resources.gold >= 1) {
        options.push({
          name: "pay-gold",
          displayName: "Pay 1 gold in tax"
        });
      }

      // Handle the decision
      if (options.length === 0) {
        logFn("event", `${player.name} has no champions available and no gold. Cannot comply with Market Day.`);
        continue;
      } else if (options.length === 1) {
        // Auto-choose the only option
        const onlyOption = options[0];
        if (onlyOption.name === "pay-gold") {
          player.resources.gold = Math.max(0, player.resources.gold - 1);
          logFn("event", `${player.name} automatically pays 1 gold in tax (only option available)`);
          playersAffected.push(player.name);
          resourcesChanged[player.name] = { gold: -1 };
        } else {
          const championId = parseInt(onlyOption.name.split('-')[1]);
          const champion = player.champions.find(c => c.id === championId);
          if (champion) {
            // Move champion to the nearest trader
            const nearestTrader = traderTiles[0]; // For simplicity, use first trader
            champion.position = { ...nearestTrader.position };
            logFn("event", `${player.name} automatically sends Champion ${championId} to trader at (${nearestTrader.position.row}, ${nearestTrader.position.col}) (only option available)`);
            playersAffected.push(player.name);
          }
        }
      } else {
        // Get the player's agent so they can decide for themselves
        const playerAgent = getPlayerAgent ? getPlayerAgent(player.name) : undefined;

        if (!playerAgent) {
          logFn("event", `Warning: No agent found for player ${player.name}, skipping Market Day decision`);
          continue;
        }

        // Add this player's decision to the parallel processing array
        const playerDecisionPromise = (async () => {
          // Ask the player to choose for themselves
          const playerDecision: DecisionContext = {
            type: "market_day_choice",
            description: `Market Day: You must send 1 champion to a trader or pay 1 gold in tax.`,
            options: options
          };

          try {
            const decision = await playerAgent.makeDecision(gameState, [], playerDecision, thinkingLogger);

            if (decision.choice.name === "pay-gold") {
              player.resources.gold = Math.max(0, player.resources.gold - 1);
              logFn("event", `${player.name} pays 1 gold in tax`);
              playersAffected.push(player.name);
              resourcesChanged[player.name] = { gold: -1 };
            } else if (decision.choice.name.startsWith("champion-")) {
              const championId = parseInt(decision.choice.name.split('-')[1]);
              const champion = player.champions.find(c => c.id === championId);
              if (champion) {
                // Move champion to the nearest trader tile
                const nearestTrader = traderTiles[0]; // For simplicity, use first trader
                champion.position = { ...nearestTrader.position };
                logFn("event", `${player.name} sends Champion ${championId} to trader at (${nearestTrader.position.row}, ${nearestTrader.position.col})`);
                playersAffected.push(player.name);
              }
            }
          } catch (error) {
            logFn("event", `Error getting Market Day decision from ${player.name}: ${error}`);
          }
        })();

        playerDecisionPromises.push(playerDecisionPromise);
      }
    }

    // Wait for all player decisions to complete in parallel
    if (playerDecisionPromises.length > 0) {
      await Promise.all(playerDecisionPromises);
    }

    return {
      eventProcessed: true,
      playersAffected,
      resourcesChanged
    };

  } catch (error) {
    const errorMessage = `Error processing Market Day decision: ${error}`;
    logFn("event", errorMessage);
    return {
      eventProcessed: false,
      errorMessage
    };
  }
} 