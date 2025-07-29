import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { CarriableItem, Champion, Decision, DecisionContext, DecisionOption, GameLogEntry, Monster, NON_COMBAT_TILES, Player, ResourceType, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import { PlayerAgent } from "@/players/PlayerAgent";
import { handleBackpackEffect } from "./backpackHandler";
import { handlePaddedHelmetRespawn } from "./paddedHelmetHandler";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Calculate item bonuses and effects for combat
 */
function calculateItemEffects(champion: Champion | undefined, logFn: (type: string, content: string) => void, playerMight?: number, opponentMight?: number, isDragonFight?: boolean): { mightBonus: number; itemsToRemove: CarriableItem[] } {
  let mightBonus = 0;
  let itemsToRemove: CarriableItem[] = [];

  if (!champion) {
    return { mightBonus, itemsToRemove };
  }

  for (const item of champion.items) {
    // Check for general combat bonus first
    if (item.combatBonus) {
      mightBonus += item.combatBonus;
      const itemName = item.treasureCard?.name || item.traderItem?.name || 'Unknown Item';
      logFn("combat", `${itemName} provides +${item.combatBonus} might`);
    }

    // Check for spear bonus against beasts (trader item specific logic)
    if (item.traderItem?.id === "spear") {
      mightBonus += 1;
      logFn("combat", `Spear provides +1 might`);
    }

    // Check for rusty sword (breaks after one fight)
    if (item.treasureCard?.id === "rusty-sword") {
      mightBonus += 2;
      itemsToRemove.push(item);
      logFn("combat", `Rusty sword provides +2 might but breaks after this fight`);
    }

    // Check for long sword (doesn't break)
    if (item.treasureCard?.id === "long-sword") {
      mightBonus += 2;
      logFn("combat", `Löng Swörd provides +2 might`);
    }

    // Check for porcupine (conditional bonus if opponent has more might)
    if (item.treasureCard?.id === "porcupine" && opponentMight !== undefined && playerMight !== undefined && opponentMight > playerMight) {
      mightBonus += 2;
      logFn("combat", `Porcupine shield provides +2 might (opponent has more base might)`);
    }

    // Check for mysterious ring with dragon slaying power
    if (item.treasureCard?.id === "dragonsbane-ring") {
      if (isDragonFight) {
        mightBonus += 3;
        logFn("combat", `Dragonsbane ring provides +3 might against the dragon!`);
      } else {
        logFn("combat", `Dragonsbane ring detected - bonus only applies against dragons`);
      }
    }
  }

  return { mightBonus, itemsToRemove };
}

/**
 * Remove items that break after combat
 */
function removeBrokenItems(champion: Champion | undefined, itemsToRemove: CarriableItem[], logFn: (type: string, content: string) => void, championDescription: string = "champion"): void {
  if (itemsToRemove.length > 0 && champion) {
    for (const itemToRemove of itemsToRemove) {
      const itemIndex = champion.items.indexOf(itemToRemove);
      if (itemIndex > -1) {
        champion.items.splice(itemIndex, 1);
        logFn("combat", `${itemToRemove.treasureCard?.name || itemToRemove.traderItem?.name} broke and was removed from ${championDescription}'s inventory`);
      }
    }
  }
}

export interface CombatResult {
  combatOccurred: boolean;
  victory?: boolean;
  defeat?: boolean;
  combatDetails?: string;
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
 * Generate loot options for champion vs champion combat victory
 */
function generateChampionLootOptions(
  defeatedPlayer: Player,
  defeatedChampion: Champion,
  winningChampion: Champion
): DecisionOption[] {
  const options: DecisionOption[] = [];

  // Add resource options (only for resources the defeated player actually has)
  const resourceTypes: Array<{ type: "food" | "wood" | "ore" | "gold"; name: string }> = [
    { type: "food", name: "Food" },
    { type: "wood", name: "Wood" },
    { type: "ore", name: "Ore" },
    { type: "gold", name: "Gold" }
  ];

  for (const { type, name } of resourceTypes) {
    if (defeatedPlayer.resources[type] > 0) {
      options.push({
        id: `resource_${type}`,
        description: `1 ${name} (player has ${defeatedPlayer.resources[type]})`
      });
    }
  }

  // Add item options (only if the winning champion has room for more items and items aren't stuck)
  if (winningChampion.items.length < 2) {
    defeatedChampion.items.forEach((item: any, index: number) => {
      // Skip stuck items - they cannot be looted
      if (item.stuck) {
        return;
      }

      let itemName = "Unknown Item";
      if (item.treasureCard) {
        itemName = item.treasureCard.name;
      } else if (item.traderItem) {
        itemName = item.traderItem.name;
      }

      options.push({
        id: `item_${index}`,
        description: `${itemName} (item)`
      });
    });
  }

  return options;
}

/**
 * Apply champion loot decision by transferring resources or items
 */
function applyChampionLootDecision(
  winningPlayer: Player,
  winningChampion: Champion,
  defeatedPlayer: Player,
  defeatedChampion: Champion,
  lootDecision: Decision
): string {
  const choice = lootDecision.choice;

  if (choice.startsWith("resource_")) {
    const resourceType = choice.split("_")[1] as ResourceType;
    if (defeatedPlayer.resources[resourceType] > 0) {
      defeatedPlayer.resources[resourceType] -= 1;
      winningPlayer.resources[resourceType] += 1;
      return `looted 1 ${resourceType}`;
    } else {
      return `failed to loot ${resourceType} (defeated player has none)`;
    }
  } else if (choice.startsWith("item_")) {
    const itemIndex = parseInt(choice.split("_")[1]);
    if (itemIndex >= 0 && itemIndex < defeatedChampion.items.length) {
      const lootedItem = defeatedChampion.items[itemIndex];

      // Remove item from defeated champion
      defeatedChampion.items.splice(itemIndex, 1);

      // Add item to winning champion
      winningChampion.items.push(lootedItem);

      const itemName = lootedItem.treasureCard?.name || lootedItem.traderItem?.name || "Unknown Item";
      return `looted ${itemName}`;
    } else {
      return `failed to loot item (not found)`;
    }
  }

  return "no loot applied";
}

/**
 * Check if a player has a specific trader item
 */
function hasTraderItem(player: Player, itemId: string): boolean {
  return player.champions.some(champion =>
    champion.items.some(item => item.traderItem?.id === itemId)
  );
}

/**
 * Handle champion vs champion combat
 */
export async function resolveChampionVsChampionCombat(
  gameState: GameState,
  tile: Tile,
  attackingPlayer: Player,
  attackingChampionId: number,
  playerAgent: PlayerAgent,
  gameLog: readonly GameLogEntry[],
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  getPlayerAgent?: (playerName: string) => PlayerAgent | undefined
): Promise<CombatResult> {
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

  // Get combat support for both players
  const attackerSupport = gameState.getCombatSupport(attackingPlayer.name, tile.position);
  const defenderSupport = gameState.getCombatSupport(defendingPlayer.name, tile.position);

  // Calculate item effects for both champions
  const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
  const { mightBonus: attackerMightBonus, itemsToRemove: attackerItemsToRemove } = calculateItemEffects(attackingChampion, logFn, attackingPlayer.might, defendingPlayer.might, false);
  const { mightBonus: defenderMightBonus, itemsToRemove: defenderItemsToRemove } = calculateItemEffects(opposingChampion, logFn, defendingPlayer.might, attackingPlayer.might, false);

  // Roll dice for champion vs champion battle - keep rerolling on ties
  let attackerRoll: number;
  let defenderRoll: number;
  let attackerTotal: number;
  let defenderTotal: number;

  do {
    attackerRoll = rollD3() + rollD3(); // Roll 2d3
    defenderRoll = rollD3() + rollD3(); // Roll 2d3
    attackerTotal = attackingPlayer.might + attackerRoll + attackerSupport + attackerMightBonus;
    defenderTotal = defendingPlayer.might + defenderRoll + defenderSupport + defenderMightBonus;
  } while (attackerTotal === defenderTotal); // Keep rerolling on ties

  const attackerWins = attackerTotal > defenderTotal;

  if (attackerWins) {
    // Attacker won - award fame and send defender home (no healing cost since they get looted)
    attackingPlayer.fame += 1;
    opposingChampion.position = defendingPlayer.homePosition;

    // Get the attacking champion to generate loot options
    const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
    if (!attackingChampion) {
      throw new Error(`Attacking champion ${attackingChampionId} not found`);
    }

    // Track loot information for the final message
    let lootInfo = "";

    // Check if the defending player has a backpack and any resources to steal
    const defendingPlayerHasBackpack = hasTraderItem(defendingPlayer, "backpack");
    const defendingPlayerHasResources = Object.values(defendingPlayer.resources).some(amount => amount > 0);
    const defendingPlayerHasItems = opposingChampion.items.length > 0;

    if (defendingPlayerHasBackpack && defendingPlayerHasResources) {
      // Backpack effect: defeated player (defender) chooses what resource to give
      // Get the defending player's agent if available
      const defendingPlayerAgent = getPlayerAgent ? getPlayerAgent(defendingPlayer.name) : undefined;

      const backpackResult = await handleBackpackEffect(
        gameState,
        attackingPlayer,
        attackingChampion,
        defendingPlayer,
        opposingChampion,
        defendingPlayerAgent,
        gameLog,
        logFn,
        thinkingLogger,
        defendingPlayerAgent !== undefined // Use player choice if we have their agent, otherwise random
      );

      if (backpackResult.lootApplied && backpackResult.lootDescription) {
        lootInfo = `, ${attackingPlayer.name} ${backpackResult.lootDescription} (backpack effect)`;
      } else {
        lootInfo = ", nothing to loot";
      }
    } else if (defendingPlayerHasResources || defendingPlayerHasItems) {
      // Normal combat victory: winner chooses what to loot
      const lootOptions = generateChampionLootOptions(defendingPlayer, opposingChampion, attackingChampion);

      // Handle loot decision if there are options available
      if (lootOptions.length === 0) {
        lootInfo = ", nothing to loot";
      } else if (lootOptions.length === 1) {
        // Only one option available, apply it automatically
        const automaticDecision: Decision = {
          choice: lootOptions[0].id,
          reasoning: "Only one loot option available, applied automatically"
        };
        const lootResult = applyChampionLootDecision(attackingPlayer, attackingChampion, defendingPlayer, opposingChampion, automaticDecision);
        lootInfo = `, ${attackingPlayer.name} ${lootResult}`;
      } else {
        // Multiple options available, ask the attacking player to decide
        const decisionContext: DecisionContext = {
          description: `Choose what to take from the defeated champion:`,
          options: lootOptions
        };

        // Ask attacking player to make loot decision
        const lootDecision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

        // Apply the loot decision
        const lootResult = applyChampionLootDecision(attackingPlayer, attackingChampion, defendingPlayer, opposingChampion, lootDecision);
        lootInfo = `, ${attackingPlayer.name} ${lootResult}`;
      }
    } else {
      lootInfo = ", nothing to loot";
    }

    const attackerBase = attackingPlayer.might + attackerRoll;
    const defenderBase = defendingPlayer.might + defenderRoll;
    const fullCombatDetails = `Defeated ${defendingPlayer.name}'s champion (${attackerBase}${attackerSupport > 0 ? `+${attackerSupport}` : ""} vs ${defenderBase}${defenderSupport > 0 ? `+${defenderSupport}` : ""}), who went home${lootInfo}`;

    logFn("combat", fullCombatDetails);

    // Remove items that break after combat
    removeBrokenItems(attackingChampion, attackerItemsToRemove, logFn, "attacker's");
    removeBrokenItems(opposingChampion, defenderItemsToRemove, logFn, "defender's");

    // Track combat statistics
    if (attackingPlayer.statistics) {
      attackingPlayer.statistics.championVsChampionWins += 1;
    }
    if (defendingPlayer.statistics) {
      defendingPlayer.statistics.championVsChampionLosses += 1;
    }

    return {
      combatOccurred: true,
      victory: true,
      combatDetails: fullCombatDetails
    };
  } else {
    // Attacker lost - apply defeat effects immediately
    let lootInfo = "";

    // Check if the attacking player has a backpack and any resources to steal
    const attackingPlayerHasBackpack = hasTraderItem(attackingPlayer, "backpack");
    const attackingPlayerHasResources = Object.values(attackingPlayer.resources).some(amount => amount > 0);
    const attackingPlayerHasItems = (gameState.getChampion(attackingPlayer.name, attackingChampionId)?.items.length ?? 0) > 0;

    if (attackingPlayerHasBackpack && attackingPlayerHasResources) {
      // Backpack effect: defeated player chooses what resource to give
      const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
      if (!attackingChampion) {
        throw new Error(`Attacking champion ${attackingChampionId} not found`);
      }

      const backpackResult = await handleBackpackEffect(
        gameState,
        defendingPlayer,
        opposingChampion,
        attackingPlayer,
        attackingChampion,
        playerAgent,
        gameLog,
        logFn,
        thinkingLogger,
        true // Defeated player (attacker) makes the choice
      );

      if (backpackResult.lootApplied && backpackResult.lootDescription) {
        lootInfo = `, ${defendingPlayer.name} ${backpackResult.lootDescription} (backpack effect)`;
      }
    } else if (attackingPlayerHasResources || attackingPlayerHasItems) {
      // Normal combat loss: defending player gets to choose what to steal (simulated by random choice for now)
      // TODO: Implement proper decision system for defending player
      const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
      if (attackingChampion) {
        const lootOptions = generateChampionLootOptions(attackingPlayer, attackingChampion, opposingChampion);

        if (lootOptions.length === 1) {
          // Only one option, apply it automatically
          const automaticDecision: Decision = {
            choice: lootOptions[0].id,
            reasoning: "Only one loot option available, applied automatically"
          };
          const lootResult = applyChampionLootDecision(defendingPlayer, opposingChampion, attackingPlayer, attackingChampion, automaticDecision);
          lootInfo = `, ${defendingPlayer.name} ${lootResult}`;
        } else if (lootOptions.length > 1) {
          // Multiple options: for now, randomly choose (TODO: implement proper decision system)
          const randomIndex = Math.floor(Math.random() * lootOptions.length);
          const randomDecision: Decision = {
            choice: lootOptions[randomIndex].id,
            reasoning: "Random choice by defending player (automatic)"
          };
          const lootResult = applyChampionLootDecision(defendingPlayer, opposingChampion, attackingPlayer, attackingChampion, randomDecision);
          lootInfo = `, ${defendingPlayer.name} ${lootResult}`;
        }
      }
    }

    const attackerBase = attackingPlayer.might + attackerRoll;
    const defenderBase = defendingPlayer.might + defenderRoll;
    const fullCombatDetails = `was defeated by ${defendingPlayer.name}'s champion (${attackerBase}${attackerSupport > 0 ? `+${attackerSupport}` : ""} vs ${defenderBase}${defenderSupport > 0 ? `+${defenderSupport}` : ""})${lootInfo}`;

    // Remove items that break after combat (even if defeated)
    removeBrokenItems(attackingChampion, attackerItemsToRemove, logFn, "attacker's");
    removeBrokenItems(opposingChampion, defenderItemsToRemove, logFn, "defender's");

    // Apply defeat effects for champion vs champion combat (no healing cost)
    await applyChampionDefeatInChampionCombat(gameState, attackingPlayer, attackingChampionId, fullCombatDetails, logFn, playerAgent, gameLog, thinkingLogger);

    // Track combat statistics
    if (defendingPlayer.statistics) {
      defendingPlayer.statistics.championVsChampionWins += 1;
    }
    if (attackingPlayer.statistics) {
      attackingPlayer.statistics.championVsChampionLosses += 1;
    }

    return {
      combatOccurred: true,
      defeat: true,
      combatDetails: fullCombatDetails
    };
  }
}

/**
 * Core champion vs monster combat logic (shared between immediate and tile-based combat)
 */
async function performChampionVsMonsterCombat(
  gameState: GameState,
  monster: Monster,
  player: Player,
  championId: number,
  position: { row: number; col: number },
  logFn: (type: string, content: string) => void
): Promise<{
  championWins: boolean;
  combatDetails: string;
  itemsToRemove: CarriableItem[];
}> {
  const champion = gameState.getChampion(player.name, championId);

  // Calculate item effects
  const { mightBonus, itemsToRemove } = calculateItemEffects(champion, logFn, player.might, monster.might, false);

  // Check for spear bonus against beasts
  const hasSpear = champion?.items.some(item => item.traderItem?.id === "spear") || false;
  const isFightingBeast = monster.isBeast || false;
  if (hasSpear && isFightingBeast) {
    logFn("combat", `Spear provides +1 might against ${monster.name} (beast)`);
  }

  // Get combat support from adjacent units
  const supportBonus = gameState.getCombatSupport(player.name, position);
  if (supportBonus > 0) {
    logFn("combat", `Combat support: +${supportBonus} might from adjacent units`);
  }

  // Roll dice for champion vs monster battle
  const championRoll = rollD3();
  const championTotal = player.might + championRoll + mightBonus + supportBonus;
  const championWins = championTotal >= monster.might;

  // Create combat details string (rewards will be added by calling function)
  const championBase = player.might + championRoll + mightBonus;
  const combatDetails = championWins
    ? `Defeated ${monster.name} (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${monster.might})`
    : `Fought ${monster.name}, but was defeated (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${monster.might})`;

  return { championWins, combatDetails, itemsToRemove };
}

/**
 * Handle immediate combat encounters without placing monsters on tiles (used for events)
 */
export async function resolveImmediateCombat(
  gameState: GameState,
  monster: Monster,
  player: Player,
  championId: number,
  position: { row: number; col: number },
  logFn: (type: string, content: string) => void
): Promise<CombatResult> {
  const champion = gameState.getChampion(player.name, championId);

  const { championWins, combatDetails, itemsToRemove } = await performChampionVsMonsterCombat(
    gameState, monster, player, championId, position, logFn
  );

  if (championWins) {
    // Champion won - award fame and resources (monster not placed on board)
    const fameAwarded = monster.fame || 0;
    player.fame += fameAwarded;
    player.resources.food += monster.resources.food;
    player.resources.wood += monster.resources.wood;
    player.resources.ore += monster.resources.ore;
    player.resources.gold += monster.resources.gold;

    const fullCombatDetails = `${combatDetails}, gained ${fameAwarded} fame and got ${formatResources(monster.resources)}`;
    logFn("combat", fullCombatDetails);

    // Remove items that break after combat
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Track combat statistics
    if (player.statistics) {
      player.statistics.championVsMonsterWins += 1;
    }

    return {
      combatOccurred: true,
      victory: true,
      combatDetails: fullCombatDetails
    };
  } else {
    // Champion lost - apply defeat effects immediately
    // Remove redundant log here since applyChampionDefeat will log the complete outcome
    // logFn("combat", combatDetails);

    // Remove items that break after combat (even if defeated)
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Apply defeat effects internally
    await applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

    // Track combat statistics
    if (player.statistics) {
      player.statistics.championVsMonsterLosses += 1;
    }

    return {
      combatOccurred: true,
      defeat: true,
      combatDetails
    };
  }
}

/**
 * Handle champion vs monster combat
 */
export async function resolveChampionVsMonsterCombat(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): Promise<CombatResult> {
  if (!tile.monster) {
    return { combatOccurred: false };
  }

  const monster = tile.monster;
  const champion = gameState.getChampion(player.name, championId);

  const { championWins, combatDetails, itemsToRemove } = await performChampionVsMonsterCombat(
    gameState, monster, player, championId, tile.position, logFn
  );

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

    const fullCombatDetails = `${combatDetails}, gained ${fameAwarded} fame and got ${formatResources(monster.resources)}`;
    logFn("combat", fullCombatDetails);

    // Remove items that break after combat
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Track combat statistics
    if (player.statistics) {
      player.statistics.championVsMonsterWins += 1;
    }

    return {
      combatOccurred: true,
      victory: true,
      combatDetails: fullCombatDetails
    };
  } else {
    // Champion lost - monster stays on tile, apply defeat effects immediately
    // Remove redundant log here since applyChampionDefeat will log the complete outcome
    // logFn("combat", combatDetails);

    // Remove items that break after combat (even if defeated)
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Apply defeat effects internally
    await applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

    // Track combat statistics
    if (player.statistics) {
      player.statistics.championVsMonsterLosses += 1;
    }

    return {
      combatOccurred: true,
      defeat: true,
      combatDetails
    };
  }
}

/**
 * Handle champion vs dragon encounter (including alternative victories)
 */
export async function resolveChampionVsDragonEncounter(
  gameState: GameState,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): Promise<DragonEncounterResult> {
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
  // Track dragon encounter statistics
  if (player.statistics) {
    player.statistics.dragonEncounters += 1;
  }

  const dragonMight = GameSettings.DRAGON_BASE_MIGHT + rollD3();

  // Get combat support from adjacent units
  const supportBonus = gameState.getCombatSupport(player.name, tile.position);
  if (supportBonus > 0) {
    logFn("combat", `Combat support: +${supportBonus} might from adjacent units`);
  }

  // Calculate item effects for dragon combat
  const champion = gameState.getChampion(player.name, championId);
  const { mightBonus, itemsToRemove } = calculateItemEffects(champion, logFn, player.might, dragonMight, true);

  const championRoll = rollD3();
  const championTotal = player.might + championRoll + supportBonus + mightBonus;
  const championWins = championTotal >= dragonMight;

  if (!championWins) {
    // Champion was defeated by dragon - apply defeat effects immediately
    const championBase = player.might + championRoll + mightBonus;
    const combatDetails = `was eaten by the dragon (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${dragonMight})! Actually, that's not implemented yet, so champion is just sent home.`;

    // Remove items that break after combat (even if defeated)
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Apply defeat effects internally
    await applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

    return {
      encounterOccurred: true,
      combatResult: {
        combatOccurred: true,
        defeat: true,
        combatDetails
      }
    };
  } else {
    // Champion won - COMBAT VICTORY!
    const championBase = player.might + championRoll + mightBonus;
    const combatDetails = `Combat Victory! ${player.name} defeated the dragon (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${dragonMight})!`;
    logFn("victory", combatDetails);

    // Remove items that break after combat
    removeBrokenItems(champion, itemsToRemove, logFn);

    return {
      encounterOccurred: true,
      combatResult: {
        combatOccurred: true,
        victory: true,
        combatDetails
      }
    };
  }
}

/**
 * Handle champion defeat effects (send home and pay healing costs)
 */
export async function applyChampionDefeat(
  gameState: GameState,
  player: Player,
  championId: number,
  defeatContext: string,
  logFn: (type: string, content: string) => void,
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<void> {
  // Check for padded helmet respawn
  const respawnPosition = await handlePaddedHelmetRespawn(
    gameState,
    player,
    championId,
    playerAgent,
    gameLog,
    logFn,
    thinkingLogger
  );

  if (respawnPosition) {
    // Padded helmet respawn - move champion to chosen tile
    const champion = gameState.getChampion(player.name, championId);
    if (champion) {
      champion.position = respawnPosition;
    }

    // Still pay healing cost
    await handleHealingCost(player, defeatContext, logFn, playerAgent, gameState, gameLog, thinkingLogger);
    return;
  }

  // Default behavior: send champion home
  gameState.moveChampionToHome(player.name, championId);

  // Pay healing cost
  await handleHealingCost(player, `${defeatContext}, went home`, logFn, playerAgent, gameState, gameLog, thinkingLogger);
}

/**
 * Handle the healing cost payment after champion defeat
 */
async function handleHealingCost(
  player: Player,
  defeatContext: string,
  logFn: (type: string, content: string) => void,
  playerAgent?: PlayerAgent,
  gameState?: GameState,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<void> {
  // Check what resources the player has available
  const availableResources: Array<{ type: ResourceType; name: string; amount: number }> = [];

  if (player.resources.food > 0) {
    availableResources.push({ type: "food", name: "Food", amount: player.resources.food });
  }
  if (player.resources.wood > 0) {
    availableResources.push({ type: "wood", name: "Wood", amount: player.resources.wood });
  }
  if (player.resources.ore > 0) {
    availableResources.push({ type: "ore", name: "Ore", amount: player.resources.ore });
  }
  if (player.resources.gold > 0) {
    availableResources.push({ type: "gold", name: "Gold", amount: player.resources.gold });
  }

  if (availableResources.length === 0) {
    // No resources available - lose 1 fame if possible
    const hadFame = player.fame > 0;
    player.fame = Math.max(0, player.fame - 1);
    if (hadFame) {
      logFn("combat", `${defeatContext}, had no resources to heal so lost 1 fame`);
    } else {
      logFn("combat", `${defeatContext}, had no resources to heal and no fame to lose`);
    }
    return;
  }

  if (availableResources.length === 1) {
    // Only one resource type available - automatically use it
    const resourceToSpend = availableResources[0];
    player.resources[resourceToSpend.type] -= 1;
    logFn("combat", `${defeatContext}, paid 1 ${resourceToSpend.name.toLowerCase()} to heal`);
    return;
  }

  // Multiple resource types available - ask player to choose
  if (!playerAgent || !gameState || !gameLog) {
    // Fallback: use gold if available, otherwise use the first resource
    const resourceToSpend = availableResources.find(r => r.type === "gold") || availableResources[0];
    player.resources[resourceToSpend.type] -= 1;
    logFn("combat", `${defeatContext}, paid 1 ${resourceToSpend.name.toLowerCase()} to heal (automatic choice)`);
    return;
  }

  // Create decision context for resource choice
  const decisionContext: DecisionContext = {
    description: "Choose which resource to spend for healing:",
    options: availableResources.map(resource => ({
      id: `resource_${resource.type}`,
      description: `1 ${resource.name} (you have ${resource.amount})`
    }))
  };

  try {
    const decision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);
    const chosenOption = decision.choice;

    if (chosenOption.startsWith("resource_")) {
      const resourceType = chosenOption.split("_")[1] as ResourceType;
      if (player.resources[resourceType] > 0) {
        player.resources[resourceType] -= 1;
        const resourceName = availableResources.find(r => r.type === resourceType)?.name || resourceType;
        logFn("combat", `${defeatContext}, paid 1 ${resourceName.toLowerCase()} to heal`);
      } else {
        // Fallback if somehow the chosen resource is no longer available
        const fallbackResource = availableResources[0];
        player.resources[fallbackResource.type] -= 1;
        logFn("combat", `${defeatContext}, paid 1 ${fallbackResource.name.toLowerCase()} to heal (fallback)`);
      }
    } else {
      // Invalid decision - use fallback
      const fallbackResource = availableResources[0];
      player.resources[fallbackResource.type] -= 1;
      logFn("combat", `${defeatContext}, paid 1 ${fallbackResource.name.toLowerCase()} to heal (fallback)`);
    }
  } catch (error) {
    // Error getting decision - use fallback
    const fallbackResource = availableResources[0];
    player.resources[fallbackResource.type] -= 1;
    logFn("combat", `${defeatContext}, paid 1 ${fallbackResource.name.toLowerCase()} to heal (error fallback)`);
  }
}

/**
 * Handle champion defeat in champion vs champion combat (no healing cost)
 */
async function applyChampionDefeatInChampionCombat(
  gameState: GameState,
  player: Player,
  championId: number,
  defeatContext: string,
  logFn: (type: string, content: string) => void,
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<void> {
  // Check for padded helmet respawn
  const respawnPosition = await handlePaddedHelmetRespawn(
    gameState,
    player,
    championId,
    playerAgent,
    gameLog,
    logFn,
    thinkingLogger
  );

  if (respawnPosition) {
    // Padded helmet respawn - move champion to chosen tile
    const champion = gameState.getChampion(player.name, championId);
    if (champion) {
      champion.position = respawnPosition;
    }
    // No healing cost for champion vs champion combat
    logFn("combat", `${defeatContext}, used padded helmet to respawn`);
    return;
  }

  // Default behavior: send champion home (no healing cost for champion vs champion combat)
  gameState.moveChampionToHome(player.name, championId);
  logFn("combat", `${defeatContext}, went home`);
}

/**
 * Handle monster placement and immediate combat (used for adventure cards)
 */
export async function resolveMonsterPlacementAndCombat(
  gameState: GameState,
  monster: Monster,
  tile: Tile,
  player: Player,
  championId: number,
  logFn: (type: string, content: string) => void
): Promise<CombatResult> {
  // Place monster on tile
  tile.monster = monster;
  logFn("event", `Champion${championId} drew monster card: ${monster.name} (might ${monster.might})!`);

  // Immediately resolve combat using the regular monster combat function
  return await resolveChampionVsMonsterCombat(gameState, tile, player, championId, logFn);
} 