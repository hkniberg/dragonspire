import { Anthropic } from "@anthropic-ai/sdk";

// Define tool schemas for dice actions
export const diceActionTools: Anthropic.Tool[] = [
    {
        name: "moveChampion",
        description: "Move a champion along a path of tiles",
        input_schema: {
            type: "object",
            properties: {
                playerId: {
                    type: "number",
                    description: "The player ID making the move"
                },
                championId: {
                    type: "number",
                    description: "The champion ID to move"
                },
                path: {
                    type: "array",
                    description: "Array of positions the champion will move through",
                    items: {
                        type: "object",
                        properties: {
                            row: { type: "number" },
                            col: { type: "number" }
                        },
                        required: ["row", "col"]
                    }
                }
            },
            required: ["playerId", "championId", "path"]
        }
    },
    {
        name: "moveBoat",
        description: "Move a boat with optional champion pickup/dropoff",
        input_schema: {
            type: "object",
            properties: {
                playerId: {
                    type: "number",
                    description: "The player ID making the move"
                },
                boatId: {
                    type: "number",
                    description: "The boat ID to move"
                },
                path: {
                    type: "array",
                    description: "Array of ocean position strings the boat will move through",
                    items: { type: "string" }
                },
                championId: {
                    type: "number",
                    description: "Optional champion ID to pick up"
                },
                championDropPosition: {
                    type: "object",
                    description: "Optional position to drop off champion",
                    properties: {
                        row: { type: "number" },
                        col: { type: "number" }
                    },
                    required: ["row", "col"]
                }
            },
            required: ["playerId", "boatId", "path"]
        }
    },
    {
        name: "harvest",
        description: "Harvest resources from claimed tiles",
        input_schema: {
            type: "object",
            properties: {
                playerId: {
                    type: "number",
                    description: "The player ID harvesting"
                },
                resources: {
                    type: "object",
                    description: "Resources to harvest",
                    properties: {
                        food: { type: "number" },
                        wood: { type: "number" },
                        ore: { type: "number" },
                        gold: { type: "number" }
                    },
                    required: ["food", "wood", "ore", "gold"]
                }
            },
            required: ["playerId", "resources"]
        }
    }
]; 