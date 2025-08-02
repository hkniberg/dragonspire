import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { CarriableItem, Champion, Decision, DecisionContext, DecisionOption, GameLogEntry, Monster, NON_COMBAT_TILES, Player, ResourceType, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import { PlayerAgent } from "@/players/PlayerAgent";
import { canChampionCarryMoreItems } from "@/players/PlayerUtils";
import { FleeContext, handleFleeDecision } from "./fleeHandler";
import { handlePaddedHelmetLootChoice } from "./paddedHelmetHandler";

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
    // Remove broken items
    for (const brokenItem of itemsToRemove) {
      const itemIndex = champion.items.indexOf(brokenItem);
      if (itemIndex !== -1) {
        champion.items.splice(itemIndex, 1);
        const itemName = brokenItem.treasureCard?.name || brokenItem.traderItem?.name || 'Unknown Item';
        logFn("combat", `${itemName} breaks and is removed from ${championDescription}'s inventory`);
      }
    }
  }
}

/**
 * Identify available combat items and ask player which ones to use after seeing dice roll
 */
async function handlePostDiceItemDecisions(
  champion: Champion | undefined,
  player: Player,
  diceRoll: number | string,
  opponentMight?: number,
  isDragonFight?: boolean,
  playerAgent?: PlayerAgent,
  gameState?: GameState,
  gameLog?: readonly GameLogEntry[],
  logFn?: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<{ mightBonus: number; itemsToRemove: CarriableItem[] }> {
  let mightBonus = 0;
  let itemsToRemove: CarriableItem[] = [];

  if (!champion || !logFn) {
    return { mightBonus, itemsToRemove };
  }

  // First, apply automatic items (always trigger)
  for (const item of champion.items) {
    // General combat bonus (always applies)
    if (item.combatBonus) {
      mightBonus += item.combatBonus;
      const itemName = item.treasureCard?.name || item.traderItem?.name || 'Unknown Item';
      logFn("combat", `${itemName} provides +${item.combatBonus} might`);
    }

    // Spear (always applies +1 might)
    if (item.traderItem?.id === "spear") {
      mightBonus += 1;
      logFn("combat", `Spear provides +1 might`);
    }

    // Long sword (always applies, doesn't break)
    if (item.treasureCard?.id === "long-sword") {
      mightBonus += 2;
      logFn("combat", `Löng Swörd provides +2 might`);
    }
  }

  // Handle beneficial items with no downside (use automatically)
  for (const item of champion.items) {
    // Porcupine shield (conditional, but no downside - use automatically when applicable)
    if (item.treasureCard?.id === "porcupine" && opponentMight !== undefined && opponentMight > player.might) {
      mightBonus += 2;
      logFn("combat", `Porcupine Shield activated automatically: +2 might (opponent has more base might)`);
    }

    // Dragonsbane ring (only vs dragon, but no downside - use automatically when applicable)
    if (item.treasureCard?.id === "dragonsbane-ring" && isDragonFight) {
      mightBonus += 3;
      logFn("combat", `Dragonsbane Ring activated automatically: +3 might (vs dragon)`);
    }
  }

  // Identify items that require player decisions (have trade-offs/costs)
  const itemsRequiringDecision: Array<{
    item: CarriableItem;
    name: string;
    effect: string;
    mightBonus: number;
    breaks: boolean;
  }> = [];

  for (const item of champion.items) {
    // Rusty sword (breaks after use - requires decision)
    if (item.treasureCard?.id === "rusty-sword") {
      itemsRequiringDecision.push({
        item,
        name: "Rusty Sword",
        effect: "+2 might (breaks after combat)",
        mightBonus: 2,
        breaks: true
      });
    }
  }

  // If no items require decisions, return what we have
  if (itemsRequiringDecision.length === 0) {
    return { mightBonus, itemsToRemove };
  }

  // Ask player about items with trade-offs
  if (playerAgent && gameState && gameLog) {
    const diceInfo = typeof diceRoll === 'string' ? diceRoll : `[${diceRoll}]`;
    logFn("combat", `After rolling ${diceInfo}, deciding on single-use items...`);

    for (const choice of itemsRequiringDecision) {
      const decisionContext: DecisionContext = {
        description: `Use ${choice.name}? (${choice.effect})`,
        options: [
          {
            id: "yes",
            description: `Yes, use ${choice.name}`
          },
          {
            id: "no",
            description: `No, save ${choice.name} for later`
          }
        ]
      };

      try {
        const decision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

        if (decision.choice === "yes") {
          mightBonus += choice.mightBonus;
          logFn("combat", `${choice.name} activated: ${choice.effect}`);

          if (choice.breaks) {
            itemsToRemove.push(choice.item);
          }
        } else {
          logFn("combat", `${choice.name} saved for later use`);
        }
      } catch (error) {
        // Fallback: automatically use all items
        logFn("combat", `Error asking about ${choice.name}, using automatically`);
        mightBonus += choice.mightBonus;
        if (choice.breaks) {
          itemsToRemove.push(choice.item);
        }
      }
    }
  } else {
    // No player agent available - use all available items automatically
    for (const choice of itemsRequiringDecision) {
      mightBonus += choice.mightBonus;
      logFn("combat", `${choice.name} used automatically: ${choice.effect}`);
      if (choice.breaks) {
        itemsToRemove.push(choice.item);
      }
    }
  }

  return { mightBonus, itemsToRemove };
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

  // Add item options (only if the winning champion has room for more items and items aren't stuck or unstealable)
  if (canChampionCarryMoreItems(winningChampion)) {
    defeatedChampion.items.forEach((item: any, index: number) => {
      // Skip stuck items - they cannot be looted
      // Skip unstealable items - they cannot be stolen in combat
      if (item.stuck || item.unstealable) {
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
  getPlayerAgent?: (playerName: string) => PlayerAgent | undefined,
  isActivelyChosen: boolean = true // New parameter to track if combat was actively chosen
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

  // In champion vs champion combat:
  // - Attacker always actively chose combat (moved to occupied tile) - no fleeing
  // - Defender never actively chose combat (was already there) - can attempt fleeing

  // Handle defender fleeing decision (defender never actively chose this combat)
  const defendingPlayerAgent = getPlayerAgent ? getPlayerAgent(defendingPlayer.name) : undefined;
  if (defendingPlayerAgent) {
    const defenderFleeContext: FleeContext = {
      combatType: 'champion',
      isActivelyChosen: false, // Defender never actively chose this combat
      gameState,
      player: defendingPlayer,
      championId: opposingChampion.id,
      tile,
      opponentName: attackingPlayer.name
    };

    const defenderFleeResult = await handleFleeDecision(defenderFleeContext, defendingPlayerAgent, gameLog, logFn, thinkingLogger);

    if (defenderFleeResult.attemptedFlee && defenderFleeResult.fleeSuccessful) {
      // Defender fled successfully, no combat occurs
      return {
        combatOccurred: false,
        combatDetails: `${defendingPlayer.name}'s champion fled from combat with ${attackingPlayer.name}'s champion`
      };
    }

    // If defender flee was attempted but failed, continue with combat
    if (defenderFleeResult.attemptedFlee && !defenderFleeResult.fleeSuccessful) {
      logFn("combat", "Defender's flee attempt failed, proceeding with combat");
    }
  }

  // Get combat support for both players
  const attackerSupport = gameState.getCombatSupport(attackingPlayer.name, tile.position);
  const defenderSupport = gameState.getCombatSupport(defendingPlayer.name, tile.position);

  const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);

  // Roll dice for champion vs champion battle - keep rerolling on ties
  let attackerRoll: number;
  let defenderRoll: number;
  let attackerTotal: number;
  let defenderTotal: number;
  let attackerMightBonus: number;
  let defenderMightBonus: number;
  let attackerItemsToRemove: CarriableItem[];
  let defenderItemsToRemove: CarriableItem[];

  do {
    attackerRoll = rollD3() + rollD3(); // Roll 2d3
    defenderRoll = rollD3() + rollD3(); // Roll 2d3

    logFn("combat", `${attackingPlayer.name} rolled [${Math.floor(attackerRoll / 2)}+${attackerRoll - Math.floor(attackerRoll / 2)}] = ${attackerRoll}`);
    logFn("combat", `${defendingPlayer.name} rolled [${Math.floor(defenderRoll / 2)}+${defenderRoll - Math.floor(defenderRoll / 2)}] = ${defenderRoll}`);

    // Now ask both players about their item usage after seeing dice results
    const attackerItemResult = await handlePostDiceItemDecisions(
      attackingChampion,
      attackingPlayer,
      `[${Math.floor(attackerRoll / 2)}+${attackerRoll - Math.floor(attackerRoll / 2)}] = ${attackerRoll}`,
      defendingPlayer.might,
      false, // not dragon fight
      playerAgent,
      gameState,
      gameLog,
      logFn,
      thinkingLogger
    );

    const defendingPlayerAgent = getPlayerAgent ? getPlayerAgent(defendingPlayer.name) : undefined;
    const defenderItemResult = await handlePostDiceItemDecisions(
      opposingChampion,
      defendingPlayer,
      `[${Math.floor(defenderRoll / 2)}+${defenderRoll - Math.floor(defenderRoll / 2)}] = ${defenderRoll}`,
      attackingPlayer.might,
      false, // not dragon fight
      defendingPlayerAgent,
      gameState,
      gameLog,
      logFn,
      thinkingLogger
    );

    attackerMightBonus = attackerItemResult.mightBonus;
    defenderMightBonus = defenderItemResult.mightBonus;
    attackerItemsToRemove = attackerItemResult.itemsToRemove;
    defenderItemsToRemove = defenderItemResult.itemsToRemove;

    attackerTotal = attackingPlayer.might + attackerRoll + attackerSupport + attackerMightBonus;
    defenderTotal = defendingPlayer.might + defenderRoll + defenderSupport + defenderMightBonus;

    if (attackerTotal === defenderTotal) {
      logFn("combat", `Combat tied (${attackerTotal} vs ${defenderTotal}), rerolling...`);
    }
  } while (attackerTotal === defenderTotal); // Keep rerolling on ties

  const attackerWins = attackerTotal > defenderTotal;

  if (attackerWins) {
    // Attacker won - award fame and send defender home (no healing cost since they get looted)
    attackingPlayer.fame += GameSettings.CHAMPION_VS_CHAMPION_FAME_AWARD;
    opposingChampion.position = defendingPlayer.homePosition;

    // Get the attacking champion to generate loot options
    const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
    if (!attackingChampion) {
      throw new Error(`Attacking champion ${attackingChampionId} not found`);
    }

    // Track loot information for the final message
    let lootInfo = "";

    // Check if the defending player has a padded helmet and any resources/items to steal
    const defendingPlayerHasPaddedHelmet = hasTraderItem(defendingPlayer, "padded-helmet");
    const defendingPlayerHasResources = Object.values(defendingPlayer.resources).some(amount => amount > 0);
    const defendingPlayerHasItems = opposingChampion.items.length > 0;

    if (defendingPlayerHasPaddedHelmet && (defendingPlayerHasResources || defendingPlayerHasItems)) {
      // Padded helmet effect: defeated player (defender) chooses what to give
      // Get the defending player's agent if available
      const defendingPlayerAgent = getPlayerAgent ? getPlayerAgent(defendingPlayer.name) : undefined;

      const paddedHelmetResult = await handlePaddedHelmetLootChoice(
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

      if (paddedHelmetResult.lootApplied && paddedHelmetResult.lootDescription) {
        lootInfo = `, ${attackingPlayer.name} ${paddedHelmetResult.lootDescription} (padded helmet effect)`;
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

    // Check if the attacking player has a padded helmet and any resources/items to steal
    const attackingPlayerHasPaddedHelmet = hasTraderItem(attackingPlayer, "padded-helmet");
    const attackingPlayerHasResources = Object.values(attackingPlayer.resources).some(amount => amount > 0);
    const attackingPlayerHasItems = (gameState.getChampion(attackingPlayer.name, attackingChampionId)?.items.length ?? 0) > 0;

    if (attackingPlayerHasPaddedHelmet && (attackingPlayerHasResources || attackingPlayerHasItems)) {
      // Padded helmet effect: defeated player chooses what to give
      const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
      if (!attackingChampion) {
        throw new Error(`Attacking champion ${attackingChampionId} not found`);
      }

      const paddedHelmetResult = await handlePaddedHelmetLootChoice(
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

      if (paddedHelmetResult.lootApplied && paddedHelmetResult.lootDescription) {
        lootInfo = `, ${defendingPlayer.name} ${paddedHelmetResult.lootDescription} (padded helmet effect)`;
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
  logFn: (type: string, content: string) => void,
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<{
  championWins: boolean;
  combatDetails: string;
  itemsToRemove: CarriableItem[];
}> {
  const champion = gameState.getChampion(player.name, championId);

  // Get combat support from adjacent units
  const supportBonus = gameState.getCombatSupport(player.name, position);
  if (supportBonus > 0) {
    logFn("combat", `Combat support: +${supportBonus} might from adjacent units`);
  }

  // Roll dice for champion vs monster battle
  const championRoll = rollD3();
  logFn("combat", `Champion rolled [${championRoll}] for combat with ${monster.name}`);

  // Now ask about item usage after seeing the dice roll
  const { mightBonus, itemsToRemove } = await handlePostDiceItemDecisions(
    champion,
    player,
    championRoll,
    monster.might,
    false, // not dragon fight
    playerAgent,
    gameState,
    gameLog,
    logFn,
    thinkingLogger
  );

  // Handle spear bonus against beasts (special case)
  let spearBonus = 0;
  const hasSpear = champion?.items.some(item => item.traderItem?.id === "spear") || false;
  const isFightingBeast = monster.isBeast || false;
  if (hasSpear && isFightingBeast) {
    spearBonus = 1;
    logFn("combat", `Spear provides additional +1 might against ${monster.name} (beast)`);
  }

  const championTotal = player.might + championRoll + mightBonus + spearBonus + supportBonus;
  const championWins = championTotal >= monster.might;

  // Create combat details string (rewards will be added by calling function)
  const championBase = player.might + championRoll + mightBonus + spearBonus;
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
    gameState, monster, player, championId, position, logFn, undefined, undefined, undefined
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
  logFn: (type: string, content: string) => void,
  isActivelyChosen: boolean = true, // New parameter to track if combat was actively chosen
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<CombatResult> {
  if (!tile.monster) {
    return { combatOccurred: false };
  }

  const monster = tile.monster;
  const champion = gameState.getChampion(player.name, championId);

  // Handle fleeing decision if applicable and we have the required parameters
  if (playerAgent && gameLog) {
    const fleeContext: FleeContext = {
      combatType: 'monster',
      isActivelyChosen,
      gameState,
      player,
      championId,
      tile
    };

    const fleeResult = await handleFleeDecision(fleeContext, playerAgent, gameLog, logFn, thinkingLogger);

    if (fleeResult.attemptedFlee && fleeResult.fleeSuccessful) {
      // Fleeing was successful, no combat occurs
      return {
        combatOccurred: false,
        combatDetails: `Champion fled from combat with ${monster.name}`
      };
    }

    // If flee was attempted but failed, or player chose to fight, continue with combat
    if (fleeResult.attemptedFlee && !fleeResult.fleeSuccessful) {
      logFn("combat", "Flee attempt failed, proceeding with combat");
    }
  }

  const { championWins, combatDetails, itemsToRemove } = await performChampionVsMonsterCombat(
    gameState, monster, player, championId, tile.position, logFn, playerAgent, gameLog, thinkingLogger
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
  logFn: (type: string, content: string) => void,
  isActivelyChosen: boolean = true, // New parameter to track if combat was actively chosen
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
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

  // Handle fleeing decision if applicable and we have the required parameters
  if (playerAgent && gameLog) {
    const fleeContext: FleeContext = {
      combatType: 'dragon',
      isActivelyChosen,
      gameState,
      player,
      championId,
      tile
    };

    const fleeResult = await handleFleeDecision(fleeContext, playerAgent, gameLog, logFn, thinkingLogger);

    if (fleeResult.attemptedFlee && fleeResult.fleeSuccessful) {
      // Fleeing was successful, no combat occurs
      return {
        encounterOccurred: true,
        combatResult: {
          combatOccurred: false,
          combatDetails: `Champion fled from the dragon`
        }
      };
    }

    // If flee was attempted but failed, or player chose to fight, continue with combat
    if (fleeResult.attemptedFlee && !fleeResult.fleeSuccessful) {
      logFn("combat", "Flee attempt failed, proceeding with dragon combat");
    }
  }

  // Must fight the dragon - roll dice for champion vs dragon battle
  // Track dragon encounter statistics
  if (player.statistics) {
    player.statistics.dragonEncounters += 1;
  }

  // Get champion and combat support
  const champion = gameState.getChampion(player.name, championId);
  const supportBonus = gameState.getCombatSupport(player.name, tile.position);
  if (supportBonus > 0) {
    logFn("combat", `Combat support: +${supportBonus} might from adjacent units`);
  }

  // Both champion and dragon roll dice during combat (as per rules)
  const championRoll = rollD3();
  const dragonRoll = rollD3();

  logFn("combat", `Champion rolled [${championRoll}] vs Dragon's [${dragonRoll}]`);

  // Now ask about item usage after seeing the dice roll
  const { mightBonus, itemsToRemove } = await handlePostDiceItemDecisions(
    champion,
    player,
    championRoll,
    GameSettings.DRAGON_BASE_MIGHT + dragonRoll, // opponent might (dragon total)
    true, // is dragon fight
    playerAgent,
    gameState,
    gameLog,
    logFn,
    thinkingLogger
  );

  const championTotal = player.might + championRoll + supportBonus + mightBonus;
  const dragonTotal = GameSettings.DRAGON_BASE_MIGHT + dragonRoll;

  const championWins = championTotal >= dragonTotal;

  if (!championWins) {
    // Champion was defeated by dragon - they get EATEN (permanently removed from game)
    const championBase = player.might + championRoll + mightBonus;
    const combatDetails = `was eaten by the dragon (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${dragonTotal})!`;

    // Remove items that break after combat (even if defeated)
    removeBrokenItems(champion, itemsToRemove, logFn);

    // Champion gets eaten - permanently remove from game
    logFn("combat", `Champion${championId} ${combatDetails}`);

    // Remove the champion permanently (eaten by dragon)
    const championIndex = player.champions.findIndex(c => c.id === championId);
    if (championIndex !== -1) {
      const eatenChampion = player.champions[championIndex];
      // Drop all items and dismiss all followers when eaten
      if (eatenChampion.items.length > 0) {
        logFn("combat", `Champion${championId}'s items are lost forever!`);
      }
      if (eatenChampion.followers.length > 0) {
        logFn("combat", `Champion${championId}'s followers flee in terror!`);
      }
      player.champions.splice(championIndex, 1);
    }

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
    const combatDetails = `Combat Victory! ${player.name} defeated the dragon (${championBase}${supportBonus > 0 ? `+${supportBonus}` : ""} vs ${dragonTotal})!`;
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
  // Send champion home
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
    // No resources available - lose fame if possible
    const hadFame = player.fame > 0;
    player.fame = Math.max(0, player.fame - GameSettings.DEFEAT_FAME_PENALTY);
    if (hadFame) {
      logFn("combat", `${defeatContext}, had no resources to heal so lost ${GameSettings.DEFEAT_FAME_PENALTY} fame`);
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
  // Send champion home (no healing cost for champion vs champion combat)
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
  logFn: (type: string, content: string) => void,
  playerAgent?: PlayerAgent,
  gameLog?: readonly GameLogEntry[],
  thinkingLogger?: (content: string) => void
): Promise<CombatResult> {
  // Place monster on tile
  tile.monster = monster;
  logFn("event", `Champion${championId} drew monster card: ${monster.name} (might ${monster.might})!`);

  // Immediately resolve combat using the regular monster combat function
  // Adventure card monsters are NOT actively chosen (monster appeared after arrival)
  return await resolveChampionVsMonsterCombat(
    gameState,
    tile,
    player,
    championId,
    logFn,
    false, // isActivelyChosen = false for adventure card monsters
    playerAgent,
    gameLog,
    thinkingLogger
  );
}