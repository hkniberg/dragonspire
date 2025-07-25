// Claude AI JSON Schemas for Lords of Doomspire

/**
 * Schema for dice action responses from Claude
 */
export const diceActionSchema = {
    type: "object",
    properties: {
        type: {
            type: "string",
            enum: ["moveChampion", "moveBoat", "harvest"],
            description: "The type of action to perform"
        },
        playerId: {
            type: "number",
            description: "The player ID performing the action"
        },
        championId: {
            type: "number",
            description: "Champion ID (for moveChampion actions)"
        },
        path: {
            type: "array",
            description: "Path for movement actions",
            items: {
                type: "object",
                properties: {
                    row: { type: "number" },
                    col: { type: "number" }
                },
                required: ["row", "col"]
            }
        },
        claimTile: {
            type: "boolean",
            description: "Whether to claim the destination tile (moveChampion only)"
        },
        boatId: {
            type: "number",
            description: "Boat ID (for moveBoat actions)"
        },
        championDropPosition: {
            type: "object",
            description: "Where to drop off champion (moveBoat only)",
            properties: {
                row: { type: "number" },
                col: { type: "number" }
            }
        },
        resources: {
            type: "object",
            description: "Resources to harvest (harvest actions only)",
            properties: {
                food: { type: "number" },
                wood: { type: "number" },
                ore: { type: "number" },
                gold: { type: "number" }
            },
            required: ["food", "wood", "ore", "gold"]
        },
        reasoning: {
            type: "string",
            description: "Brief explanation of why this action was chosen"
        }
    },
    required: ["type", "playerId", "reasoning"]
};

/**
 * Schema for decision responses from Claude
 */
export const decisionSchema = {
    type: "object",
    properties: {
        choice: {
            description: "The chosen option from the available choices"
        },
        reasoning: {
            type: "string",
            description: "Brief explanation of why this choice was made"
        }
    },
    required: ["choice", "reasoning"]
}; 