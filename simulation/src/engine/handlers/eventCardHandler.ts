import { getMonsterCardById } from "@/content/monsterCards";
import { GameState } from "@/game/GameState";
import { DecisionContext, GameLogEntry, Monster, OceanPosition, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";
import { resolveImmediateCombat } from "./combatHandler";

export interface EventCardResult {
  eventProcessed: boolean;
  playersAffected?: string[];
  resourcesChanged?: Record<string, { food?: number; wood?: number; ore?: number; gold?: number }>;
  boatsMoved?: boolean;
  oasisTokensAdded?: number;
  errorMessage?: string;
}

/**
 * Handle the Sudden Storm event card
 */
export function handleSuddenStorm(
  gameState: GameState,
  logFn: (type: string, content: string) => void
): EventCardResult {
  logFn("event", "Sudden Storm! All boats move into an adjacent sea. All oases gain +1 mystery card.");

  // Move all boats to adjacent ocean positions
  const movedBoats: string[] = [];
  for (const player of gameState.players) {
    for (const boat of player.boats) {
      const originalPosition = boat.position; // Store original position
      const newPosition = getAdjacentOceanPosition(boat.position);
      boat.position = newPosition;

      // Determine boat identifier for logging
      const boatIdentifier = player.boats.length > 1 ? ` ${boat.id}` : '';
      const logMessage = `${player.name}'s boat${boatIdentifier} moved from ${originalPosition} to ${newPosition}`;

      movedBoats.push(logMessage);
      logFn("event", logMessage);
    }
  }

  // Add +1 adventure token to all oasis tiles
  let oasisCount = 0;
  gameState.board.forEachTile((tile) => {
    if (tile.tileType === "oasis") {
      tile.adventureTokens = (tile.adventureTokens || 0) + 1;
      oasisCount++;
    }
  });

  if (oasisCount > 0) {
    logFn("event", `All ${oasisCount} oasis tiles gained +1 mystery card`);
  }

  return {
    eventProcessed: true,
    boatsMoved: true,
    oasisTokensAdded: oasisCount
  };
}

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

/**
 * Main event card handler dispatcher
 */
export async function handleEventCard(
  cardId: string,
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  gameLog: readonly GameLogEntry[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  getPlayerAgent?: (playerName: string) => PlayerAgent | undefined
): Promise<EventCardResult> {
  if (cardId === "sudden-storm") {
    return handleSuddenStorm(gameState, logFn);
  } else if (cardId === "hungry-pests") {
    return await handleHungryPests(gameState, player, playerAgent, logFn, thinkingLogger);
  } else if (cardId === "market-day") {
    return await handleMarketDay(gameState, player, playerAgent, logFn, thinkingLogger, getPlayerAgent);
  } else if (cardId === "thug-ambush") {
    return await handleThugAmbush(gameState, player, championId, logFn);
  } else {
    // Other event cards not yet implemented
    const message = `Event card ${cardId} drawn, but not yet implemented`;
    logFn("event", message);
    return {
      eventProcessed: false,
      errorMessage: `Event card ${cardId} not implemented`
    };
  }
}

/**
 * Get an adjacent ocean position for sudden storm event
 */
function getAdjacentOceanPosition(currentPosition: OceanPosition): OceanPosition {
  const adjacencyMap: Record<OceanPosition, OceanPosition[]> = {
    "nw": ["ne", "sw"],
    "ne": ["nw", "se"],
    "sw": ["nw", "se"],
    "se": ["ne", "sw"]
  };

  const adjacentPositions = adjacencyMap[currentPosition];
  const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
  return adjacentPositions[randomIndex];
}

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Handle the Thug Ambush event card
 */
export async function handleThugAmbush(
  gameState: GameState,
  currentPlayer: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): Promise<EventCardResult> {
  logFn("event", "Thug Ambush! Rolling for outcome...");

  const roll = rollD3();
  logFn("event", `Rolled ${roll}`);

  const champion = gameState.getChampion(currentPlayer.name, championId);
  if (!champion) {
    return {
      eventProcessed: false,
      errorMessage: `Champion ${championId} not found for ${currentPlayer.name}`
    };
  }

  switch (roll) {
    case 1:
      // They steal 1 gold (if you have any)
      if (currentPlayer.resources.gold > 0) {
        currentPlayer.resources.gold -= 1;
        logFn("event", `Thugs steal 1 gold from ${currentPlayer.name}`);
        return {
          eventProcessed: true,
          playersAffected: [currentPlayer.name],
          resourcesChanged: {
            [currentPlayer.name]: { gold: -1 }
          }
        };
      } else {
        logFn("event", `Thugs try to steal gold from ${currentPlayer.name}, but they have none`);
        return {
          eventProcessed: true,
          playersAffected: [currentPlayer.name]
        };
      }

    case 2:
      // Fight bandit might 3, if you win, gain 1 fame and 2 gold
      const banditCard = getMonsterCardById("bandit");
      if (!banditCard) {
        return {
          eventProcessed: false,
          errorMessage: "Bandit monster card not found"
        };
      }

      // Create a bandit monster for immediate combat
      const bandit: Monster = {
        id: banditCard.id,
        name: banditCard.name,
        tier: banditCard.tier,
        icon: banditCard.icon,
        might: banditCard.might,
        fame: banditCard.fame,
        isBeast: banditCard.isBeast,
        resources: {
          food: banditCard.resources.food || 0,
          wood: banditCard.resources.wood || 0,
          ore: banditCard.resources.ore || 0,
          gold: banditCard.resources.gold || 0,
        },
      };

      logFn("event", `${currentPlayer.name}'s Champion ${championId} must fight a bandit!`);

      // Use immediate combat without placing the monster on the board
      const combatResult = await resolveImmediateCombat(
        gameState,
        bandit,
        currentPlayer,
        championId,
        champion.position,
        logFn
      );

      if (combatResult.victory) {
        return {
          eventProcessed: true,
          playersAffected: [currentPlayer.name],
          resourcesChanged: {
            [currentPlayer.name]: { gold: 2 }
          }
        };
      } else {
        return {
          eventProcessed: true,
          playersAffected: [currentPlayer.name]
        };
      }

    case 3:
      // You scare them off and gain 1 fame
      currentPlayer.fame += 1;
      logFn("event", `${currentPlayer.name} scares off the thugs and gains 1 fame`);
      return {
        eventProcessed: true,
        playersAffected: [currentPlayer.name]
      };

    default:
      return {
        eventProcessed: false,
        errorMessage: `Unexpected roll result: ${roll}`
      };
  }
} 