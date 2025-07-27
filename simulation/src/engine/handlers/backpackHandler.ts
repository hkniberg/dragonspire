import { GameState } from "@/game/GameState";
import { ChampionLootOption, Decision, DecisionContext, GameLogEntry, Player, ResourceType } from "@/lib/types";
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
 * Handle backpack effect when a player with a backpack is defeated in combat
 * @param gameState Current game state
 * @param winningPlayer The player who won the combat
 * @param defeatedPlayer The player who lost and has a backpack
 * @param playerAgent Agent for the defeated player to make decisions
 * @param gameLog Current game log
 * @param logFn Logging function
 * @param thinkingLogger Optional thinking logger
 * @param isDefeatedPlayerMakingChoice Whether the defeated player makes the choice (true) or random choice (false)
 * @returns True if backpack effect was applied, false if no effect
 */
export async function handleBackpackEffect(
  gameState: GameState,
  winningPlayer: Player,
  defeatedPlayer: Player,
  playerAgent: PlayerAgent | undefined,
  gameLog: readonly GameLogEntry[] | undefined,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  isDefeatedPlayerMakingChoice: boolean = true
): Promise<boolean> {
  // Check if defeated player has a backpack
  const defeatedPlayerHasBackpack = hasTraderItem(defeatedPlayer, "backpack");
  const defeatedPlayerHasResources = Object.values(defeatedPlayer.resources).some(amount => amount > 0);

  if (!defeatedPlayerHasBackpack || !defeatedPlayerHasResources) {
    return false; // No backpack effect applies
  }

  const backpackOptions = generateBackpackResourceOptions(defeatedPlayer);

  if (backpackOptions.length === 0) {
    return false; // No resources to give
  }

  if (isDefeatedPlayerMakingChoice && playerAgent && gameLog) {
    // Defeated player chooses what resource to give
    const decisionContext: DecisionContext = {
      type: "backpack_resource_choice",
      description: `You lost the battle but have a backpack. Choose what resource to give to ${winningPlayer.name}:`,
      options: backpackOptions
    };

    // Ask the defeated player to choose what resource to give
    const resourceDecision = await playerAgent.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);

    // Apply the resource transfer
    applyBackpackResourceChoice(winningPlayer, defeatedPlayer, resourceDecision, logFn);
  } else {
    // Fallback: randomly select what resource to give (when we don't have the defeated player's agent)
    const randomIndex = Math.floor(Math.random() * backpackOptions.length);
    const randomResourceDecision: Decision = {
      choice: backpackOptions[randomIndex],
      reasoning: "Backpack effect - defending player choice (simulated randomly)"
    };

    // Apply the resource transfer
    applyBackpackResourceChoice(winningPlayer, defeatedPlayer, randomResourceDecision, logFn);
  }

  return true; // Backpack effect was applied
} 