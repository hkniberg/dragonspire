// Lords of Doomspire Random Player

import { GameState } from '../game/GameState';
import { MoveGenerator } from '../game/MoveGenerator';
import { GameAction } from '../lib/types';
import { ExecuteActionFunction, Player, PlayerType } from './Player';

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
        let remainingDice = [...diceRolls];

        // Execute actions until all dice are used or no valid actions available
        while (remainingDice.length > 0) {
            // Get all valid actions for current state and remaining dice
            const validActions = MoveGenerator.getValidActions(currentGameState, playerId, remainingDice);

            if (validActions.length === 0) {
                console.log(`${this.name} has no valid actions remaining. Ending turn.`);
                break;
            }

            // Select a random action
            const randomIndex = Math.floor(Math.random() * validActions.length);
            const selectedAction = validActions[randomIndex];

            console.log(`${this.name} attempting action: ${this.actionToString(selectedAction)}`);

            // Execute the action
            const result = executeAction(selectedAction);

            if (result.success) {
                console.log(`${this.name} action succeeded: ${result.summary}`);
                currentGameState = result.newGameState;

                // Remove one die (for simplicity, we'll remove the first available die)
                // In a more sophisticated implementation, we'd track which die was used for which action
                remainingDice.splice(0, 1);
            } else {
                console.log(`${this.name} action failed: ${result.summary}`);
                // If action failed, try a different action or end turn
                // For now, we'll just end the turn on failure
                break;
            }
        }

        console.log(`${this.name} ending turn`);
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