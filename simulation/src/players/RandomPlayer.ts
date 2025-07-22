// Lords of Doomspire Random Player

import { GameState } from '../game/GameState';
import { GameAction, ResourceType } from '../lib/types';
import { ExecuteActionFunction, Player, PlayerType } from './Player';
import { generateAllPaths, getHarvestableResourcesInfo, getReachableTiles } from './PlayerUtils';

export class RandomPlayer implements Player {
    private name: string;

    constructor(name: string = 'Random Player') {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }

    getType(): PlayerType {
        return 'random';
    }

    async executeTurn(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction
    ): Promise<string | undefined> {
        const playerId = gameState.getCurrentPlayer().id;
        let currentGameState = gameState;
        const dice = [...diceRolls];

        // Use first die to move a champion
        if (dice.length > 0) {
            const moveResult = this.executeRandomChampionMove(currentGameState, playerId, dice[0], executeAction);
            if (moveResult.success) {
                currentGameState = moveResult.newGameState;
            }
        }

        // Use second die to harvest
        if (dice.length > 1) {
            const harvestResult = this.executeRandomHarvest(currentGameState, playerId, dice[1], executeAction);
            if (harvestResult.success) {
                currentGameState = harvestResult.newGameState;
            }
        }

        // RandomPlayer doesn't generate diary entries
        return undefined;
    }

    private executeRandomChampionMove(
        gameState: GameState,
        playerId: number,
        dieValue: number,
        executeAction: ExecuteActionFunction
    ) {
        const player = gameState.getPlayerById(playerId);
        if (!player || player.champions.length === 0) {
            return { success: false, summary: 'No champions available', newGameState: gameState };
        }

        // Pick a random champion
        const randomChampionIndex = Math.floor(Math.random() * player.champions.length);
        const champion = player.champions[randomChampionIndex];

        // Get all reachable tiles within movement range, excluding tiles with other champions
        const reachableTiles = getReachableTiles(
            gameState,
            champion.position,
            dieValue,
            champion.id,
            playerId
        );

        if (reachableTiles.length === 0) {
            return { success: false, summary: 'No reachable tiles available', newGameState: gameState };
        }

        // Pick a random reachable tile
        const randomTileIndex = Math.floor(Math.random() * reachableTiles.length);
        const targetTile = reachableTiles[randomTileIndex];

        // Calculate the Manhattan distance to determine minimum steps needed
        const minSteps = Math.abs(targetTile.row - champion.position.row) +
            Math.abs(targetTile.col - champion.position.col);

        // Generate all possible paths to the target tile
        const allPaths = generateAllPaths(
            gameState,
            champion.position,
            targetTile,
            dieValue,
            champion.id,
            playerId
        );

        if (allPaths.length === 0) {
            return { success: false, summary: 'No valid paths to target tile', newGameState: gameState };
        }

        // Pick a random path
        const randomPathIndex = Math.floor(Math.random() * allPaths.length);
        const selectedPath = allPaths[randomPathIndex];

        // Check if we should claim the destination tile
        const destinationTile = gameState.getTile(targetTile);
        const shouldClaimTile = destinationTile &&
            destinationTile.tileType === 'resource' &&
            destinationTile.claimedBy === undefined;

        // Execute the move
        const moveAction: GameAction = {
            type: 'moveChampion',
            playerId: playerId,
            championId: champion.id,
            path: selectedPath,
            claimTile: shouldClaimTile
        };

        return executeAction(moveAction, dieValue);
    }

    private executeRandomHarvest(
        gameState: GameState,
        playerId: number,
        dieValue: number,
        executeAction: ExecuteActionFunction
    ) {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            return { success: false, summary: 'Player not found', newGameState: gameState };
        }

        // Get detailed information about harvestable resources, taking blockading into account
        const harvestInfo = getHarvestableResourcesInfo(gameState, playerId);

        // Check if there are any harvestable resources
        const totalHarvestable = harvestInfo.totalHarvestableResources.food +
            harvestInfo.totalHarvestableResources.wood +
            harvestInfo.totalHarvestableResources.ore +
            harvestInfo.totalHarvestableResources.gold;
        if (totalHarvestable === 0) {
            return { success: false, summary: 'No harvestable resources available', newGameState: gameState };
        }

        // Pick a random resource type that has available resources
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        const availableTypes = resourceTypes.filter(type => harvestInfo.totalHarvestableResources[type] > 0);

        if (availableTypes.length === 0) {
            return { success: false, summary: 'No resources available to harvest', newGameState: gameState };
        }

        const randomResourceType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const harvestAmount = Math.min(dieValue, harvestInfo.totalHarvestableResources[randomResourceType]);

        const harvestResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };
        harvestResources[randomResourceType] = harvestAmount;

        const harvestAction: GameAction = {
            type: 'harvest',
            playerId: playerId,
            resources: harvestResources
        };

        return executeAction(harvestAction, dieValue);
    }

    private actionToString(action: GameAction): string {
        switch (action.type) {
            case 'moveChampion':
                const pathStr = action.path.map(p => `(${p.row},${p.col})`).join(' -> ');
                let moveStr = `Move champion ${action.championId} along path: ${pathStr}`;
                if (action.claimTile) {
                    moveStr += ' and claim tile';
                }
                return moveStr;

            case 'moveBoat':
                const boatPathStr = action.path.join(' -> ');
                let str = `Move boat ${action.boatId} to: ${boatPathStr}`;
                if (action.championId && action.championDropPosition) {
                    str += ` (transporting champion ${action.championId} to (${action.championDropPosition.row},${action.championDropPosition.col}))`;
                }
                return str;

            case 'harvest':
                const resources = Object.entries(action.resources)
                    .filter(([_, amount]) => amount > 0)
                    .map(([type, amount]) => `${amount} ${type}`)
                    .join(', ');
                return `Harvest: ${resources || 'nothing'}`;

            default:
                return `Unknown action: ${(action as any).type}`;
        }
    }
} 