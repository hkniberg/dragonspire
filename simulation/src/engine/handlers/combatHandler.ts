import { GameState } from "@/game/GameState";
import { GameSettings } from "@/lib/GameSettings";
import { ChampionLootOption, Decision, DecisionContext, GameLogEntry, Monster, NON_COMBAT_TILES, Player, ResourceType, Tile } from "@/lib/types";
import { formatResources } from "@/lib/utils";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
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
  defeatedChampion: any,
  winningChampion: any
): ChampionLootOption[] {
  const options: ChampionLootOption[] = [];

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
        type: "resource",
        resourceType: type,
        displayName: `1 ${name} (player has ${defeatedPlayer.resources[type]})`
      });
    }
  }

  // Add item options (only if the winning champion has room for more items)
  if (winningChampion.items.length < 2) {
    defeatedChampion.items.forEach((item: any, index: number) => {
      let itemName = "Unknown Item";
      if (item.treasureCard) {
        itemName = item.treasureCard.name;
      } else if (item.traderItem) {
        itemName = item.traderItem.name;
      }

      options.push({
        type: "item",
        itemIndex: index,
        displayName: `${itemName} (item)`
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
  winningChampion: any,
  defeatedPlayer: Player,
  defeatedChampion: any,
  lootDecision: Decision,
  logFn: (type: string, content: string) => void
): void {
  const selectedOption = lootDecision.choice;

  if (selectedOption.type === "resource") {
    // Transfer resource from defeated player to winning player
    const resourceType: ResourceType = selectedOption.resourceType;
    if (defeatedPlayer.resources[resourceType] > 0) {
      defeatedPlayer.resources[resourceType] -= 1;
      winningPlayer.resources[resourceType] += 1;
      logFn("combat", `Looted 1 ${resourceType} from defeated champion.`);
    } else {
      logFn("combat", `Failed to loot ${resourceType}: defeated player has none.`);
    }
  } else if (selectedOption.type === "item") {
    // Transfer item from defeated champion to winning champion
    const itemIndex = selectedOption.itemIndex;
    if (itemIndex >= 0 && itemIndex < defeatedChampion.items.length) {
      const lootedItem = defeatedChampion.items[itemIndex];

      // Remove item from defeated champion
      defeatedChampion.items.splice(itemIndex, 1);

      // Add item to winning champion
      winningChampion.items.push(lootedItem);

      const itemName = lootedItem.treasureCard?.name || lootedItem.traderItem?.name || "Unknown Item";
      logFn("combat", `Looted ${itemName} from defeated champion.`);
    } else {
      logFn("combat", "Failed to loot item: item not found.");
    }
  }
}

/**
 * Generate resource options for defeated player with backpack to choose from
 */
function generateBackpackResourceOptions(defeatedPlayer: Player): ChampionLootOption[] {
  const options: ChampionLootOption[] = [];

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
        type: "resource",
        resourceType: type,
        displayName: `Give 1 ${name} (you have ${defeatedPlayer.resources[type]})`
      });
    }
  }

  return options;
}

/**
 * Apply backpack resource choice by transferring the chosen resource
 */
