// Lords of Doomspire Random Player

import { GameState } from '../game/GameState';
import { GameAction, ResourceType } from '../lib/types';
import { ExecuteActionFunction, Player, PlayerType } from './Player';
import { generatePath, getValidMoveDirections } from './PlayerUtils';

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
    ): Promise<void> {
        console.log(`${this.name} starting turn with dice: [${diceRolls.join(', ')}]`);

        const playerId = gameState.getCurrentPlayer().id;
        let currentGameState = gameState;
        const dice = [...diceRolls];

        // Use first die to move a champion
        if (dice.length > 0) {
            const moveResult = this.executeRandomChampionMove(currentGameState, playerId, dice[0], executeAction);
            if (moveResult.success) {
                currentGameState = moveResult.newGameState;
                console.log(`${this.name} move succeeded: ${moveResult.summary}`);
            } else {
                console.log(`${this.name} move failed: ${moveResult.summary}`);
            }
        }

        // Use second die to harvest
        if (dice.length > 1) {
            const harvestResult = this.executeRandomHarvest(currentGameState, playerId, dice[1], executeAction);
            if (harvestResult.success) {
                currentGameState = harvestResult.newGameState;
                console.log(`${this.name} harvest succeeded: ${harvestResult.summary}`);
            } else {
                console.log(`${this.name} harvest failed: ${harvestResult.summary}`);
            }
        }

        console.log(`${this.name} ending turn`);
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

        // Get all valid directions this champion can move in
        const validDirections = getValidMoveDirections(gameState, champion.position, dieValue);

        if (validDirections.length === 0) {
            return { success: false, summary: 'No valid directions to move', newGameState: gameState };
        }

        // Pick a random valid direction
        const randomDirectionChoice = validDirections[Math.floor(Math.random() * validDirections.length)];
        const { direction, maxSteps } = randomDirectionChoice;

        // Generate path for the full die value or maximum possible steps
        const stepsToTake = Math.min(dieValue, maxSteps);
        const path = generatePath(champion.position, direction, stepsToTake);

        // Execute the move
        const moveAction: GameAction = {
            type: 'moveChampion',
            playerId: playerId,
            championId: champion.id,
            path: path
        };

        const result = executeAction(moveAction);
        if (result.success) {
            return {
                ...result,
                summary: `Moved champion ${champion.id} ${direction.name} for ${stepsToTake} steps`
            };
        } else {
            return result;
        }
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

        // Find all resource tiles claimed by this player
        const claimedTiles = [];
        for (const row of gameState.board) {
            for (const tile of row) {
                if (tile.claimedBy === playerId && tile.resources) {
                    claimedTiles.push(tile);
                }
            }
        }

        if (claimedTiles.length === 0) {
            return { success: false, summary: 'No claimed resource tiles', newGameState: gameState };
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

        // Pick a random resource type that has available resources
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        const availableTypes = resourceTypes.filter(type => availableResources[type] > 0);

        if (availableTypes.length === 0) {
            return { success: false, summary: 'No resources available to harvest', newGameState: gameState };
        }

        const randomResourceType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const harvestAmount = Math.min(dieValue, availableResources[randomResourceType]);

        const harvestResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };
        harvestResources[randomResourceType] = harvestAmount;

        const harvestAction: GameAction = {
            type: 'harvest',
            playerId: playerId,
            resources: harvestResources
        };

        return executeAction(harvestAction);
    }

    private actionToString(action: GameAction): string {
        switch (action.type) {
            case 'moveChampion':
                const pathStr = action.path.map(p => `(${p.row},${p.col})`).join(' -> ');
                return `Move champion ${action.championId} along path: ${pathStr}`;

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