// Claude AI JSON Schemas for Lords of Doomspire

/**
 * Schema for tile action parameters
 */
export const tileActionSchema = {
  type: "object",
  description: "Tile action to perform",
  properties: {
    claimTile: {
      type: "boolean",
      description: "Whether to claim the tile (only for resource tiles)",
    },
    purchaseAtTrader: {
      type: "boolean",
      description: "Whether to purchase at the trader (only for trader tile)",
    },
  },
};

/**
 * Schema for championAction action parameters
 */
export const championActionSchema = {
  type: "object",
  description: "Parameters for championAction",
  properties: {
    diceValueUsed: {
      type: "number",
      description: "The dice value used for this action",
    },
    championId: {
      type: "number",
      description: "Champion ID being moved or performing action",
    },
    movementPathIncludingStartPosition: {
      type: "array",
      description: "Optional path for movement, including the starting position. If not provided, champion stays in place.",
      items: {
        type: "object",
        properties: {
          row: { type: "number" },
          col: { type: "number" },
        },
        required: ["row", "col"],
      },
    },
    tileAction: {
      ...tileActionSchema,
      description: "Optional tile action to perform at the destination tile (or current tile if no movement)",
    },
  },
  required: ["diceValueUsed", "championId"],
};

/**
 * Schema for boatAction action parameters
 */
export const boatActionSchema = {
  type: "object",
  description: "Parameters for boatAction",
  properties: {
    diceValueUsed: {
      type: "number",
      description: "The dice value used for this action",
    },
    boatId: {
      type: "number",
      description: "Boat ID",
    },
    movementPathIncludingStartPosition: {
      type: "array",
      description: "Optional ocean path as array of strings representing ocean positions, including start position. Valid values for each string is 'nw', 'ne', 'sw', 'se'. If not provided, boat stays in place.",
      items: {
        type: "string",
      },
    },
    championIdToPickUp: {
      type: "number",
      description: "Optional champion being picked up or transported",
    },
    championDropPosition: {
      type: "object",
      description: "Where to drop off champion. Required if championIdToPickUp is provided",
      properties: {
        row: { type: "number" },
        col: { type: "number" },
      },
      required: ["row", "col"],
    },
    championTileAction: {
      ...tileActionSchema,
      description: "Optional tile action for the champion at drop position",
    },
  },
  required: ["diceValueUsed", "boatId"],
};

/**
 * Schema for harvestAction action parameters
 */
export const harvestActionSchema = {
  type: "object",
  description: "Parameters for harvestAction",
  properties: {
    diceValuesUsed: {
      type: "array",
      description: "The dice values used for this harvest action",
      items: { type: "number" },
      minItems: 1
    },
    tilePositions: {
      type: "array",
      description: "Positions of tiles to harvest from",
      items: {
        type: "object",
        properties: { row: { type: "number" }, col: { type: "number" } },
        required: ["row", "col"],
      },
    },
  },
  required: ["diceValuesUsed", "tilePositions"],
};

/**
 * Schema for dice action responses from Claude using nested structure
 */
export const diceActionSchema = {
  type: "object",
  properties: {
    actionType: {
      type: "string",
      enum: ["championAction", "boatAction", "harvestAction"],
      description: "The type of action to perform",
    },
    championAction: championActionSchema,
    boatAction: boatActionSchema,
    harvestAction: harvestActionSchema,
    reasoning: {
      type: "string",
      description: "Brief explanation of why this action was chosen",
    },
  },
  required: ["actionType"],
};

/**
 * Schema for decision responses from Claude
 */
export const decisionSchema = {
  type: "object",
  properties: {
    choice: {
      description: "The chosen option from the available choices",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of why this choice was made",
    },
  },
  required: ["choice", "reasoning"],
};

/**
 * Schema for trader action
 */
export const traderActionSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["buyItem", "sellResources"],
      description: "Type of trader action",
    },
    itemId: {
      type: "string",
      description: "ID of the item to purchase (required for buyItem actions)",
    },
    resourcesSold: {
      type: "object",
      description: "Resources to sell (required for sellResources actions)",
      properties: {
        gold: { type: "number" },
        wood: { type: "number" },
        food: { type: "number" },
        ore: { type: "number" },
      },
    },
    resourceRequested: {
      type: "string",
      enum: ["gold", "wood", "food", "ore"],
      description: "Resource type to receive in exchange (required for sellResources actions)",
    },
  },
  required: ["type"],
};

/**
 * Schema for trader decision responses from Claude
 */
export const traderDecisionSchema = {
  type: "object",
  properties: {
    actions: {
      type: "array",
      description: "Array of trader actions to perform",
      items: traderActionSchema,
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of the trading strategy and decisions",
    },
  },
  required: ["actions"],
};
