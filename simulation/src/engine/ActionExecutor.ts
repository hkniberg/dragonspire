// Lords of Doomspire Game Rules Engine

import { GameState } from '../game/GameState';
import { GameDecks } from '../lib/cards';
import { GameSettings } from '../lib/GameSettings';
import { MovementValidator } from '../lib/MovementValidator';
import type {
    GameAction,
    HarvestAction,
    MoveBoatAction,
    MoveChampionAction,
    ResourceType
} from '../lib/types';
import { ActionResult } from '../players/Player';
import { CombatResolver } from './CombatResolver';
import { TileArrivalHandler } from './TileArrivalHandler';

export class ActionExecutor {
    private tileArrivalHandler: TileArrivalHandler;

    constructor(combatResolver: CombatResolver = new CombatResolver()) {
        this.tileArrivalHandler = new TileArrivalHandler(combatResolver);
    }

    /**
     * Validates and executes a game action, returning the new state and summary
     */
    executeAction(gameState: GameState, action: GameAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        try {
            switch (action.type) {
                case 'moveChampion':
                    return this.executeMoveChampion(gameState, action, diceValues, gameDecks);
                case 'moveBoat':
                    return this.executeMoveBoat(gameState, action, diceValues, gameDecks);
                case 'harvest':
                    return this.executeHarvest(gameState, action, diceValues);
                default:
                    return {
                        newGameState: gameState,
                        summary: `Unknown action type: ${(action as any).type}`,
                        success: false,
                        diceValuesUsed: diceValues
                    };
            }
        } catch (error) {
            return {
                newGameState: gameState,
                summary: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }
    }

    private executeMoveChampion(gameState: GameState, action: MoveChampionAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        const champion = gameState.getChampionById(action.playerId, action.championId);
        if (!champion) {
            return {
                newGameState: gameState,
                summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate path using the new MovementValidator
        const validation = MovementValidator.validateChampionPath(champion, action.path);
        if (!validation.isValid) {
            return {
                newGameState: gameState,
                summary: validation.errorMessage!,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Check for unexplored tiles along the path and stop at the first one
        let actualDestination = action.path[action.path.length - 1];
        let stoppedAtUnexploredTile = false;

        // Skip the starting position (index 0) and check each subsequent position
        for (let i = 1; i < action.path.length; i++) {
            const position = action.path[i];
            const tile = gameState.getTile(position);

            // If the tile is unexplored (explored === false), stop here
            if (tile && tile.explored === false) {
                actualDestination = position;
                stoppedAtUnexploredTile = true;
                break;
            }
        }

        // Handle champion arrival at the actual destination using the TileArrivalHandler
        const arrivalResult = this.tileArrivalHandler.handleChampionArrival(
            gameState,
            action.playerId,
            action.championId,
            actualDestination,
            { claimTile: action.claimTile, gameDecks }
        );

        if (!arrivalResult.success) {
            return {
                newGameState: gameState,
                summary: arrivalResult.summary,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Create appropriate summary message
        let summary = `Moved champion${action.championId} from (${champion.position.row}, ${champion.position.col}) to (${actualDestination.row}, ${actualDestination.col})`;

        if (stoppedAtUnexploredTile) {
            const originalDestination = action.path[action.path.length - 1];
            if (actualDestination.row !== originalDestination.row || actualDestination.col !== originalDestination.col) {
                summary += ` (stopped at unexplored tile instead of intended destination (${originalDestination.row}, ${originalDestination.col}))`;
            }
        }

        summary += `. ${arrivalResult.summary}`;

        return {
            newGameState: arrivalResult.newGameState,
            summary,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    private executeMoveBoat(gameState: GameState, action: MoveBoatAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        const boat = player.boats.find(b => b.id === action.boatId);
        if (!boat) {
            return {
                newGameState: gameState,
                summary: `Boat ${action.boatId} not found for player ${action.playerId}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate path using the new MovementValidator
        const validation = MovementValidator.validateBoatPath(action.path);
        if (!validation.isValid) {
            return {
                newGameState: gameState,
                summary: validation.errorMessage!,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // For now, just move the boat to the destination
        const destination = action.path[action.path.length - 1];
        const updatedBoats = player.boats.map(b =>
            b.id === action.boatId
                ? { ...b, position: destination as any } // Type assertion for ocean position
                : b
        );

        let updatedGameState = gameState.withUpdates({
            players: gameState.players.map(p =>
                p.id === action.playerId ? { ...p, boats: updatedBoats } : p
            )
        });

        let summary = `Moved boat${action.boatId} to ${destination}`;

        // Handle champion pickup/dropoff if specified
        if (action.championId && action.championDropPosition) {
            const champion = player.champions.find(c => c.id === action.championId);
            if (!champion) {
                return {
                    newGameState: gameState,
                    summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }

            // Use the TileArrivalHandler for champion transport
            const arrivalResult = this.tileArrivalHandler.handleChampionArrival(
                updatedGameState,
                action.playerId,
                action.championId,
                action.championDropPosition,
                { gameDecks }
            );

            if (!arrivalResult.success) {
                return {
                    newGameState: gameState,
                    summary: `${summary}, but champion transport failed: ${arrivalResult.summary}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }

            updatedGameState = arrivalResult.newGameState;
            summary += ` and transported champion${action.championId} to (${action.championDropPosition.row}, ${action.championDropPosition.col}). ${arrivalResult.summary}`;
        }

        return {
            newGameState: updatedGameState,
            summary,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    private executeHarvest(gameState: GameState, action: HarvestAction, diceValues?: number[]): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate harvest amounts are non-negative
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        for (const resourceType of resourceTypes) {
            if (action.resources[resourceType] < 0) {
                return {
                    newGameState: gameState,
                    summary: `Invalid harvest: cannot harvest negative ${resourceType}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }
        }

        // Calculate total resources being harvested
        const totalHarvested = Object.values(action.resources).reduce((sum, amount) => sum + amount, 0);
        if (totalHarvested === 0) {
            return {
                newGameState: gameState,
                summary: `No resources harvested`,
                success: true,
                diceValuesUsed: diceValues
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
            summary: `Harvested ${harvestedItems}`,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    /**
     * Check victory conditions for a player
     */
    checkVictory(gameState: GameState): { won: boolean; playerId?: number; condition?: string } {
        // Check each player for victory conditions
        for (const player of gameState.players) {
            // Check if any champion is on doomspire tile
            const championOnDoomspire = player.champions.find(champion => {
                const tile = gameState.getTile(champion.position);
                return tile?.tileType === 'doomspire';
            });

            if (championOnDoomspire) {
                // Player is visiting the dragon - check alternative victory conditions first

                // Check fame victory (10+ fame)
                if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
                    return {
                        won: true,
                        playerId: player.id,
                        condition: `achieved fame victory with ${player.fame} fame`
                    };
                }

                // Check gold victory (10+ gold)
                if (player.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
                    return {
                        won: true,
                        playerId: player.id,
                        condition: `achieved gold victory with ${player.resources.gold} gold`
                    };
                }

                // Check starred tiles victory (3+ starred resource tiles)
                const starredTileCount = gameState.board.findTiles(tile =>
                    tile.tileType === 'resource' &&
                    tile.isStarred === true &&
                    tile.claimedBy === player.id
                ).length;

                if (starredTileCount >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
                    return {
                        won: true,
                        playerId: player.id,
                        condition: `achieved economic victory with ${starredTileCount} starred resource tiles`
                    };
                }

                // If none of the alternative conditions are met, combat victory is still possible
                // but needs to be handled elsewhere when the dragon is actually defeated
            }
        }

        // Check for combat victory (dragon defeated) - this would be set elsewhere when dragon combat is resolved
        // For now we return false since combat victory checking happens during tile arrival

        return { won: false };
    }
} 