function applyBackpackResourceChoice(
  winningPlayer: Player,
  defeatedPlayer: Player,
  resourceDecision: Decision,
  logFn: (type: string, content: string) => void
): void {
  const selectedOption = resourceDecision.choice;

  if (selectedOption.type === "resource") {
    const resourceType: ResourceType = selectedOption.resourceType;
    if (defeatedPlayer.resources[resourceType] > 0) {
      defeatedPlayer.resources[resourceType] -= 1;
      winningPlayer.resources[resourceType] += 1;
      logFn("combat", `Defeated player chose to give 1 ${resourceType} (backpack effect).`);
    } else {
      logFn("combat", `Failed to give ${resourceType}: defeated player has none.`);
    }
  }
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
  thinkingLogger?: (content: string) => void
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
    // Attacker won - award fame and send defender home (no healing cost since they get looted)
    attackingPlayer.fame += 1;
    opposingChampion.position = defendingPlayer.homePosition;

    // Get the attacking champion to generate loot options
    const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
    if (!attackingChampion) {
      throw new Error(`Attacking champion ${attackingChampionId} not found`);
    }

    // Check if the defending player has a backpack and any resources to steal
    const defendingPlayerHasBackpack = hasTraderItem(defendingPlayer, "backpack");
    const defendingPlayerHasResources = Object.values(defendingPlayer.resources).some(amount => amount > 0);

    if (defendingPlayerHasBackpack && defendingPlayerHasResources) {
      // Backpack effect: defeated player (defender) chooses what resource to give
      // Since we don't have the defending player's agent, we'll need to implement this differently
      // For now, we'll use a simple implementation where we randomly select a resource they have
      const backpackOptions = generateBackpackResourceOptions(defendingPlayer);

      if (backpackOptions.length > 0) {
        // TODO: Get defending player's agent to make this decision
        // For now, randomly select what resource to give
        const randomIndex = Math.floor(Math.random() * backpackOptions.length);
        const randomResourceDecision: Decision = {
          choice: backpackOptions[randomIndex],
          reasoning: "Backpack effect - defending player choice (simulated randomly)"
        };

        // Apply the resource transfer
        applyBackpackResourceChoice(attackingPlayer, defendingPlayer, randomResourceDecision, logFn);
      }
    } else if (defendingPlayerHasResources || opposingChampion.items.length > 0) {
      // Normal combat victory: winner chooses what to loot
      const lootOptions = generateChampionLootOptions(defendingPlayer, opposingChampion, attackingChampion);

      // Handle loot decision if there are options available
      if (lootOptions.length === 0) {
        logFn("combat", "No loot available from the defeated champion.");
      } else if (lootOptions.length === 1) {
        // Only one option available, apply it automatically
        const automaticDecision: Decision = {
          choice: lootOptions[0],
          reasoning: "Only one loot option available, applied automatically"
        };
        applyChampionLootDecision(attackingPlayer, attackingChampion, defendingPlayer, opposingChampion, automaticDecision, logFn);
      } else {
        // Multiple options available, ask the attacking player to decide
        const decisionContext: DecisionContext = {
          type: "champion_loot",
          description: `Choose what to take from the defeated champion:`,
          options: lootOptions
        };

        // Ask attacking player to make loot decision
        const lootDecision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

        // Apply the loot decision
        applyChampionLootDecision(attackingPlayer, attackingChampion, defendingPlayer, opposingChampion, lootDecision, logFn);
      }
    }

    const fullCombatDetails = `Defeated ${defendingPlayer.name}'s champion (${attackerTotal} vs ${defenderTotal}), who went home`;

    logFn("combat", fullCombatDetails);

    return {
      combatOccurred: true,
      victory: true,
      combatDetails: fullCombatDetails
    };
  } else {
    // Attacker lost - apply defeat effects immediately
    const fullCombatDetails = `was defeated by ${defendingPlayer.name}'s champion (${attackerTotal} vs ${defenderTotal})`;

    // Check if the attacking player has a backpack and any resources to steal
    const attackingPlayerHasBackpack = hasTraderItem(attackingPlayer, "backpack");
    const attackingPlayerHasResources = Object.values(attackingPlayer.resources).some(amount => amount > 0);

    if (attackingPlayerHasBackpack && attackingPlayerHasResources) {
      // Backpack effect: defeated player chooses what resource to give
      const backpackOptions = generateBackpackResourceOptions(attackingPlayer);

      if (backpackOptions.length > 0) {
        const decisionContext: DecisionContext = {
          type: "backpack_resource_choice",
          description: `You lost the battle but have a backpack. Choose what resource to give to ${defendingPlayer.name}:`,
          options: backpackOptions
        };

        // Ask the defeated player to choose what resource to give
        const resourceDecision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

        // Apply the resource transfer
        applyBackpackResourceChoice(defendingPlayer, attackingPlayer, resourceDecision, logFn);
      }
    } else if (attackingPlayerHasResources) {
      // Normal combat loss: defending player gets to choose what to steal (simulated by random choice for now)
      // TODO: Implement proper decision system for defending player
      const attackingChampion = gameState.getChampion(attackingPlayer.name, attackingChampionId);
      if (attackingChampion) {
        const lootOptions = generateChampionLootOptions(attackingPlayer, attackingChampion, opposingChampion);

        if (lootOptions.length === 1) {
          // Only one option, apply it automatically
          const automaticDecision: Decision = {
            choice: lootOptions[0],
            reasoning: "Only one loot option available, applied automatically"
          };
          applyChampionLootDecision(defendingPlayer, opposingChampion, attackingPlayer, attackingChampion, automaticDecision, logFn);
        } else if (lootOptions.length > 1) {
          // Multiple options: for now, randomly choose (TODO: implement proper decision system)
          const randomIndex = Math.floor(Math.random() * lootOptions.length);
          const randomDecision: Decision = {
            choice: lootOptions[randomIndex],
            reasoning: "Random choice by defending player (automatic)"
          };
          applyChampionLootDecision(defendingPlayer, opposingChampion, attackingPlayer, attackingChampion, randomDecision, logFn);
        }
      }
    }

    // Apply defeat effects (send home and healing cost) 
    applyChampionDefeat(gameState, attackingPlayer, attackingChampionId, fullCombatDetails, logFn);

    return {
      combatOccurred: true,
      defeat: true,
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
  const champion = gameState.getChampion(player.name, championId);

  // Check for spear bonus against beasts
  let mightBonus = 0;
  const hasSpear = champion?.items.some(item => item.traderItem?.id === "spear") || false;
  const isFightingBeast = monster.isBeast || false;

  if (hasSpear && isFightingBeast) {
    mightBonus = 1;
    logFn("combat", `Spear provides +1 might against ${monster.name} (beast)`);
  }

  // Roll dice for champion vs monster battle
  const championRoll = rollD3();
  const championTotal = player.might + championRoll + mightBonus;
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
      victory: true,
      combatDetails
    };
  } else {
    // Champion lost - monster stays on tile, apply defeat effects immediately
    const combatDetails = `Fought ${monster.name}, but was defeated (${championTotal} vs ${monster.might})`;

    // Apply defeat effects internally
    applyChampionDefeat(gameState, player, championId, combatDetails, logFn);

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
        defeat: true,
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
        victory: true,
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
  logFn("event", `Champion${championId} drew monster card: ${monster.name} (might ${monster.might})!`);

  // Immediately resolve combat using the regular monster combat function
  return resolveChampionVsMonsterCombat(gameState, tile, player, championId, logFn);
} 