import { GameState } from "@/game/GameState";
import { Champion, Decision, DecisionContext, DecisionOption, GameLogEntry, Player, ResourceType } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Check if a player has a specific trader item
 */
function hasTraderItem(player: Player, itemId: string): boolean {
  return player.champions.some(champion =>
    champion.items.some(item => item.traderItem?.id === itemId)
  );
}

/**
 * Generate loot options for champion vs champion combat victory
 * (Copied from combatHandler to avoid circular imports)
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
        description: `1 ${name} (you have ${defeatedPlayer.resources[type]})`
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
        id: `item_${index}`,
        description: `${itemName} (give item)`
      });
    });
  }

  return options;
}

/**
 * Apply champion loot decision by transferring resources or items
 * (Copied from combatHandler to avoid circular imports)
 */
function applyChampionLootDecision(
  winningPlayer: Player,
  winningChampion: Champion,
  defeatedPlayer: Player,
  defeatedChampion: Champion,
  decision: Decision
): string {
  const choice = decision.choice;

  if (choice.startsWith("resource_")) {
    const resourceType = choice.split("_")[1] as ResourceType;

    // Transfer 1 resource from defeated player to winning player
    if (defeatedPlayer.resources[resourceType] > 0) {
      defeatedPlayer.resources[resourceType] -= 1;
      winningPlayer.resources[resourceType] += 1;
      return `steals 1 ${resourceType} from defeated ${defeatedPlayer.name}`;
    }
  } else if (choice.startsWith("item_")) {
    const itemIndex = parseInt(choice.split("_")[1]);

    // Transfer item from defeated champion to winning champion
    if (itemIndex >= 0 && itemIndex < defeatedChampion.items.length && winningChampion.items.length < 2) {
      const item = defeatedChampion.items.splice(itemIndex, 1)[0];
      winningChampion.items.push(item);
      let itemName = "Unknown Item";
      if (item.treasureCard) {
        itemName = item.treasureCard.name;
      } else if (item.traderItem) {
        itemName = item.traderItem.name;
      }
      return `steals ${itemName} from defeated ${defeatedPlayer.name}`;
    }
  }

  return "could not loot anything";
}

export interface BackpackEffectResult {
  lootApplied: boolean;
  lootDescription?: string;
}

/**
 * Handle backpack effect when a player with a backpack is defeated in combat
 * @param gameState Current game state
 * @param winningPlayer The player who won the combat
 * @param winningChampion The champion who won the combat
 * @param defeatedPlayer The player who lost and has a backpack
 * @param defeatedChampion The champion who was defeated
 * @param playerAgent Agent for the defeated player to make decisions
 * @param gameLog Current game log
 * @param logFn Logging function
 * @param thinkingLogger Optional thinking logger
 * @param isDefeatedPlayerMakingChoice Whether the defeated player makes the choice (true) or random choice (false)
 * @returns Object with loot information
 */
export async function handleBackpackEffect(
  gameState: GameState,
  winningPlayer: Player,
  winningChampion: Champion,
  defeatedPlayer: Player,
  defeatedChampion: Champion,
  playerAgent: PlayerAgent | undefined,
  gameLog: readonly GameLogEntry[] | undefined,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  isDefeatedPlayerMakingChoice: boolean = true
): Promise<BackpackEffectResult> {
  // Check if defeated player has a backpack
  const defeatedPlayerHasBackpack = hasTraderItem(defeatedPlayer, "backpack");

  if (!defeatedPlayerHasBackpack) {
    return { lootApplied: false }; // No backpack, so no special effect
  }

  // Generate the same loot options that would be available in normal combat
  const lootOptions = generateChampionLootOptions(defeatedPlayer, defeatedChampion, winningChampion);

  if (lootOptions.length === 0) {
    return { lootApplied: false }; // No loot available
  }

  if (lootOptions.length === 1) {
    // Only one option available, apply it automatically
    const automaticDecision: Decision = {
      choice: lootOptions[0].id,
      reasoning: "Only one loot option available, applied automatically (backpack effect)"
    };
    const lootResult = applyChampionLootDecision(winningPlayer, winningChampion, defeatedPlayer, defeatedChampion, automaticDecision);
    return { lootApplied: true, lootDescription: lootResult };
  }

  if (isDefeatedPlayerMakingChoice && playerAgent && gameLog) {
    // Defeated player chooses what to give
    const decisionContext: DecisionContext = {
      description: `You lost the battle but have a backpack. Choose what to give to ${winningPlayer.name}:`,
      options: lootOptions
    };

    // Ask the defeated player to choose what to give
    const lootDecision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

    // Apply the loot decision
    const lootResult = applyChampionLootDecision(winningPlayer, winningChampion, defeatedPlayer, defeatedChampion, lootDecision);
    return { lootApplied: true, lootDescription: lootResult };
  } else {
    // Fallback: randomly select what to give (when we don't have the defeated player's agent)
    const randomIndex = Math.floor(Math.random() * lootOptions.length);
    const randomLootDecision: Decision = {
      choice: lootOptions[randomIndex].id,
      reasoning: "Backpack effect - defeated player choice (simulated randomly)"
    };

    // Apply the loot decision
    const lootResult = applyChampionLootDecision(winningPlayer, winningChampion, defeatedPlayer, defeatedChampion, randomLootDecision);
    return { lootApplied: true, lootDescription: lootResult };
  }
} 