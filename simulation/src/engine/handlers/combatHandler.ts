import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { Monster, NON_COMBAT_TILES, Player, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

export interface CombatResult {
  combatOccurred: boolean;
  victory?: CombatVictory;
  defeat?: CombatDefeat;
  combatDetails?: string;
}

export interface CombatVictory {
  type: "champion" | "monster" | "dragon";
  fameAwarded?: number;
  resourcesAwarded?: {
    food: number;
    wood: number;
    ore: number;
    gold: number;
  };
  opponentEffects?: {
    playerName: string;
    championSentHome: boolean;
    healingCost: "gold" | "fame";
  };
}

export interface CombatDefeat {
  championId: number;
  healingCost: "gold" | "fame";
  championSentHome: boolean;
}

export interface DragonEncounterResult {
  encounterOccurred: boolean;
  alternativeVictory?: {
    type: "Fame Victory" | "Gold Victory" | "Economic Victory";
    playerName: string;
  };
  combatResult?: CombatResult;
}

/**
 * Handle champion vs champion combat
 */
export function resolveChampionVsChampionCombat(
  gameState: GameState,
  tile: Tile,
  attackingPlayer: Player,
  attackingChampionId: number,
  logFn: (type: string, content: string) => void
): CombatResult {
  const opposingChampions = gameState.getOpposingChampionsAtPosition(attackingPlayer.name, tile.position);

  // No combat if no opposing champions or on non-combat tiles
  if (opposingChampions.length === 0 || (tile.tileType && NON_COMBAT_TILES.includes(tile.tileType))) {
    return { combatOccurred: false };
  }

  const opposingChampion = opposingChampions[0];
  const defendingPlayer = gameState.getPlayer(opposingChampion.playerName);
  if (!defendingPlayer) {
    throw new Error(`Opposing player ${opposingChampion.playerName} not found`);
  }

  // Roll dice for champion vs champion battle - keep rerolling on ties
  let attackerRoll: number;
  let defenderRoll: number;
  let attackerTotal: number;
  let defenderTotal: number;

  do {
    attackerRoll = rollD3();
    defenderRoll = rollD3();
    attackerTotal = attackingPlayer.might + attackerRoll;
    defenderTotal = defendingPlayer.might + defenderRoll;
  } while (attackerTotal === defenderTotal); // Keep rerolling on ties

  const attackerWins = attackerTotal > defenderTotal;

  if (attackerWins) {
    // Attacker won - award fame and handle defender defeat
    const healingCost = defendingPlayer.resources.gold > 0 ? "gold" : "fame";

    // Apply effects
    attackingPlayer.fame += 1;
    opposingChampion.position = defendingPlayer.homePosition;

    if (healingCost === "gold") {
      defendingPlayer.resources.gold -= 1;
    } else {
      defendingPlayer.fame = Math.max(0, defendingPlayer.fame - 1);
    }

    const healingText = healingCost === "gold" ? "paid 1 gold to heal" : "had no gold to heal so lost 1 fame";
    const fullCombatDetails = `Defeated ${defendingPlayer.name}'s champion (${attackerTotal} vs ${defenderTotal}), who went home and ${healingText}`;

    logFn("combat", fullCombatDetails);

    return {
      combatOccurred: true,
      victory: {
        type: "champion",
        fameAwarded: 1,
        opponentEffects: {
          playerName: defendingPlayer.name,
          championSentHome: true,
          healingCost: healingCost as "gold" | "fame"
        }
      },
      combatDetails: fullCombatDetails
    };
  } else {
    // Attacker lost - apply defeat effects immediately
    const fullCombatDetails = `was defeated by ${defendingPlayer.name}'s champion (${attackerTotal} vs ${defenderTotal})`;

    // Apply defeat effects internally
    applyChampionDefeat(gameState, attackingPlayer, attackingChampionId, fullCombatDetails, logFn);

    return {
      combatOccurred: true,
      defeat: {
        championId: attackingChampionId,
        healingCost: attackingPlayer.resources.gold > 0 ? "gold" : "fame",
        championSentHome: true
      },
      combatDetails: fullCombatDetails
    };
  }
}

/**
 * Handle champion vs monster combat
 */
export function resolveChampionVsMonsterCombat(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): CombatResult {
  if (!tile.monster) {
    return { combatOccurred: false };
  }

  const monster = tile.monster;

  // Roll dice for champion vs monster battle
  const championRoll = rollD3();
  const championTotal = player.might + championRoll;
  const championWins = championTotal >= monster.might;

  if (championWins) {
    // Champion won - award fame and resources, remove monster
    const fameAwarded = monster.fame || 0;
    player.fame += fameAwarded;
    player.resources.food += monster.resources.food;
    player.resources.wood += monster.resources.wood;
    player.resources.ore += monster.resources.ore;
    player.resources.gold += monster.resources.gold;

    // Remove monster from tile
    tile.monster = undefined;

    const combatDetails = `Defeated ${monster.name} (${championTotal} vs ${monster.might}), gained ${fameAwarded} fame and got ${formatResources(monster.resources)}`;
    logFn("combat", combatDetails);

    return {
      combatOccurred: true,
      victory: {
        type: "monster",
        fameAwarded,
        resourcesAwarded: monster.resources
      },
      combatDetails
    };
  } else {
    // Champion lost - monster stays on tile, apply defeat effects immediately
    const combatDetails = `Fought ${monster.name}, but was defeated (${championTotal} vs ${monster.might})`;

    // Apply defeat effects internally
    applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

    return {
      combatOccurred: true,
      defeat: {
        championId,
        healingCost: player.resources.gold > 0 ? "gold" : "fame",
        championSentHome: true
      },
      combatDetails
    };
  }
}

/**
 * Handle champion vs dragon encounter (including alternative victories)
 */
export function resolveChampionVsDragonEncounter(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): DragonEncounterResult {
  if (tile.tileType !== "doomspire") {
    return { encounterOccurred: false };
  }

  // Check alternative victory conditions first
  if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
    logFn("victory", `Fame Victory! ${player.name} reached ${GameSettings.VICTORY_FAME_THRESHOLD} fame and recruited the dragon with fame!`);
    return {
      encounterOccurred: true,
      alternativeVictory: {
        type: "Fame Victory",
        playerName: player.name
      }
    };
  }

  if (player.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
    logFn("victory", `Gold Victory! ${player.name} reached ${GameSettings.VICTORY_GOLD_THRESHOLD} gold and bribed the dragon with gold!`);
    return {
      encounterOccurred: true,
      alternativeVictory: {
        type: "Gold Victory",
        playerName: player.name
      }
    };
  }

  const starredTileCount = gameState.getStarredTileCount(player.name);
  if (starredTileCount >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
    logFn("victory", `Economic Victory! ${player.name} reached ${GameSettings.VICTORY_STARRED_TILES_THRESHOLD} starred tiles and impressed the dragon with their economic prowess!`);
    return {
      encounterOccurred: true,
      alternativeVictory: {
        type: "Economic Victory",
        playerName: player.name
      }
    };
  }

  // Must fight the dragon - roll dice for champion vs dragon battle
  const dragonMight = GameSettings.DRAGON_BASE_MIGHT + rollD3();
  const championRoll = rollD3();
  const championTotal = player.might + championRoll;
  const championWins = championTotal >= dragonMight;

  if (!championWins) {
    // Champion was defeated by dragon - apply defeat effects immediately
    const combatDetails = `was eaten by the dragon (${championTotal} vs ${dragonMight})! Actually, that's not implemented yet, so champion is just sent home.`;

    // Apply defeat effects internally
    applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

    return {
      encounterOccurred: true,
      combatResult: {
        combatOccurred: true,
        defeat: {
          championId,
          healingCost: player.resources.gold > 0 ? "gold" : "fame",
          championSentHome: true
        },
        combatDetails
      }
    };
  } else {
    // Champion won - COMBAT VICTORY!
    const combatDetails = `Combat Victory! ${player.name} defeated the dragon (${championTotal} vs ${dragonMight})!`;
    logFn("victory", combatDetails);

    return {
      encounterOccurred: true,
      combatResult: {
        combatOccurred: true,
        victory: {
          type: "dragon",
          fameAwarded: 0 // Dragon victory doesn't award fame, it wins the game
        },
        combatDetails
      }
    };
  }
}

/**
 * Handle champion defeat effects (send home and pay healing costs)
 */
export function applyChampionDefeat(
  gameState: GameState,
  player: Player,
  championId: number,
  defeatContext: string,
  logFn: (type: string, content: string) => void
): void {
  // Send champion home
  gameState.moveChampionToHome(player.name, championId);

  // Pay healing cost
  if (player.resources.gold > 0) {
    player.resources.gold -= 1;
    logFn("combat", `${defeatContext}, went home, paid 1 gold to heal`);
  } else {
    player.fame = Math.max(0, player.fame - 1);
    logFn("combat", `${defeatContext}, went home, had no gold to heal so lost 1 fame`);
  }
}

/**
 * Handle monster placement and immediate combat (used for adventure cards)
 */
export function resolveMonsterPlacementAndCombat(
  gameState: GameState,
  monster: Monster,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): CombatResult {
  // Place monster on tile
  tile.monster = monster;
  logFn("event", `Champion${championId} drew monster card: ${monster.name}!`);

  // Immediately resolve combat using the regular monster combat function
  return resolveChampionVsMonsterCombat(gameState, tile, player, championId, logFn);
} 