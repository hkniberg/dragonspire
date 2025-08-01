/**
 * Lords of Doomspire - Claude API Schema Definitions
 * 
 * This file defines the JSON schemas used for structured communication with Claude.
 * These schemas ensure that Claude's responses match our expected data formats.
 */

/**
 * Schema for tile action parameters
 */
export const tileActionSchema = {
  type: "object",
  description: "Actions to perform on a tile",
  properties: {
    claimTile: {
      type: "boolean",
      description: "Whether to claim this tile (place a flag)"
    },
    useTrader: {
      type: "boolean",
      description: "Whether to interact with the trader on this tile"
    },
    useMercenary: {
      type: "boolean",
      description: "Whether to pay the mercenary for might"
    },
    useTemple: {
      type: "boolean",
      description: "Whether to sacrifice fame for might at the temple"
    },
    pickUpItems: {
      type: "array",
      items: { type: "string" },
      description: "Array of item IDs to pick up from this tile"
    },
    dropItems: {
      type: "array",
      items: { type: "string" },
      description: "Array of item IDs to drop on this tile"
    },
    conquerWithMight: {
      type: "boolean",
      description: "Conquer this tile using military might (costs 1 might)"
    },
    inciteRevolt: {
      type: "boolean",
      description: "Incite revolt using fame (costs 1 fame, frees up tile but doesn't claim it)"
    },
    preferredAdventureTheme: {
      type: "string",
      enum: ["beast", "cave", "grove"],
      description: "Preferred theme when drawing adventure cards"
    }
  },
  additionalProperties: false
};

/**
 * Schema for position coordinates
 */
export const positionSchema = {
  type: "object",
  description: "Position coordinates on the game board",
  properties: {
    row: { type: "number", description: "Row coordinate" },
    col: { type: "number", description: "Column coordinate" }
  },
  required: ["row", "col"],
  additionalProperties: false
};

/**
 * Schema for ocean position coordinates  
 */
export const oceanPositionSchema = {
  type: "string",
  enum: ["northwest", "northeast", "southwest", "southeast"],
  description: "Ocean zone position"
};

/**
 * Schema for championAction action parameters
 */
export const championActionSchema = {
  type: "object",
  description: "Parameters for championAction - move a champion and perform tile actions",
  properties: {
    diceValueUsed: {
      type: "number",
      description: "The dice value being consumed for this action"
    },
    championId: {
      type: "number",
      description: "ID of the champion to move"
    },
    movementPathIncludingStartPosition: {
      type: "array",
      items: positionSchema,
      description: "Complete movement path including starting position (empty array or single position for no movement)"
    },
    tileAction: tileActionSchema
  },
  required: ["diceValueUsed", "championId"],
  additionalProperties: false
};

/**
 * Schema for boatAction action parameters
 */
export const boatActionSchema = {
  type: "object",
  description: "Parameters for boatAction - move a boat and optionally transport a champion",
  properties: {
    diceValueUsed: {
      type: "number",
      description: "The dice value being consumed for this action"
    },
    boatId: {
      type: "number",
      description: "ID of the boat to move"
    },
    movementPathIncludingStartPosition: {
      type: "array",
      items: oceanPositionSchema,
      description: "Complete movement path including starting position (empty array or single position for no movement)"
    },
    championIdToPickUp: {
      type: "number",
      description: "Optional champion ID to pick up from a coastal tile"
    },
    championDropPosition: {
      ...positionSchema,
      description: "Position to drop off the champion (must be coastal)"
    },
    championTileAction: tileActionSchema
  },
  required: ["diceValueUsed", "boatId"],
  additionalProperties: false
};

/**
 * Schema for harvestAction action parameters
 */
export const harvestActionSchema = {
  type: "object",
  description: "Parameters for harvestAction - collect resources from claimed tiles",
  properties: {
    diceValuesUsed: {
      type: "array",
      items: { type: "number" },
      description: "Array of dice values being consumed for this harvest action"
    },
    tilePositions: {
      type: "array",
      items: positionSchema,
      description: "Positions of tiles to harvest from"
    }
  },
  required: ["diceValuesUsed", "tilePositions"],
  additionalProperties: false
};

/**
 * Schema for building usage decision parameters
 */
export const buildingUsageDecisionSchema = {
  type: "object",
  description: "Parameters for using existing buildings",
  properties: {
    useBlacksmith: {
      type: "boolean",
      description: "Whether to use the blacksmith to gain might (costs 1 gold + 2 ore)"
    },
    sellAtMarket: {
      type: "object",
      description: "Resources to sell at the market (2:1 ratio for gold)",
      properties: {
        food: { type: "number", minimum: 0 },
        wood: { type: "number", minimum: 0 },
        ore: { type: "number", minimum: 0 }
      },
      additionalProperties: false
    },
    useFletcher: {
      type: "boolean",
      description: "Whether to use the fletcher to gain might (costs 3 wood + 1 ore)"
    }
  },
  additionalProperties: false
};

/**
 * Schema for building decision responses from Claude (harvest phase)
 */
export const buildingDecisionSchema = {
  type: "object",
  description: "Decision about building usage and build actions during harvest phase",
  properties: {
    buildingUsageDecision: buildingUsageDecisionSchema,
    buildAction: {
      type: "string",
      enum: ["blacksmith", "market", "recruitChampion", "buildBoat", "chapel", "upgradeChapelToMonastery", "warshipUpgrade", "fletcher"],
      description: "Type of build action to perform (construct building, recruit champion, etc.)"
    }
  },
  additionalProperties: false
};

/**
 * Main schema for dice action responses from Claude
 */
export const diceActionSchema = {
  type: "object",
  description: "A single dice action to perform during the movement phase",
  properties: {
    actionType: {
      type: "string",
      enum: ["championAction", "boatAction", "harvestAction"],
      description: "Type of action to perform"
    },
    championAction: championActionSchema,
    boatAction: boatActionSchema,
    harvestAction: harvestActionSchema,
    reasoning: {
      type: "string",
      description: "Brief explanation of why this action was chosen"
    }
  },
  required: ["actionType"],
  additionalProperties: false
};

/**
 * Schema for decision responses from Claude
 */
export const decisionSchema = {
  type: "object",
  description: "Response to a decision prompt",
  properties: {
    choice: {
      type: "string",
      description: "The chosen option ID"
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of why this choice was made"
    }
  },
  required: ["choice"],
  additionalProperties: false
};

/**
 * Schema for trader decision responses from Claude
 */
export const traderDecisionSchema = {
  type: "object",
  description: "Decision about trader interactions",
  properties: {
    actions: {
      type: "array",
      description: "Array of trader actions to perform",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["buyItem", "sellResources"],
            description: "Type of trader action"
          },
          itemId: {
            type: "string",
            description: "ID of the item to purchase (required for buyItem actions)"
          },
          resourcesSold: {
            type: "object",
            description: "Resources to sell",
            properties: {
              food: { type: "number", minimum: 0 },
              wood: { type: "number", minimum: 0 },
              ore: { type: "number", minimum: 0 },
              gold: { type: "number", minimum: 0 }
            },
            additionalProperties: false
          },
          resourceRequested: {
            type: "string",
            enum: ["food", "wood", "ore", "gold"],
            description: "Resource type to receive in exchange (required for sellResources actions)"
          }
        },
        required: ["type"],
        additionalProperties: false
      }
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of the trader decisions"
    }
  },
  required: ["actions"],
  additionalProperties: false
};

// Legacy alias for backward compatibility  
export const buildingUsageSchema = buildingDecisionSchema;
