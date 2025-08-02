import { BuildAction } from "@/lib/actionTypes";
import { Player } from "@/lib/types";
import { GameSettings } from "@/lib/GameSettings";
import { canAfford, deductCost } from "@/players/PlayerUtils";
import { formatCost } from "@/lib/utils";

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

  if (action === "blacksmith") {
    return handleBlacksmithBuild(player, action, logFn, reasoningText);
  } else if (action === "market") {
    return handleMarketBuild(player, action, logFn, reasoningText);
  } else if (action === "recruitChampion") {
    return handleChampionRecruitment(player, action, logFn, reasoningText);
  } else if (action === "buildBoat") {
    return handleBoatBuild(player, action, logFn, reasoningText);
  } else if (action === "chapel") {
    return handleChapelBuild(player, action, logFn, reasoningText);
  } else if (action === "upgradeChapelToMonastery") {
    return handleMonasteryBuild(player, action, logFn, reasoningText);
  } else if (action === "warshipUpgrade") {
    return handleWarshipUpgrade(player, action, logFn, reasoningText);
  } else if (action === "fletcher") {
    return handleFletcherBuild(player, action, logFn, reasoningText);
  } else {
    return {
      actionSuccessful: false,
      reason: `Unknown building type: ${action}`
    };
  }
}

function handleBlacksmithBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford blacksmith
  if (!canAfford(player, GameSettings.BLACKSMITH_COST)) {
    logFn("system", `Cannot afford blacksmith - requires ${formatCost(GameSettings.BLACKSMITH_COST)}.${reasoningText}`);
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
  deductCost(player, GameSettings.BLACKSMITH_COST);

  // Add blacksmith to player's buildings
  player.buildings.push("blacksmith");

  logFn(
    "system",
    `Built a blacksmith for ${formatCost(GameSettings.BLACKSMITH_COST)}.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.BLACKSMITH_COST
  };
}

function handleMarketBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford market
  if (!canAfford(player, GameSettings.MARKET_COST)) {
    logFn("system", `Cannot afford market - requires ${formatCost(GameSettings.MARKET_COST)}.${reasoningText}`);
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
  deductCost(player, GameSettings.MARKET_COST);

  // Add market to player's buildings
  player.buildings.push("market");

  logFn(
    "system",
    `Built a market for ${formatCost(GameSettings.MARKET_COST)}.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.MARKET_COST
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

  // FIXED: Use fixed cost as per game rules (always 3 Food, 3 Gold, 1 Ore)
  const championId = currentChampionCount + 2; // Next champion ID

  // Check if player can afford the champion
  if (!canAfford(player, GameSettings.CHAMPION_COST)) {
    logFn("system", `Cannot afford champion ${championId} - requires ${formatCost(GameSettings.CHAMPION_COST)}.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Deduct resources
  deductCost(player, GameSettings.CHAMPION_COST);

  // Add new champion to player's home tile
  const newChampion = {
    id: championId,
    position: player.homePosition,
    playerName: player.name,
    items: [],
    followers: [],
  };

  player.champions.push(newChampion);

  logFn(
    "system",
    `Recruited champion ${championId} for ${formatCost(GameSettings.CHAMPION_COST)}.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.CHAMPION_COST
  };
}

function handleBoatBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford boat
  if (!canAfford(player, GameSettings.BOAT_COST)) {
    logFn("system", `Cannot afford boat - requires ${formatCost(GameSettings.BOAT_COST)}.${reasoningText}`);
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
  deductCost(player, GameSettings.BOAT_COST);

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
    `Built boat ${newBoatId} for ${formatCost(GameSettings.BOAT_COST)}.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.BOAT_COST
  };
}

function handleChapelBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford chapel
  if (!canAfford(player, GameSettings.CHAPEL_COST)) {
    logFn("system", `Cannot afford chapel - requires ${formatCost(GameSettings.CHAPEL_COST)}.${reasoningText}`);
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
  deductCost(player, GameSettings.CHAPEL_COST);

  // Add chapel to player's buildings
  player.buildings.push("chapel");

  // Gain fame immediately
  player.fame += GameSettings.CHAPEL_FAME_REWARD;

  logFn(
    "system",
    `Built a chapel for ${formatCost(GameSettings.CHAPEL_COST)}. Gained ${GameSettings.CHAPEL_FAME_REWARD} Fame.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.CHAPEL_COST
  };
}

function handleMonasteryBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford monastery
  if (!canAfford(player, GameSettings.MONASTERY_COST)) {
    logFn("system", `Cannot afford monastery - requires ${formatCost(GameSettings.MONASTERY_COST)}.${reasoningText}`);
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
  deductCost(player, GameSettings.MONASTERY_COST);

  // Remove chapel and add monastery (monastery replaces chapel)
  const chapelIndex = player.buildings.indexOf("chapel");
  if (chapelIndex !== -1) {
    player.buildings.splice(chapelIndex, 1);
  }
  player.buildings.push("monastery");

  // Gain fame immediately
  player.fame += GameSettings.MONASTERY_FAME_REWARD;

  logFn(
    "system",
    `Built a monastery for ${formatCost(GameSettings.MONASTERY_COST)}. Upgraded chapel to monastery. Gained ${GameSettings.MONASTERY_FAME_REWARD} Fame.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.MONASTERY_COST
  };
}

function handleWarshipUpgrade(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford warship upgrade
  if (!canAfford(player, GameSettings.WARSHIP_UPGRADE_COST)) {
    logFn("system", `Cannot afford warship upgrade - requires ${formatCost(GameSettings.WARSHIP_UPGRADE_COST)}.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has warship upgrade (max 1 per player)
  const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
  if (hasWarshipUpgrade) {
    logFn("system", `Cannot build warship upgrade - player already has one.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has warship upgrade"
    };
  }

  // Deduct resources
  deductCost(player, GameSettings.WARSHIP_UPGRADE_COST);

  // Add warship upgrade to player's buildings
  player.buildings.push("warshipUpgrade");

  logFn(
    "system",
    `Built warship upgrade for ${formatCost(GameSettings.WARSHIP_UPGRADE_COST)}. All boats are now warships.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.WARSHIP_UPGRADE_COST
  };
}

function handleFletcherBuild(
  player: Player,
  action: BuildAction,
  logFn: (type: string, content: string) => void,
  reasoningText: string
): BuildActionResult {
  // Check if player can afford fletcher
  if (!canAfford(player, GameSettings.FLETCHER_COST)) {
    logFn("system", `Cannot afford fletcher - requires ${formatCost(GameSettings.FLETCHER_COST)}.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Insufficient resources"
    };
  }

  // Check if player already has a fletcher (max 1 per player)
  const hasFletcher = player.buildings.includes("fletcher");
  if (hasFletcher) {
    logFn("system", `Cannot build fletcher - player already has one.${reasoningText}`);
    return {
      actionSuccessful: false,
      reason: "Already has fletcher"
    };
  }

  // Deduct resources
  deductCost(player, GameSettings.FLETCHER_COST);

  // Add fletcher to player's buildings
  player.buildings.push("fletcher");

  logFn(
    "system",
    `Built a fletcher for ${formatCost(GameSettings.FLETCHER_COST)}.${reasoningText}`
  );

  return {
    actionSuccessful: true,
    resourcesSpent: GameSettings.FLETCHER_COST
  };
} 