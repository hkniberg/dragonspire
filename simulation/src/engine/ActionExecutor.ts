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
    public static executeAction(gameState: GameState, action: GameAction, diceValue?: number): ActionResult {
        try {
            switch (action.type) {
                case 'moveChampion':
                    return this.executeMoveChampion(gameState, action, diceValue);
                case 'moveBoat':
                    return this.executeMoveBoat(gameState, action, diceValue);
                case 'harvest':
                    return this.executeHarvest(gameState, action, diceValue);
                default:
                    return {
                        newGameState: gameState,
                        summary: `Unknown action type: ${(action as any).type}`,
                        success: false,
                        diceValueUsed: diceValue
                    };
            }
        } catch (error) {
            return {
                newGameState: gameState,
                summary: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false,
                diceValueUsed: diceValue
            };
        }
    }

    private static executeMoveChampion(gameState: GameState, action: MoveChampionAction, diceValue?: number): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        const champion = gameState.getChampionById(action.playerId, action.championId);
        if (!champion) {
            return {
                newGameState: gameState,
                summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        // Validate path
        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        // Check that path starts from champion's current position
        const startPos = action.path[0];
        if (startPos.row !== champion.position.row || startPos.col !== champion.position.col) {
            return {
                newGameState: gameState,
                summary: `Invalid path: path must start from champion's current position (${champion.position.row}, ${champion.position.col})`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        // Validate each step in the path is adjacent
        for (let i = 1; i < action.path.length; i++) {
            if (!this.areAdjacent(action.path[i - 1], action.path[i])) {
                return {
                    newGameState: gameState,
                    summary: `Invalid path: positions (${action.path[i - 1].row}, ${action.path[i - 1].col}) and (${action.path[i].row}, ${action.path[i].col}) are not adjacent`,
                    success: false,
                    diceValueUsed: diceValue
                };
            }
        }

        const destination = action.path[action.path.length - 1];
        const destinationTile = gameState.getTile(destination);
        if (!destinationTile) {
            return {
                newGameState: gameState,
                summary: `Invalid destination: tile at (${destination.row}, ${destination.col}) does not exist`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        // Validate claiming if requested
        if (action.claimTile) {
            // Check if tile is a resource tile
            if (destinationTile.tileType !== 'resource') {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile at (${destination.row}, ${destination.col}): not a resource tile`,
                    success: false,
                    diceValueUsed: diceValue
                };
            }

            // Check if tile is already claimed
            if (destinationTile.claimedBy !== undefined) {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile at (${destination.row}, ${destination.col}): already claimed by player ${destinationTile.claimedBy}`,
                    success: false,
                    diceValueUsed: diceValue
                };
            }

            // Check if player has claims available
            const currentClaims = gameState.board
                .flat()
                .filter(tile => tile.claimedBy === action.playerId).length;

            if (currentClaims >= player.maxClaims) {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile: Player ${action.playerId} has reached maximum claims (${player.maxClaims})`,
                    success: false,
                    diceValueUsed: diceValue
                };
            }
        }

        // Check if destination tile is unexplored and handle exploration
        let updatedBoard = gameState.board;
        let updatedPlayer = player;
        let explorationSummary = '';

        if (!destinationTile.explored) {
            // Reveal the tile
            const revealedTile = { ...destinationTile, explored: true };
            updatedBoard = gameState.board.map((row, rowIndex) =>
                row.map((tile, colIndex) =>
                    rowIndex === destination.row && colIndex === destination.col
                        ? revealedTile
                        : tile
                )
            );

            // Grant 1 fame for exploring the tile
            updatedPlayer = { ...player, fame: player.fame + 1 };
            explorationSummary = ` and explored a new tile (gained 1 Fame)`;
        }

        // Handle tile claiming if requested
        let claimSummary = '';
        if (action.claimTile) {
            const updatedTile = { ...updatedBoard[destination.row][destination.col], claimedBy: action.playerId };
            updatedBoard = updatedBoard.map((row, rowIndex) =>
                row.map((tile, colIndex) =>
                    rowIndex === destination.row && colIndex === destination.col
                        ? updatedTile
                        : tile
                )
            );

            // Generate resource description
            const resourceDesc = this.getTileResourceDescription(updatedTile);
            claimSummary = ` and claimed a resource tile${resourceDesc}`;
        }

        // Check for blockading (landing on opponent's claimed resource tile)
        let blockadeSummary = '';
        if (destinationTile.tileType === 'resource' &&
            destinationTile.claimedBy !== undefined &&
            destinationTile.claimedBy !== action.playerId) {
            const opponentPlayer = gameState.getPlayerById(destinationTile.claimedBy);
            const opponentName = opponentPlayer?.name || `Player ${destinationTile.claimedBy}`;
            const resourceDesc = this.getTileResourceDescription(destinationTile);
            blockadeSummary = ` and blockaded ${opponentName}'s resource tile${resourceDesc}`;
        }

        // Create new game state with champion moved
        const updatedChampions = updatedPlayer.champions.map(c =>
            c.id === action.championId
                ? { ...c, position: destination }
                : c
        );

        const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
        const updatedPlayers = gameState.players.map(p =>
            p.id === action.playerId ? finalPlayer : p
        );

        const newGameState = gameState.withUpdates({
            board: updatedBoard,
            players: updatedPlayers
        });

        return {
            newGameState,
            summary: `Moved champion${action.championId} from (${champion.position.row}, ${champion.position.col}) to (${destination.row}, ${destination.col})${explorationSummary}${claimSummary}${blockadeSummary}`,
            success: true,
            diceValueUsed: diceValue
        };
    }

    private static executeMoveBoat(gameState: GameState, action: MoveBoatAction, diceValue?: number): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        const boat = player.boats.find(b => b.id === action.boatId);
        if (!boat) {
            return {
                newGameState: gameState,
                summary: `Boat ${action.boatId} not found for player ${action.playerId}`,
                success: false,
                diceValueUsed: diceValue
            };
        }

        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false,
                diceValueUsed: diceValue
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
        let summary = `Moved boat${action.boatId} to ${destination}`;

        // Handle champion pickup/dropoff if specified
        if (action.championId && action.championDropPosition) {
            const champion = player.champions.find(c => c.id === action.championId);
            if (champion) {
                updatedChampions = player.champions.map(c =>
                    c.id === action.championId
                        ? { ...c, position: action.championDropPosition! }
                        : c
                );
                summary += ` and transported champion${action.championId} to (${action.championDropPosition.row}, ${action.championDropPosition.col})`;
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
            success: true,
            diceValueUsed: diceValue
        };
    }

    private static executeHarvest(gameState: GameState, action: HarvestAction, diceValue?: number): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValueUsed: diceValue
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
                    diceValueUsed: diceValue
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
                diceValueUsed: diceValue
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
            diceValueUsed: diceValue
        };
    }

    /**
     * Generate a description of resources on a tile
     */
    private static getTileResourceDescription(tile: any): string {
        if (!tile.resources) return '';

        const resources = [];
        if (tile.resources.food > 0) resources.push(`${tile.resources.food} food`);
        if (tile.resources.wood > 0) resources.push(`${tile.resources.wood} wood`);
        if (tile.resources.ore > 0) resources.push(`${tile.resources.ore} ore`);
        if (tile.resources.gold > 0) resources.push(`${tile.resources.gold} gold`);

        return resources.length > 0 ? ` with ${resources.join(', ')}` : '';
    }

    /**
     * Check if two positions are adjacent (horizontally or vertically only, not diagonally)
     */
    private static areAdjacent(pos1: Position, pos2: Position): boolean {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * Check victory conditions for a player
     */
    public static checkVictory(gameState: GameState): { won: boolean; playerId?: number; condition?: string } {
        // For now, just return false - victory conditions will be implemented later
        return { won: false };
    }
} 