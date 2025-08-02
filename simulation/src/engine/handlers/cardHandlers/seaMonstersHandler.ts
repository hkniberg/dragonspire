import { GameState } from "@/game/GameState";
import { DecisionContext, EventCardResult, OceanPosition, Player } from "@/lib/types";
import { PlayerAgent } from "@/players/PlayerAgent";

/**
 * Get an adjacent ocean position (used when boats flee)
 */
function getAdjacentOceanPosition(currentPosition: OceanPosition): OceanPosition {
  const adjacencyMap: Record<OceanPosition, OceanPosition[]> = {
    "nw": ["ne", "sw"],
    "ne": ["nw", "se"],
    "sw": ["nw", "se"],
    "se": ["ne", "sw"]
  };

  const adjacentPositions = adjacencyMap[currentPosition];
  const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
  return adjacentPositions[randomIndex];
}

/**
 * Handle the Sea Monsters event card
 * Sea monsters invade one ocean tile of player's choice. For each boat there, 
 * owning player decides: fight to the end (+2 fame, lose boat) or flee (-1 fame, move boat)
 */
export async function handleSeaMonsters(
  gameState: GameState,
  player: Player,
  playerAgent: PlayerAgent,
  logFn: (type: string, content: string) => void,
  thinkingLogger?: (content: string) => void,
  getPlayerAgent?: (playerName: string) => PlayerAgent | undefined
): Promise<EventCardResult> {
  logFn("event", "Sea monsters rise from the depths!");

  // First decision: player who drew the card chooses which ocean tile to attack
  const oceanTileOptions = [
    { id: "nw", description: "Northwest ocean tile" },
    { id: "ne", description: "Northeast ocean tile" },
    { id: "sw", description: "Southwest ocean tile" },
    { id: "se", description: "Southeast ocean tile" }
  ];

  const oceanChoiceContext: DecisionContext = {
    description: "Sea monsters are invading! Choose which ocean tile they attack:",
    options: oceanTileOptions
  };

  const oceanDecision = await playerAgent.makeDecision(gameState, [], oceanChoiceContext, thinkingLogger);
  const targetOceanTile = oceanDecision.choice as OceanPosition;

  logFn("event", `${player.name} chooses the ${targetOceanTile} ocean tile for the sea monster attack`);

  // Find all boats in the target ocean tile
  const boatsInTile: { player: Player; boatId: number }[] = [];
  for (const gamePlayer of gameState.players) {
    for (const boat of gamePlayer.boats) {
      if (boat.position === targetOceanTile) {
        boatsInTile.push({ player: gamePlayer, boatId: boat.id });
      }
    }
  }

  if (boatsInTile.length === 0) {
    logFn("event", `No boats are in the ${targetOceanTile} ocean tile. The sea monsters find nothing to attack!`);
    return {
      eventProcessed: true,
      playersAffected: []
    };
  }

  logFn("event", `${boatsInTile.length} boat(s) are in the ${targetOceanTile} ocean tile and must face the sea monsters!`);

  const playersAffected: string[] = [];

  // Second decision: for each boat, ask the owner to fight or flee
  for (const { player: boatOwner, boatId } of boatsInTile) {
    const boat = boatOwner.boats.find(b => b.id === boatId);
    if (!boat) {
      logFn("event", `Boat ${boatId} not found for ${boatOwner.name}, skipping`);
      continue;
    }

    // Get the appropriate player agent for this boat owner
    let boatOwnerAgent: PlayerAgent;
    if (boatOwner.name === player.name) {
      boatOwnerAgent = playerAgent;
    } else if (getPlayerAgent) {
      const agent = getPlayerAgent(boatOwner.name);
      if (!agent) {
        logFn("event", `No player agent found for ${boatOwner.name}, boat captain fights by default`);
        // Default to fighting if no agent available
        boatOwner.fame += 2;
        // Remove the boat
        const boatIndex = boatOwner.boats.indexOf(boat);
        if (boatIndex > -1) {
          boatOwner.boats.splice(boatIndex, 1);
        }
        playersAffected.push(boatOwner.name);
        logFn("event", `${boatOwner.name}'s boat captain fights to the end! Gains +2 fame but loses the boat`);
        continue;
      }
      boatOwnerAgent = agent;
    } else {
      logFn("event", `No way to get player agent for ${boatOwner.name}, boat captain fights by default`);
      // Default to fighting if no agent available
      boatOwner.fame += 2;
      // Remove the boat
      const boatIndex = boatOwner.boats.indexOf(boat);
      if (boatIndex > -1) {
        boatOwner.boats.splice(boatIndex, 1);
      }
      playersAffected.push(boatOwner.name);
      logFn("event", `${boatOwner.name}'s boat captain fights to the end! Gains +2 fame but loses the boat`);
      continue;
    }

    // Determine available options based on current fame
    const fightOption = {
      id: "fight",
      description: "Captain fights to the end. Gain +2 fame, lose the boat."
    };

    const options = [fightOption];

    // Only add flee option if player has fame to lose
    if (boatOwner.fame > 0) {
      const fleeOption = {
        id: "flee",
        description: "Captain flees. Lose -1 fame, move the boat one step."
      };
      options.push(fleeOption);
    }

    const boatIdentifier = boatOwner.boats.length > 1 ? ` ${boat.id}` : '';
    const combatChoiceContext: DecisionContext = {
      description: `Sea monsters attack ${boatOwner.name}'s boat${boatIdentifier} in the ${targetOceanTile} ocean! Choose your captain's response:`,
      options
    };

    const combatDecision = await boatOwnerAgent.makeDecision(gameState, [], combatChoiceContext, thinkingLogger);

    if (combatDecision.choice === "fight") {
      // Captain fights: +2 fame, lose boat
      boatOwner.fame += 2;
      // Remove the boat
      const boatIndex = boatOwner.boats.indexOf(boat);
      if (boatIndex > -1) {
        boatOwner.boats.splice(boatIndex, 1);
      }
      playersAffected.push(boatOwner.name);
      logFn("event", `${boatOwner.name}'s boat captain fights to the end! Gains +2 fame but loses the boat`);
    } else if (combatDecision.choice === "flee") {
      // Captain flees: -1 fame, move boat
      boatOwner.fame -= 1;
      const originalPosition = boat.position;
      const newPosition = getAdjacentOceanPosition(boat.position);
      boat.position = newPosition;

      playersAffected.push(boatOwner.name);
      logFn("event", `${boatOwner.name}'s boat captain flees! Loses 1 fame and moves from ${originalPosition} to ${newPosition}`);
    }
  }

  return {
    eventProcessed: true,
    playersAffected
  };
} 