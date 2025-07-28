import { BuildAction } from "@/lib/actionTypes";
import { Player } from "@/lib/types";

export interface BuildActionResult {
  actionSuccessful: boolean;
  reason?: string;
  resourcesSpent?: { food: number; wood: number; ore: number; gold: number };
}

export function handleBuildAction(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoning?: string
): BuildActionResult {
  const reasoningText = reasoning ? ` Reason: ${reasoning}.` : "";

  if (action.buildingType === "blacksmith") {
    return handleBlacksmithBuild(player, action, logFn, reasoningText);
  } else if (action.buildingType === "market") {
    return handleMarketBuild(player, action, logFn, reasoningText);
  } else if (action.buildingType === "recruitChampion") {
    return handleChampionRecruitment(player, action, logFn, reasoningText);
  } else {
    return {
      actionSuccessful: false,
      reason: `Unknown building type: ${action.buildingType}`
    };
  }
}

function handleBlacksmithBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford blacksmith: 2 Food + 2 Ore (according to rules)
  if (player.resources.food < 2 || player.resources.ore < 2) {
    logFn("system", `Cannot afford blacksmith - requires 2 Food + 2 Ore.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has a blacksmith (max 1 per player)
  const hasBlacksmith = player.buildings.some(building => building.type === "blacksmith");
  if (hasBlacksmith) {
    logFn("system", `Cannot build blacksmith - player already has one.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has blacksmith"
    };
  }

  // Deduct resources
  player.resources.food -= 2;
  player.resources.ore -= 2;

  // Add blacksmith to player's buildings
  player.buildings.push({
    type: "blacksmith"
  });

  logFn(
    "system",
    `Built a blacksmith for 2 Food + 2 Ore, using die value [${action.diceValueUsed}].${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: 2, wood: 0, ore: 2, gold: 0 }
  };
}

function handleMarketBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford market: 2 Food + 2 Wood (according to rules)
  if (player.resources.food < 2 || player.resources.wood < 2) {
    logFn("system", `Cannot afford market - requires 2 Food + 2 Wood.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has a market (max 1 per player)
  const hasMarket = player.buildings.some(building => building.type === "market");
  if (hasMarket) {
    logFn("system", `Cannot build market - player already has one.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has market"
    };
  }

  // Deduct resources
  player.resources.food -= 2;
  player.resources.wood -= 2;

  // Add market to player's buildings
  player.buildings.push({
    type: "market"
  });

  logFn(
    "system",
    `Built a market for 2 Food + 2 Wood, using die value [${action.diceValueUsed}].${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: 2, wood: 2, ore: 0, gold: 0 }
  };
}

function handleChampionRecruitment(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can recruit a champion
  const currentChampionCount = player.champions.length;

  if (currentChampionCount >= 3) {
    logFn("system", `Cannot recruit champion - already have maximum of 3 champions.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Maximum champions reached"
    };
  }

  let cost: { food: number; gold: number; ore: number };
  let championId: number;

  if (currentChampionCount === 1) {
    // 2nd Knight: 3 Food, 3 Gold, 1 Ore
    cost = { food: 3, gold: 3, ore: 1 };
    championId = 2;
  } else if (currentChampionCount === 2) {
    // 3rd Knight: 6 Food, 6 Gold, 3 Ore
    cost = { food: 6, gold: 6, ore: 3 };
    championId = 3;
  } else {
    logFn("system", `Cannot recruit champion - invalid champion count.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Invalid champion count"
    };
  }

  // Check if player can afford the champion
  if (player.resources.food < cost.food || player.resources.gold < cost.gold || player.resources.ore < cost.ore) {
    logFn("system", `Cannot afford champion ${championId} - requires ${cost.food} Food + ${cost.gold} Gold + ${cost.ore} Ore.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Deduct resources
  player.resources.food -= cost.food;
  player.resources.gold -= cost.gold;
  player.resources.ore -= cost.ore;

  // Add new champion to player's home tile
  const newChampion = {
    id: championId,
    position: player.homePosition,
    playerName: player.name,
    items: [],
  };

  player.champions.push(newChampion);

  logFn(
    "system",
    `Recruited champion ${championId} for ${cost.food} Food + ${cost.gold} Gold + ${cost.ore} Ore, using die value [${action.diceValueUsed}].${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: cost.food, wood: 0, ore: cost.ore, gold: cost.gold }
  };
} 