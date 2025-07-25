// Lords of Doomspire Claude AI Player

import { Anthropic } from "@anthropic-ai/sdk";
import { ExecuteActionFunction } from '../players/Player';
import { GameAction } from './types';

// Tool interface for LLM tool execution
export interface Tool {
    name: string;
    description: string;
    inputSchema: any;
    execute(input: any): Promise<string>;
}

// Base class for game action tools
abstract class GameActionTool implements Tool {
    abstract name: string;
    abstract description: string;
    abstract inputSchema: any;

    constructor(protected executeAction: ExecuteActionFunction, protected playerId: number) { }

    abstract execute(input: any): Promise<string>;
}

// Move Champion Tool
export class MoveChampionTool extends GameActionTool {
    name = "moveChampion";
    description = "Move a champion from the current position to a given end position, through the given path (including start position). Optionally claim the destination tile if it's an unclaimed resource tile.";
    inputSchema = {
        type: "object",
        properties: {
            championId: {
                type: "number",
                description: "The champion ID to move"
            },
            path: {
                type: "array",
                description: "Array of positions the champion will move through, from start position (inclusive) to end position (inclusive)",
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
                description: "Optional: if true, attempts to claim the destination tile (must be an unclaimed resource tile)"
            },
            diceValues: {
                type: "array",
                description: "The dice values being used for this move action",
                items: { type: "number" }
            }
        },
        required: ["championId", "path", "diceValues"]
    };

    async execute(input: any): Promise<string> {
        const action: GameAction = {
            type: 'moveChampion',
            playerId: this.playerId,
            championId: input.championId,
            path: input.path,
            claimTile: input.claimTile
        };

        const result = await this.executeAction(action, input.diceValues);
        return result.summary;
    }
}

// Move Boat Tool
export class MoveBoatTool extends GameActionTool {
    name = "moveBoat";
    description = "Move a boat with optional champion pickup/dropoff";
    inputSchema = {
        type: "object",
        properties: {
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
            },
            diceValues: {
                type: "array",
                description: "The dice values being used for this move action",
                items: { type: "number" }
            }
        },
        required: ["boatId", "path", "diceValues"]
    };

    async execute(input: any): Promise<string> {
        const action: any = {
            type: 'moveBoat',
            playerId: this.playerId,
            boatId: input.boatId,
            path: input.path
        };

        if (input.championId) {
            action.championId = input.championId;
        }

        if (input.championDropPosition) {
            action.championDropPosition = input.championDropPosition;
        }

        const result = await this.executeAction(action, input.diceValues);
        return result.summary;
    }
}

// Harvest Tool
export class HarvestTool extends GameActionTool {
    name = "harvest";
    description = "Harvest resources from claimed tiles";
    inputSchema = {
        type: "object",
        properties: {
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
            },
            diceValues: {
                type: "array",
                description: "The dice values being used for this harvest action",
                items: { type: "number" }
            }
        },
        required: ["resources", "diceValues"]
    };

    async execute(input: any): Promise<string> {
        const action: GameAction = {
            type: 'harvest',
            playerId: this.playerId,
            resources: input.resources
        };

        const result = await this.executeAction(action, input.diceValues);
        return result.summary;
    }
}

// Factory function to create game action tools
export function createGameActionTools(executeAction: ExecuteActionFunction, playerId: number): Tool[] {
    return [
        new MoveChampionTool(executeAction, playerId),
        new MoveBoatTool(executeAction, playerId),
        new HarvestTool(executeAction, playerId)
    ];
}

// Convert tools to Anthropic tool definitions
export function convertToolsToAnthropicDefinitions(tools: Tool[]): Anthropic.Tool[] {
    return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
    }));
} 