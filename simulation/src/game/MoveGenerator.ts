// Lords of Doomspire Move Generator

import type {
    GameAction,
    HarvestAction,
    MoveBoatAction,
    MoveChampionAction,
    Player,
    Position,
    ResourceType
} from '../lib/types';
import { GameState } from './GameState';

export class MoveGenerator {
    /**
     * Generate all valid actions for a player given their dice rolls
     */
    public static getValidActions(gameState: GameState, playerId: number, availableDice: number[]): GameAction[] {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            return [];
        }

        const actions: GameAction[] = [];

        // Generate move champion actions
        actions.push(...this.generateMoveChampionActions(gameState, player, availableDice));

        // Generate move boat actions
        actions.push(...this.generateMoveBoatActions(gameState, player, availableDice));

        // Generate harvest actions
        actions.push(...this.generateHarvestActions(gameState, player, availableDice));

        return actions;
    }

    private static generateMoveChampionActions(gameState: GameState, player: Player, availableDice: number[]): MoveChampionAction[] {
        const actions: MoveChampionAction[] = [];

        for (const champion of player.champions) {
            for (const dieValue of availableDice) {
                // Generate paths of length up to dieValue
                const paths = this.generateValidPaths(gameState, champion.position, dieValue);

                for (const path of paths) {
                    // Only include paths that actually move (more than just the starting position)
                    if (path.length > 1) {
                        actions.push({
                            type: 'moveChampion',
                            playerId: player.id,
                            championId: champion.id,
                            path: path
                        });
                    }
                }
            }
        }

        return actions;
    }

    private static generateMoveBoatActions(gameState: GameState, player: Player, availableDice: number[]): MoveBoatAction[] {
        const actions: MoveBoatAction[] = [];

        for (const boat of player.boats) {
            for (const dieValue of availableDice) {
                // Generate simple boat moves between ocean positions
                const oceanPositions = ['nw', 'ne', 'sw', 'se'];

                for (const destination of oceanPositions) {
                    if (destination !== boat.position) {
                        actions.push({
                            type: 'moveBoat',
                            playerId: player.id,
                            boatId: boat.id,
                            path: [destination]
                        });
                    }
                }
            }
        }

        return actions;
    }

    private static generateHarvestActions(gameState: GameState, player: Player, availableDice: number[]): HarvestAction[] {
        const actions: HarvestAction[] = [];

        // Find all resource tiles claimed by this player
        const claimedTiles = this.getClaimedResourceTiles(gameState, player.id);

        if (claimedTiles.length === 0) {
            return actions;
        }

        // Calculate available resources from claimed tiles
        const availableResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

        for (const tile of claimedTiles) {
            if (tile.resources) {
                for (const [resourceType, amount] of Object.entries(tile.resources)) {
                    availableResources[resourceType as ResourceType] += amount as number;
                }
            }
        }

        // Generate harvest actions for each die value
        for (const dieValue of availableDice) {
            // Generate various combinations of resources to harvest up to the die value
            const harvestCombinations = this.generateHarvestCombinations(availableResources, dieValue);

            for (const resources of harvestCombinations) {
                actions.push({
                    type: 'harvest',
                    playerId: player.id,
                    resources: resources
                });
            }
        }

        return actions;
    }

    private static generateValidPaths(gameState: GameState, startPosition: Position, maxLength: number): Position[][] {
        const paths: Position[][] = [];
        const visited = new Set<string>();

        const positionKey = (pos: Position) => `${pos.row},${pos.col}`;

        const dfs = (currentPath: Position[], remainingMoves: number) => {
            // Add current path to results
            paths.push([...currentPath]);

            if (remainingMoves <= 0) {
                return;
            }

            const currentPos = currentPath[currentPath.length - 1];
            const neighbors = this.getAdjacentPositions(currentPos);

            for (const neighbor of neighbors) {
                const tile = gameState.getTile(neighbor);
                if (tile && !visited.has(positionKey(neighbor))) {
                    visited.add(positionKey(neighbor));
                    currentPath.push(neighbor);
                    dfs(currentPath, remainingMoves - 1);
                    currentPath.pop();
                    visited.delete(positionKey(neighbor));
                }
            }
        };

        visited.add(positionKey(startPosition));
        dfs([startPosition], maxLength);

        return paths;
    }

    private static getAdjacentPositions(position: Position): Position[] {
        const adjacent: Position[] = [];

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                if (rowOffset === 0 && colOffset === 0) continue; // Skip current position

                const newRow = position.row + rowOffset;
                const newCol = position.col + colOffset;

                // Check bounds
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    adjacent.push({ row: newRow, col: newCol });
                }
            }
        }

        return adjacent;
    }

    private static getClaimedResourceTiles(gameState: GameState, playerId: number) {
        const claimedTiles = [];

        for (const row of gameState.board) {
            for (const tile of row) {
                if (tile.claimedBy === playerId && tile.resources) {
                    claimedTiles.push(tile);
                }
            }
        }

        return claimedTiles;
    }

    private static generateHarvestCombinations(availableResources: Record<ResourceType, number>, maxTotal: number): Record<ResourceType, number>[] {
        const combinations: Record<ResourceType, number>[] = [];
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];

        // Generate the empty harvest (harvest nothing)
        combinations.push({ food: 0, wood: 0, ore: 0, gold: 0 });

        // Generate combinations where we harvest up to maxTotal resources
        for (let total = 1; total <= maxTotal; total++) {
            for (const resourceType of resourceTypes) {
                if (availableResources[resourceType] >= total) {
                    const resources = { food: 0, wood: 0, ore: 0, gold: 0 };
                    resources[resourceType] = total;
                    combinations.push(resources);
                }
            }
        }

        return combinations;
    }
} 