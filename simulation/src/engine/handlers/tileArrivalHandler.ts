import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { NON_COMBAT_TILES, Player, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import { resolveChampionBattle, resolveDragonBattle, resolveMonsterBattle } from "../actions/battleCalculator";

export interface ExplorationResult {
  wasExplored: boolean;
  fameAwarded: number;
}

export interface ChampionCombatResult {
  combatOccurred: boolean;
  attackerWon?: boolean;
  defendingChampionDefeated?: {
    playerName: string;
    championId: number;
    healingCost: "gold" | "fame";
  };
  fameAwarded?: number;
  combatDetails?: string;
}

export interface MonsterCombatResult {
  combatOccurred: boolean;
  championWon?: boolean;
  championDefeated?: {
    healingCost: "gold" | "fame";
  };
  monsterDefeated?: {
    fameAwarded: number;
    resourcesAwarded: {
      food: number;
      wood: number;
      ore: number;
      gold: number;
    };
  };
  combatDetails?: string;
}

export interface DoomspireResult {
  entered: boolean;
  alternativeVictory?: {
    type: "Fame Victory" | "Gold Victory" | "Economic Victory";
    playerName: string;
  };
  dragonCombat?: {
    championWon: boolean;
    championDefeated?: {
      healingCost: "gold" | "fame";
    };
    combatVictory?: {
      playerName: string;
    };
    combatDetails: string;
  };
}

export interface TileClaimingResult {
  claimRequested: boolean;
  claimSuccessful?: boolean;
  reason?: string;
}

export interface SpecialTileResult {
  interactionOccurred: boolean;
  adventureCardDrawn?: boolean;
  tokensRemaining?: number;
}

/**
 * Handle tile exploration when a champion arrives at an unexplored tile
 */
export function handleExploration(
  gameState: GameState,
  tile: Tile,
  player: Player,
  logFn: (type: string, content: string) => void
): ExplorationResult {
  if (tile.explored) {
    return { wasExplored: true, fameAwarded: 0 };
  }

  // Mark tile as explored
  tile.explored = true;

  // Mark tile group as explored if it has one
  if (tile.tileGroup) {
    gameState.board.setTileGroupToExplored(tile.tileGroup);
  }

  // Award fame for exploration
  const fameAwarded = GameSettings.FAME_AWARD_FOR_EXPLORATION;
  player.fame += fameAwarded;

  logFn("exploration", `Explored new territory and got ${fameAwarded} fame`);

  return { wasExplored: false, fameAwarded };
}

/**
 * Handle combat with opposing champions on the tile
 */
export function handleChampionCombat(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): ChampionCombatResult {
  const opposingChampions = gameState.getOpposingChampionsAtPosition(player.name, tile.position);

  // No combat if no opposing champions or on non-combat tiles
  if (opposingChampions.length === 0 || (tile.tileType && NON_COMBAT_TILES.includes(tile.tileType))) {
    return { combatOccurred: false };
  }

  const opposingChampion = opposingChampions[0];
  const opposingPlayer = gameState.getPlayer(opposingChampion.playerName);
  if (!opposingPlayer) {
    throw new Error(`Opposing player ${opposingChampion.playerName} not found`);
  }

  const combatResult = resolveChampionBattle(player.might, opposingPlayer.might);

  if (combatResult.attackerWins) {
    // Attacker won, award fame and send defending champion home
    player.fame += 1;

    // Send defending champion home
    opposingChampion.position = opposingPlayer.homePosition;

    // Determine healing cost for defender
    const healingCost = opposingPlayer.resources.gold > 0 ? "gold" : "fame";
    if (healingCost === "gold") {
      opposingPlayer.resources.gold -= 1;
    } else {
      opposingPlayer.fame = Math.max(0, opposingPlayer.fame - 1);
    }

    const healingText = healingCost === "gold" ? "paid 1 gold to heal" : "had no gold to heal so lost 1 fame";
    const combatDetails = `Defeated ${opposingChampion.playerName}'s champion (${combatResult.attackerTotal} vs ${combatResult.defenderTotal}), who went home and ${healingText}`;

    logFn("combat", combatDetails);

    return {
      combatOccurred: true,
      attackerWon: true,
      defendingChampionDefeated: {
        playerName: opposingChampion.playerName,
        championId: opposingChampion.id,
        healingCost: healingCost as "gold" | "fame"
      },
      fameAwarded: 1,
      combatDetails
    };
  } else {
    // Attacker lost - this will be handled by the caller (send champion home)
    const combatDetails = `was defeated by ${opposingChampion.playerName}'s champion (${combatResult.attackerTotal} vs ${combatResult.defenderTotal})`;

    return {
      combatOccurred: true,
      attackerWon: false,
      combatDetails
    };
  }
}

/**
 * Handle combat with monsters on the tile
 */
export function handleMonsterCombat(
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): MonsterCombatResult {
  if (!tile.monster) {
    return { combatOccurred: false };
  }

  const monster = tile.monster;
  const combatResult = resolveMonsterBattle(player.might, monster.might);

  if (combatResult.championWins) {
    // Champion won - award fame and resources, remove monster
    const fameAwarded = monster.fame || 0;
    player.fame += fameAwarded;
    player.resources.food += monster.resources.food;
    player.resources.wood += monster.resources.wood;
    player.resources.ore += monster.resources.ore;
    player.resources.gold += monster.resources.gold;

    // Remove monster from tile
    tile.monster = undefined;

    const combatDetails = `Defeated ${monster.name} (${combatResult.championTotal} vs ${combatResult.monsterTotal}), gained ${fameAwarded} fame and got ${formatResources(monster.resources)}`;
    logFn("combat", combatDetails);

    return {
      combatOccurred: true,
      championWon: true,
      monsterDefeated: {
        fameAwarded,
        resourcesAwarded: monster.resources
      },
      combatDetails
    };
  } else {
    // Champion lost - monster stays on tile
    const combatDetails = `Fought ${monster.name}, but was defeated (${combatResult.championTotal} vs ${combatResult.monsterTotal})`;

    return {
      combatOccurred: true,
      championWon: false,
      championDefeated: {
        healingCost: player.resources.gold > 0 ? "gold" : "fame"
      },
      combatDetails
    };
  }
}

/**
 * Handle arrival at the Doomspire tile (dragon combat and victory conditions)
 */
export function handleDoomspireTile(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): DoomspireResult {
  if (tile.tileType !== "doomspire") {
    return { entered: false };
  }

  // Check alternative victory conditions first
  if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
    logFn("victory", `Fame Victory! ${player.name} reached ${GameSettings.VICTORY_FAME_THRESHOLD} fame and recruited the dragon with fame!`);
    return {
      entered: true,
      alternativeVictory: {
        type: "Fame Victory",
        playerName: player.name
      }
    };
  }

  if (player.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
    logFn("victory", `Gold Victory! ${player.name} reached ${GameSettings.VICTORY_GOLD_THRESHOLD} gold and bribed the dragon with gold!`);
    return {
      entered: true,
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
      entered: true,
      alternativeVictory: {
        type: "Economic Victory",
        playerName: player.name
      }
    };
  }

  // Must fight the dragon
  const dragonResult = resolveDragonBattle(player.might);

  if (!dragonResult.championWins) {
    // Champion was defeated by dragon
    const combatDetails = `was eaten by the dragon (${dragonResult.championTotal} vs ${dragonResult.dragonMight})! Actually, that's not implemented yet, so champion is just sent home.`;

    return {
      entered: true,
      dragonCombat: {
        championWon: false,
        championDefeated: {
          healingCost: player.resources.gold > 0 ? "gold" : "fame"
        },
        combatDetails
      }
    };
  } else {
    // Champion won - COMBAT VICTORY!
    const combatDetails = `Combat Victory! ${player.name} defeated the dragon (${dragonResult.championTotal} vs ${dragonResult.dragonMight})!`;
    logFn("victory", combatDetails);

    return {
      entered: true,
      dragonCombat: {
        championWon: true,
        combatVictory: {
          playerName: player.name
        },
        combatDetails
      }
    };
  }
}

