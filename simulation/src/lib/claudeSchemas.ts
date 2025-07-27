// Claude AI JSON Schemas for Lords of Doomspire

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
      type: "object",
      description: "Optional tile action to perform at the destination tile (or current tile if no movement)",
      properties: {
        claimTile: {
          type: "boolean",
          description: "Whether to claim the tile",
        },
      },
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
      type: "object",
      description: "Optional tile action for the champion at drop position",
      properties: {
        claimTile: {
          type: "boolean",
          description: "Whether to claim the tile at champion drop position (if it is a resource tile)",
        },
      },
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
  required: ["actionType", "reasoning"],
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
