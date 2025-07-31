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
    useTrader: {
      type: "boolean",
      description: "Whether to buy/sell at the trader (only for trader tile, available items will be shown when you arrive)",
    },
    useMercenary: {
      type: "boolean",
      description: "Whether to buy 1 might at the mercenary camp (only at mercenary tile, only if you have 3 gold)",
    },
    useTemple: {
      type: "boolean",
      description: "Whether to sacrifice 2 fame to gain 1 might at the temple (only at temple tile, only if you have 2 fame)",
    },
    pickUpItems: {
      type: "array",
      description: "Optional array of item IDs to pick up from the tile. Must be items present on the tile.",
      items: {
        type: "string"
      }
    },
    dropItems: {
      type: "array",
      description: "Optional array of item IDs to drop on the tile. Must be items held by the champion.",
      items: {
        type: "string"
      }
    },
    conquerWithMight: {
      type: "boolean",
      description: "Whether to conquer an enemy's claimed tile (costs 1 might, takes over the tile)",
    },
    inciteRevolt: {
      type: "boolean",
      description: "Whether to incite revolt in an enemy's claimed tile (costs 1 fame, frees up tile but doesn't claim it)",
    },
    preferredAdventureTheme: {
      type: "string",
      description: "Preferred theme when drawing adventure cards from adventure tiles or unexplored tiles. Options: 'beast', 'cave', 'grove'",
      enum: ["beast", "cave", "grove"]
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
      description: "Optional path for movement, including the starting position. If not provided, champion stays in place. No diagonal movement allowed.",
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
 * Schema for buildAction action parameters
 */
export const buildActionSchema = {
  type: "object",
  description: "Parameters for buildAction - construct a building in your castle or recruit a champion/boat",
  properties: {
    diceValueUsed: {
      type: "number",
      description: "The die value to use for this action",
    },
    buildActionType: {
      type: "string",
      enum: ["blacksmith", "market", "recruitChampion", "buildBoat", "chapel", "upgradeChapelToMonastery"],
      description: "Type of building to construct or action to perform"
    },
  },
  required: ["diceValueUsed", "buildActionType"],
};

/**
 * Schema for dice action responses from Claude using nested structure
 */
export const diceActionSchema = {
  type: "object",
  properties: {
    actionType: {
      type: "string",
      enum: ["championAction", "boatAction", "harvestAction", "buildAction"],
      description: "The type of action to perform",
    },
    championAction: championActionSchema,
    boatAction: boatActionSchema,
    harvestAction: harvestActionSchema,
    buildAction: buildActionSchema,
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
      type: "string",
      description: "The chosen option ID from the available choices",
    },
    reasoning: {
      type: "string",
      description: "Single sentence explaining why this choice was made",
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
      description: "Resources to sell. You must already own these resources.",
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

/**
 * Schema for building usage decision responses from Claude
 */
export const buildingUsageSchema = {
  type: "object",
  properties: {
    useBlacksmith: {
      type: "boolean",
      description: "Whether to use the blacksmith to buy 1 Might for 1 Gold + 2 Ore"
    },
    sellAtMarket: {
      type: "object",
      description: "Resources to sell at market (only used if you have a market). You can only sell food, wood, and ore - not gold.",
      properties: {
        food: {
          type: "number",
          description: "Amount of food to sell"
        },
        wood: {
          type: "number",
          description: "Amount of wood to sell"
        },
        ore: {
          type: "number",
          description: "Amount of ore to sell"
        }
      },
      additionalProperties: false
    },
    reasoning: {
      type: "string",
      description: "Brief reasoning for the decision"
    }
  },
  required: ["useBlacksmith", "sellAtMarket"]
};
