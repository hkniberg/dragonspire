// Claude AI JSON Schemas for Lords of Doomspire

/**
 * Schema for moveChampion action parameters
 */
export const moveChampionSchema = {
  type: "object",
  description: "Parameters for moveChampion action",
  properties: {
    championId: {
      type: "number",
      description: "Champion ID being moved",
    },
    path: {
      type: "array",
      description: "Path for movement, including the starting position",
      items: {
        type: "object",
        properties: {
          row: { type: "number" },
          col: { type: "number" },
        },
        required: ["row", "col"],
      },
    },
    claimTile: {
      type: "boolean",
      description: "Whether to claim the destination tile",
    },
  },
  required: ["championId", "path"],
};

/**
 * Schema for moveBoat action parameters
 */
export const moveBoatSchema = {
  type: "object",
  description: "Parameters for moveBoat action",
  properties: {
    boatId: {
      type: "number",
      description: "Boat ID",
    },
    path: {
      type: "array",
      description: "Ocean path as array of strings",
      items: {
        type: "string",
      },
    },
    championId: {
      type: "number",
      description: "Optional champion being picked up",
    },
    championDropPosition: {
      type: "object",
      description: "Where to drop off champion",
      properties: {
        row: { type: "number" },
        col: { type: "number" },
      },
      required: ["row", "col"],
    },
  },
  required: ["boatId", "path"],
};

/**
 * Schema for harvest action parameters
 */
export const harvestSchema = {
  type: "object",
  description: "Parameters for harvest action",
  properties: {
    resources: {
      type: "object",
      description: "Resources to harvest",
      properties: {
        food: { type: "number" },
        wood: { type: "number" },
        ore: { type: "number" },
        gold: { type: "number" },
      },
      required: ["food", "wood", "ore", "gold"],
    },
  },
  required: ["resources"],
};

/**
 * Schema for dice action responses from Claude using nested structure
 */
export const diceActionSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["moveChampion", "moveBoat", "harvest"],
      description: "The type of action to perform",
    },
    moveChampion: moveChampionSchema,
    moveBoat: moveBoatSchema,
    harvest: harvestSchema,
    reasoning: {
      type: "string",
      description: "Brief explanation of why this action was chosen",
    },
  },
  required: ["type", "reasoning"],
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
