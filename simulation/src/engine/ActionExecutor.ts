// Lords of Doomspire Game Rules Engine

import { GameState } from '../game/GameState';
import type {
    GameAction,
    HarvestAction,
    MoveBoatAction,
    MoveChampionAction,
    Position,
    ResourceType
} from '../lib/types';
import { ActionResult } from '../players/Player';

export class ActionExecutor {
    /**
     * Validates and executes a game action, returning the new state and summary
     */
    public static executeAction(gameState: GameState, action: GameAction): ActionResult {
        try {
            switch (action.type) {
                case 'moveChampion':
                    return this.executeMoveChampion(gameState, action);
                case 'moveBoat':
                    return this.executeMoveBoat(gameState, action);
                case 'harvest':
                    return this.executeHarvest(gameState, action);
                default:
                    return {
                        newGameState: gameState,
                        summary: `Unknown action type: ${(action as any).type}`,
                        success: false
                    };
            }
        } catch (error) {
            return {
                newGameState: gameState,
                summary: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false
            };
        }
    }

    private static executeMoveChampion(gameState: GameState, action: MoveChampionAction): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false
            };
        }

        const champion = gameState.getChampionById(action.playerId, action.championId);
        if (!champion) {
            return {
                newGameState: gameState,
                summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                success: false
            };
        }

        // Validate path
        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false
            };
        }

        // Check that path starts from champion's current position
        const startPos = action.path[0];
        if (startPos.row !== champion.position.row || startPos.col !== champion.position.col) {
            return {
                newGameState: gameState,
                summary: `Invalid path: path must start from champion's current position (${champion.position.row}, ${champion.position.col})`,
                success: false
            };
        }

        // Validate each step in the path is adjacent
        for (let i = 1; i < action.path.length; i++) {
            if (!this.areAdjacent(action.path[i - 1], action.path[i])) {
                return {
                    newGameState: gameState,
                    summary: `Invalid path: positions (${action.path[i - 1].row}, ${action.path[i - 1].col}) and (${action.path[i].row}, ${action.path[i].col}) are not adjacent`,
                    success: false
                };
            }
        }

        const destination = action.path[action.path.length - 1];
        const destinationTile = gameState.getTile(destination);
        if (!destinationTile) {
            return {
                newGameState: gameState,
                summary: `Invalid destination: tile at (${destination.row}, ${destination.col}) does not exist`,
                success: false
            };
        }

        // Create new game state with champion moved
        const updatedChampions = player.champions.map(c =>
            c.id === action.championId
                ? { ...c, position: destination }
                : c
        );

        const updatedPlayer = { ...player, champions: updatedChampions };
        const updatedPlayers = gameState.players.map(p =>
            p.id === action.playerId ? updatedPlayer : p
        );

        const newGameState = gameState.withUpdates({ players: updatedPlayers });

        return {
            newGameState,
            summary: `Player ${action.playerId} moved champion ${action.championId} from (${champion.position.row}, ${champion.position.col}) to (${destination.row}, ${destination.col})`,
            success: true
        };
    }

    private static executeMoveBoat(gameState: GameState, action: MoveBoatAction): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false
            };
        }

        const boat = player.boats.find(b => b.id === action.boatId);
        if (!boat) {
            return {
                newGameState: gameState,
                summary: `Boat ${action.boatId} not found for player ${action.playerId}`,
                success: false
            };
        }

        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false
            };
        }

        // For now, just move the boat to the destination
        const destination = action.path[action.path.length - 1];
        const updatedBoats = player.boats.map(b =>
            b.id === action.boatId
                ? { ...b, position: destination as any } // Type assertion for ocean position
                : b
        );

        let updatedChampions = player.champions;
        let summary = `Player ${action.playerId} moved boat ${action.boatId} to ${destination}`;

        // Handle champion pickup/dropoff if specified
        if (action.championId && action.championDropPosition) {
            const champion = player.champions.find(c => c.id === action.championId);
            if (champion) {
                updatedChampions = player.champions.map(c =>
                    c.id === action.championId
                        ? { ...c, position: action.championDropPosition! }
                        : c
                );
                summary += ` and transported champion ${action.championId} to (${action.championDropPosition.row}, ${action.championDropPosition.col})`;
            }
        }

        const updatedPlayer = { ...player, boats: updatedBoats, champions: updatedChampions };
        const updatedPlayers = gameState.players.map(p =>
            p.id === action.playerId ? updatedPlayer : p
        );

        const newGameState = gameState.withUpdates({ players: updatedPlayers });

        return {
            newGameState,
            summary,
            success: true
        };
    }

    private static executeHarvest(gameState: GameState, action: HarvestAction): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false
            };
        }

        // Validate harvest amounts are non-negative
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        for (const resourceType of resourceTypes) {
            if (action.resources[resourceType] < 0) {
                return {
                    newGameState: gameState,
                    summary: `Invalid harvest: cannot harvest negative ${resourceType}`,
                    success: false
                };
            }
        }

        // Calculate total resources being harvested
        const totalHarvested = Object.values(action.resources).reduce((sum, amount) => sum + amount, 0);
        if (totalHarvested === 0) {
            return {
                newGameState: gameState,
                summary: `No resources harvested`,
                success: true
            };
        }

        // Add resources to player
        const newResources = { ...player.resources };
        for (const resourceType of resourceTypes) {
            newResources[resourceType] += action.resources[resourceType];
        }

        const updatedPlayer = { ...player, resources: newResources };
        const updatedPlayers = gameState.players.map(p =>
            p.id === action.playerId ? updatedPlayer : p
        );

        const newGameState = gameState.withUpdates({ players: updatedPlayers });

        const harvestedItems = resourceTypes
            .filter(type => action.resources[type] > 0)
            .map(type => `${action.resources[type]} ${type}`)
            .join(', ');

        return {
            newGameState,
            summary: `Player ${action.playerId} harvested ${harvestedItems}`,
            success: true
        };
    }

    /**
     * Check if two positions are adjacent (including diagonally)
     */
    private static areAdjacent(pos1: Position, pos2: Position): boolean {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }

    /**
     * Check victory conditions for a player
     */
    public static checkVictory(gameState: GameState): { won: boolean; playerId?: number; condition?: string } {
        // For now, just return false - victory conditions will be implemented later
        return { won: false };
    }
} 