/**
 * Handle claiming of resource tiles
 */
export function handleTileClaiming(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  claimTile: boolean,
  logFn: (type: string, content: string) => void
): TileClaimingResult {
  if (!claimTile) {
    return { claimRequested: false };
  }

  if (tile.tileType !== "resource") {
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Only resource tiles can be claimed"
    };
  }

  if (tile.claimedBy !== undefined) {
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Tile is already claimed"
    };
  }

  const currentClaimedCount = gameState.board.findTiles((tile) => tile.claimedBy === player.name).length;

  if (currentClaimedCount >= player.maxClaims) {
    logFn("event", `Champion${championId} could not claim resource tile (${tile.position.row}, ${tile.position.col}) (max claims reached)`);
    return {
      claimRequested: true,
      claimSuccessful: false,
      reason: "Max claims reached"
    };
  }

  // Successful claim
  tile.claimedBy = player.name;
  logFn("event", `Champion${championId} claimed resource tile (${tile.position.row}, ${tile.position.col}), which gives ${formatResources(tile.resources)}`);

  return {
    claimRequested: true,
    claimSuccessful: true
  };
}

/**
 * Handle special tiles (adventure/oasis) that provide cards
 */
export function handleSpecialTiles(
  tile: Tile,
  championId: number,
  logFn: (type: string, content: string) => void
): SpecialTileResult {
  if ((tile.tileType !== "adventure" && tile.tileType !== "oasis") ||
    !tile.adventureTokens || tile.adventureTokens <= 0) {
    return { interactionOccurred: false };
  }

  // Remove one adventure token
  tile.adventureTokens = Math.max(0, tile.adventureTokens - 1);

  return {
    interactionOccurred: true,
    adventureCardDrawn: true,
    tokensRemaining: tile.adventureTokens
  };
} 