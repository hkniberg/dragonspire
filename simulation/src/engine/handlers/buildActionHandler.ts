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

  if (action.buildActionType === "blacksmith") {
    return handleBlacksmithBuild(player, action, logFn, reasoningText);
  } else if (action.buildActionType === "market") {
    return handleMarketBuild(player, action, logFn, reasoningText);
  } else if (action.buildActionType === "recruitChampion") {
    return handleChampionRecruitment(player, action, logFn, reasoningText);
  } else if (action.buildActionType === "buildBoat") {
    return handleBoatBuild(player, action, logFn, reasoningText);
  } else if (action.buildActionType === "chapel") {
    return handleChapelBuild(player, action, logFn, reasoningText);
  } else if (action.buildActionType === "upgradeChapelToMonastery") {
    return handleMonasteryBuild(player, action, logFn, reasoningText);
  } else {
    return {
      actionSuccessful: false,
      reason: `Unknown building type: ${action.buildActionType}`
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
  const hasBlacksmith = player.buildings.includes("blacksmith");
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
  player.buildings.push("blacksmith");

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
  const hasMarket = player.buildings.includes("market");
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
  player.buildings.push("market");

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

function handleBoatBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford boat: 2 Wood + 2 Gold (according to rules)
  if (player.resources.wood < 2 || player.resources.gold < 2) {
    logFn("system", `Cannot afford boat - requires 2 Wood + 2 Gold.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has maximum boats (max 2 boats total)
  const currentBoatCount = player.boats.length;
  if (currentBoatCount >= 2) {
    logFn("system", `Cannot build boat - already have maximum of 2 boats.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Maximum boats reached"
    };
  }

  // Deduct resources
  player.resources.wood -= 2;
  player.resources.gold -= 2;

  // Add new boat to player's boats array
  const newBoatId = currentBoatCount + 1;
  const newBoat = {
    id: newBoatId,
    playerName: player.name,
    position: player.boats[0].position, // Start in same position as first boat
  };

  player.boats.push(newBoat);

  logFn(
    "system",
    `Built boat ${newBoatId} for 2 Wood + 2 Gold, using die value [${action.diceValueUsed}].${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: 0, wood: 2, ore: 0, gold: 2 }
  };
}

function handleChapelBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford chapel: 3 Wood + 4 Gold (according to rules)
  if (player.resources.wood < 3 || player.resources.gold < 4) {
    logFn("system", `Cannot afford chapel - requires 3 Wood + 4 Gold.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has a chapel or monastery (max 1 per player)
  const hasChapel = player.buildings.includes("chapel");
  const hasMonastery = player.buildings.includes("monastery");
  if (hasChapel || hasMonastery) {
    logFn("system", `Cannot build chapel - player already has a chapel or monastery.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has chapel or monastery"
    };
  }

  // Deduct resources
  player.resources.wood -= 3;
  player.resources.gold -= 4;

  // Add chapel to player's buildings
  player.buildings.push("chapel");

  // Gain 3 Fame immediately
  player.fame += 3;

  logFn(
    "system",
    `Built a chapel for 3 Wood + 4 Gold, using die value [${action.diceValueUsed}]. Gained 3 Fame.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: 0, wood: 3, ore: 0, gold: 4 }
  };
}

function handleMonasteryBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford monastery: 4 Wood + 5 Gold + 2 Ore (according to rules)
  if (player.resources.wood < 4 || player.resources.gold < 5 || player.resources.ore < 2) {
    logFn("system", `Cannot afford monastery - requires 4 Wood + 5 Gold + 2 Ore.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player has a chapel (monastery can only be built if chapel exists)
  const hasChapel = player.buildings.includes("chapel");
  if (!hasChapel) {
    logFn("system", `Cannot build monastery - requires a chapel first.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "No chapel to upgrade"
    };
  }

  // Check if player already has a monastery (max 1 per player)
  const hasMonastery = player.buildings.includes("monastery");
  if (hasMonastery) {
    logFn("system", `Cannot build monastery - player already has one.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has monastery"
    };
  }

  // Deduct resources
  player.resources.wood -= 4;
  player.resources.gold -= 5;
  player.resources.ore -= 2;

  // Remove chapel and add monastery (monastery replaces chapel)
  const chapelIndex = player.buildings.indexOf("chapel");
  if (chapelIndex !== -1) {
    player.buildings.splice(chapelIndex, 1);
  }
  player.buildings.push("monastery");

  // Gain 5 Fame immediately
  player.fame += 5;

  logFn(
    "system",
    `Built a monastery for 4 Wood + 5 Gold + 2 Ore, using die value [${action.diceValueUsed}]. Upgraded chapel to monastery. Gained 5 Fame.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: { food: 0, wood: 4, ore: 2, gold: 5 }
  };
} 