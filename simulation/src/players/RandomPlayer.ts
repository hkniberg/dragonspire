// Lords of Doomspire Random Player

import { GameState } from '../game/GameState';
import { GameAction, ResourceType } from '../lib/types';
import {
    Decision,
    DecisionContext,
    DiceAction,
    ExecuteActionFunction,
    GameLogEntry,
    Player,
    PlayerType,
    TurnContext
} from './Player';
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

    async decideDiceAction(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext
    ): Promise<DiceAction> {
        const playerId = gameState.getCurrentPlayer().id;

        // Use the first remaining die value
        const dieValue = turnContext.remainingDiceValues[0];

        // 20% chance to do harvesting if it's not the first die and there are harvestable resources
        const shouldHarvest = Math.random() < 0.2 && turnContext.remainingDiceValues.length < turnContext.diceRolled.length;

        if (shouldHarvest) {
            const harvestAction = this.generateRandomHarvestAction(gameState, playerId, dieValue);
            if (harvestAction) {
                return harvestAction;
            }
        }

        // Default to champion movement
        const moveAction = this.generateRandomChampionMoveAction(gameState, playerId, dieValue);
        if (moveAction) {
            return moveAction;
        }

        // Fallback to harvest if movement failed
        const harvestAction = this.generateRandomHarvestAction(gameState, playerId, dieValue);
        if (harvestAction) {
            return harvestAction;
        }

        // Last resort: minimal harvest action
        return {
            type: 'harvest',
            playerId: playerId,
            resources: { food: 0, wood: 0, ore: 0, gold: 0 }
        };
    }

    async makeDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext
    ): Promise<Decision> {
        if (decisionContext.options.length === 0) {
            return { choice: null, reasoning: 'No options available' };
        }

        // Make random choice
        const randomIndex = Math.floor(Math.random() * decisionContext.options.length);
        const choice = decisionContext.options[randomIndex];

        return {
            choice: choice,
            reasoning: `RandomPlayer chose option ${randomIndex + 1} of ${decisionContext.options.length}`
        };
    }

    async writeDiaryEntry(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls?: number[]
    ): Promise<string | undefined> {
        // RandomPlayer doesn't write diary entries
        return undefined;
    }

    // Legacy method for backwards compatibility
    async executeTurn(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction
    ): Promise<string | undefined> {
        const playerId = gameState.getCurrentPlayer().id;
        let currentGameState = gameState;
        const dice = [...diceRolls];

        // 20% chance to use both dice for movement, 80% chance for normal split
        const useBothDiceForMovement = Math.random() < 0.2;

        if (useBothDiceForMovement && dice.length >= 2) {
            // Use both dice for a single movement action
            const moveResult = await this.executeRandomChampionMoveWithMultipleDice(
                currentGameState,
                playerId,
                dice,
                executeAction
            );
            if (moveResult.success) {
                currentGameState = moveResult.newGameState;
            }
        } else {
            // Normal behavior: first die for movement, second for harvesting
            // Use first die to move a champion
            if (dice.length > 0) {
                const moveResult = await this.executeRandomChampionMove(currentGameState, playerId, dice[0], executeAction);
                if (moveResult.success) {
                    currentGameState = moveResult.newGameState;
                }
            }

            // Use second die to harvest
            if (dice.length > 1) {
                const harvestResult = await this.executeRandomHarvest(currentGameState, playerId, dice[1], executeAction);
                if (harvestResult.success) {
                    currentGameState = harvestResult.newGameState;
                }
            }
        }

        // RandomPlayer doesn't generate diary entries
        return undefined;
    }

    // Legacy method for backwards compatibility
    async handleEventCardChoice(
        gameState: GameState,
        eventCardId: string,
        availableChoices: any[]
    ): Promise<any> {
        if (availableChoices.length === 0) {
            return null;
        }

        // For hungry-pests, availableChoices will be Player objects
        if (eventCardId === 'hungry-pests') {
            const randomIndex = Math.floor(Math.random() * availableChoices.length);
            return availableChoices[randomIndex];
        }

        // Default random choice for other events
        const randomIndex = Math.floor(Math.random() * availableChoices.length);
        return availableChoices[randomIndex];
    }

    private generateRandomChampionMoveAction(
        gameState: GameState,
        playerId: number,
        dieValue: number
    ): DiceAction | null {
        const player = gameState.getPlayerById(playerId);
        if (!player || player.champions.length === 0) {
            return null;
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
            return null;
        }

        // Pick a random reachable tile
        const randomTileIndex = Math.floor(Math.random() * reachableTiles.length);
        const targetTile = reachableTiles[randomTileIndex];

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
            return null;
        }

        // Pick a random path
        const randomPathIndex = Math.floor(Math.random() * allPaths.length);
        const selectedPath = allPaths[randomPathIndex];

        // Check if we should claim the destination tile
        const destinationTile = gameState.getTile(targetTile);
        const shouldClaimTile = destinationTile &&
            destinationTile.tileType === 'resource' &&
            destinationTile.claimedBy === undefined;

        return {
            type: 'moveChampion',
            playerId: playerId,
            championId: champion.id,
            path: selectedPath,
            claimTile: shouldClaimTile
        };
    }

    private generateRandomHarvestAction(
        gameState: GameState,
        playerId: number,
        dieValue: number
    ): DiceAction | null {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            return null;
        }

        // Get detailed information about harvestable resources, taking blockading into account
        const harvestInfo = getHarvestableResourcesInfo(gameState, playerId);

        // Check if there are any harvestable resources
        const totalHarvestable = harvestInfo.totalHarvestableResources.food +
            harvestInfo.totalHarvestableResources.wood +
            harvestInfo.totalHarvestableResources.ore +
            harvestInfo.totalHarvestableResources.gold;
        if (totalHarvestable === 0) {
            return null;
        }

        // Pick a random resource type that has available resources
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        const availableTypes = resourceTypes.filter(type => harvestInfo.totalHarvestableResources[type] > 0);

        if (availableTypes.length === 0) {
            return null;
        }

        const randomResourceType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const harvestAmount = Math.min(dieValue, harvestInfo.totalHarvestableResources[randomResourceType]);

        const harvestResources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };
        harvestResources[randomResourceType] = harvestAmount;

        return {
            type: 'harvest',
            playerId: playerId,
            resources: harvestResources
        };
    }

    private async executeRandomChampionMove(
        gameState: GameState,
        playerId: number,
        dieValue: number,
        executeAction: ExecuteActionFunction
    ) {
        const action = this.generateRandomChampionMoveAction(gameState, playerId, dieValue);
        if (!action) {
            return { success: false, summary: 'No valid champion move available', newGameState: gameState };
        }

        return await executeAction(action, [dieValue]);
    }

    private async executeRandomHarvest(
        gameState: GameState,
        playerId: number,
        dieValue: number,
        executeAction: ExecuteActionFunction
    ) {
        const action = this.generateRandomHarvestAction(gameState, playerId, dieValue);
        if (!action) {
            return { success: false, summary: 'No harvestable resources available', newGameState: gameState };
        }

        return await executeAction(action, [dieValue]);
    }

    private async executeRandomChampionMoveWithMultipleDice(
        gameState: GameState,
        playerId: number,
        diceValues: number[],
        executeAction: ExecuteActionFunction
    ) {
        const player = gameState.getPlayerById(playerId);
        if (!player || player.champions.length === 0) {
            return { success: false, summary: 'No champions available', newGameState: gameState };
        }

        // Pick a random champion
        const randomChampionIndex = Math.floor(Math.random() * player.champions.length);
        const champion = player.champions[randomChampionIndex];

        // Calculate total movement from all dice
        const totalMovement = diceValues.reduce((sum, die) => sum + die, 0);

        // Get all reachable tiles within total movement range, excluding tiles with other champions
        const reachableTiles = getReachableTiles(
            gameState,
            champion.position,
            totalMovement,
            champion.id,
            playerId
        );

        if (reachableTiles.length === 0) {
            return { success: false, summary: 'No reachable tiles available', newGameState: gameState };
        }

        // Pick a random reachable tile
        const randomTileIndex = Math.floor(Math.random() * reachableTiles.length);
        const targetTile = reachableTiles[randomTileIndex];

        // Generate all possible paths to the target tile
        const allPaths = generateAllPaths(
            gameState,
            champion.position,
            targetTile,
            totalMovement,
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

        // Execute the move with all dice values
        const moveAction: GameAction = {
            type: 'moveChampion',
            playerId: playerId,
            championId: champion.id,
            path: selectedPath,
            claimTile: shouldClaimTile
        };

        return await executeAction(moveAction, diceValues);
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