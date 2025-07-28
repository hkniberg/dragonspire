import { getMonsterCardById } from "@/content/monsterCards";
import { GameState } from "@/game/GameState";
import { CarriableItem, Decision, DecisionContext, EventCardResult, Monster, Player, Tile, TileTier } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Create a runed dagger item (+1 might)
 */
function createRunedDagger(): CarriableItem {
  return {
    treasureCard: {
      id: "runed-dagger",
      name: "Runed Dagger",
      tier: 2 as TileTier,
      description: "A mystical blade from the wild druid. Gain +1 might.",
      count: 1,
      carriable: true
    },
    combatBonus: 1
  };
}

// Helper function to get the name of a CarriableItem
function getItemName(item: CarriableItem): string {
  if (item.treasureCard) {
    return item.treasureCard.name;
  }
  if (item.traderItem) {
    return item.traderItem.name;
  }
  return 'Unknown Item';
}

/**
 * Handle the druid-rampage event card
 */
export async function handleDruidRampage(
  gameState: GameState,
  tile: Tile,
  player: Player,
  playerAgent: PlayerAgent,
  championId: number,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void
): Promise<EventCardResult> {
  const champion = player.champions.find(c => c.id === championId);
  if (!champion) {
    const errorMessage = `Champion${championId} not found for player ${player.name}`;
    logFn("event", errorMessage);
    return {
      eventProcessed: false,
      errorMessage
    };
  }

  logFn("event", `A wild-eyed Druid appears before Champion${championId}!`);

  // Create the runed dagger
  const runedDagger = createRunedDagger();

  // Handle giving the runed dagger to the champion
  if (champion.items.length < 2) {
    // Add the runed dagger directly
    champion.items.push(runedDagger);
    logFn("event", `The Druid hands Champion${championId} a Runed Dagger (+1 might)!`);
  } else {
    // Need to ask what to drop for the runed dagger
    const droppableOptions: any[] = [];

    // Only include items that aren't stuck
    if (!champion.items[0].stuck) {
      droppableOptions.push({
        id: "drop_first",
        description: `Drop ${getItemName(champion.items[0])} for the Runed Dagger`,
        itemToDrop: champion.items[0]
      });
    }

    if (!champion.items[1].stuck) {
      droppableOptions.push({
        id: "drop_second",
        description: `Drop ${getItemName(champion.items[1])} for the Runed Dagger`,
        itemToDrop: champion.items[1]
      });
    }

    // Always allow refusing the dagger
    droppableOptions.push({
      id: "refuse_dagger",
      description: "Refuse the Runed Dagger"
    });

    const decisionContext: DecisionContext = {
      type: "choose_item_to_drop",
      description: `Champion${championId}'s inventory is full! The Druid offers a Runed Dagger (+1 might). Choose what to drop:`,
      options: droppableOptions
    };

    const decision: Decision = await playerAgent.makeDecision(gameState, [], decisionContext, thinkingLogger);

    if (decision.choice.id === "refuse_dagger") {
      logFn("event", `Champion${championId} refused the Runed Dagger.`);
    } else {
      // Drop an existing item and take the dagger
      const itemToDrop = decision.choice.itemToDrop;

      // Remove the item from champion's inventory
      const itemIndex = champion.items.indexOf(itemToDrop);
      if (itemIndex > -1) {
        champion.items.splice(itemIndex, 1);
      }

      // Add dropped item to tile
      if (!tile.items) {
        tile.items = [];
      }
      tile.items.push(itemToDrop);

      // Add dagger to champion
      champion.items.push(runedDagger);

      logFn("event", `Champion${championId} dropped ${getItemName(itemToDrop)} and took the Runed Dagger (+1 might)!`);
    }
  }

  // Now place the Bear on the tile (the druid transforms)
  const bearCard = getMonsterCardById("bear");
  if (!bearCard) {
    const errorMessage = "Bear monster card not found";
    logFn("event", errorMessage);
    return {
      eventProcessed: false,
      errorMessage
    };
  }

  // Create a Monster object from the bear card
  const bear: Monster = {
    id: bearCard.id,
    name: bearCard.name,
    tier: bearCard.tier,
    icon: bearCard.icon,
    might: bearCard.might,
    fame: bearCard.fame,
    isBeast: bearCard.isBeast,
    resources: {
      food: bearCard.resources.food || 0,
      wood: bearCard.resources.wood || 0,
      ore: bearCard.resources.ore || 0,
      gold: bearCard.resources.gold || 0,
    },
  };

  // Place the bear on the tile
  tile.monster = bear;

  logFn("event", `As Champion${championId} prepares to leave, the wild-eyed Druid transforms into a mighty Bear! The Bear now guards this tile.`);

  return {
    eventProcessed: true,
    playersAffected: [player.name]
  };
} 