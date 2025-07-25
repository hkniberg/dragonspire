// Lords of Doomspire Game Master

import { GameState, rollMultipleD3 } from '../game/GameState';
import { CARDS, GameDecks } from '../lib/cards';
import { GameAction } from '../lib/types';
import {
    ActionResult,
    DecisionContext,
    GameLogEntry,
    Player,
    TurnContext
} from '../players/Player';
import { ActionExecutor } from './ActionExecutor';

export type GameMasterState = 'setup' | 'playing' | 'finished';

export interface GameMasterConfig {
    players: Player[];
    maxRounds?: number; // Optional limit for testing
    startingValues?: { fame?: number; might?: number }; // Optional starting fame and might
}

export class GameMaster {
    private gameState: GameState;
    private players: Player[];
    private masterState: GameMasterState;
    private maxRounds: number;
    private gameLog: GameLogEntry[];
    private gameDecks: GameDecks;
    private actionExecutor: ActionExecutor;

    constructor(config: GameMasterConfig) {
        // Create GameState with the correct player names from the start
        const playerNames = config.players.map(player => player.getName());
        this.gameState = GameState.createWithPlayerNames(playerNames, config.startingValues);
        this.players = config.players;
        this.masterState = 'setup';
        this.maxRounds = config.maxRounds || 100; // Default limit to prevent infinite games
        this.gameLog = [];
        this.gameDecks = new GameDecks(CARDS);
        this.actionExecutor = new ActionExecutor();
    }

    /**
     * Start the game session
     */
    public start(): void {
        if (this.masterState !== 'setup') {
            throw new Error(`Cannot start game: session is in state ${this.masterState}`);
        }

        console.log('=== Lords of Doomspire Game Session Starting ===');
        console.log(`Players: ${this.players.map(p => p.getName()).join(', ')}`);
        console.log('================================================');

        this.masterState = 'playing';

        // Add initial system log entry
        this.addLogEntry({
            round: 0,
            playerId: -1,
            playerName: 'System',
            type: 'system',
            content: `Game started with players: ${this.players.map(p => p.getName()).join(', ')}`
        });
    }

    /**
     * Execute a single turn for the current player using the new Game Master pattern
     */
    public async executeTurn(): Promise<void> {
        if (this.masterState !== 'playing') {
            throw new Error(`Cannot execute turn: session is in state ${this.masterState}`);
        }

        const currentPlayer = this.players[this.gameState.currentPlayerIndex];
        const playerId = this.gameState.getCurrentPlayer().id;

        console.log(`\n--- ${currentPlayer.getName()}'s Turn (Round ${this.gameState.currentRound}) ---`);

        // Step 1: Roll dice for player
        const additionalChampions = this.gameState.getCurrentPlayer().champions.length - 1;
        const diceCount = 2 + additionalChampions;
        const diceRolls = rollMultipleD3(diceCount);

        console.log(`${currentPlayer.getName()} rolled: ${diceRolls.join(', ')}`);
        this.addLogEntry({
            round: this.gameState.currentRound,
            playerId: playerId,
            playerName: currentPlayer.getName(),
            type: 'system',
            content: `Rolled dice: ${diceRolls.join(', ')}`
        });

        // Step 2: Ask player for diary entry (strategic reflection) - now with dice context
        try {
            const diaryEntry = await currentPlayer.writeDiaryEntry(this.gameState, this.gameLog, diceRolls);
            if (diaryEntry) {
                console.log(`${currentPlayer.getName()}'s diary: ${diaryEntry}`);
                this.addLogEntry({
                    round: this.gameState.currentRound,
                    playerId: playerId,
                    playerName: currentPlayer.getName(),
                    type: 'diary',
                    content: diaryEntry
                });
            }
        } catch (error) {
            console.error(`Error getting diary entry from ${currentPlayer.getName()}:`, error);
        }

        // Step 3: For each die, ask player to decide action and execute it
        let remainingDice = [...diceRolls];
        let currentState = this.gameState;

        for (let dieIndex = 0; dieIndex < diceRolls.length; dieIndex++) {
            const dieValue = diceRolls[dieIndex];

            try {
                // Create turn context for this die
                const turnContext: TurnContext = {
                    turnNumber: this.gameState.currentRound,
                    diceRolled: diceRolls,
                    remainingDiceValues: remainingDice
                };

                // Ask player what they want to do with this die
                const diceAction = await currentPlayer.decideDiceAction(currentState, this.gameLog, turnContext);

                console.log(`Die ${dieValue}: ${this.actionToString(diceAction)}`);

                // Execute the action using ActionExecutor
                const result = await this.executeActionWithDecisionHandling(
                    currentState,
                    diceAction,
                    [dieValue],
                    currentPlayer
                );

                // Log the action and result
                this.addLogEntry({
                    round: this.gameState.currentRound,
                    playerId: playerId,
                    playerName: currentPlayer.getName(),
                    type: this.getActionType(diceAction),
                    content: result.summary
                });

                if (result.success) {
                    currentState = result.newGameState;
                    console.log(`✓ ${result.summary}`);
                } else {
                    console.log(`✗ ${result.summary}`);
                }

                // Remove this die from remaining dice
                remainingDice = remainingDice.slice(1);

            } catch (error) {
                console.error(`Error during ${currentPlayer.getName()}'s dice action ${dieIndex + 1}:`, error);
                remainingDice = remainingDice.slice(1);
            }
        }

        // Update game state to final state after all actions
        this.gameState = currentState;

        // Step 4: Check for victory conditions
        const victoryCheck = this.actionExecutor.checkVictory(this.gameState);
        if (victoryCheck.won) {
            this.endGame(victoryCheck.playerId, victoryCheck.condition);
            return;
        }

        // Check for max rounds limit
        if (this.gameState.currentRound >= this.maxRounds) {
            console.log(`\nGame ended: Maximum rounds (${this.maxRounds}) reached`);
            this.endGame();
            return;
        }

        // Step 5: Advance to next player
        this.gameState = this.gameState.advanceToNextPlayer();
    }

    /**
     * Execute an action and handle any runtime decisions that arise
     */
    private async executeActionWithDecisionHandling(
        gameState: GameState,
        action: GameAction,
        diceValues: number[],
        currentPlayer: Player
    ): Promise<ActionResult> {
        // For now, use the existing ActionExecutor directly
        // In the future, we'll integrate decision handling here
        return await this.actionExecutor.executeAction(
            gameState,
            action,
            diceValues,
            this.gameDecks,
            currentPlayer
        );
    }

    /**
     * Handle a runtime decision by asking the current player
     */
    public async handleRuntimeDecision(
        player: Player,
        decisionContext: DecisionContext
    ): Promise<any> {
        try {
            const decision = await player.makeDecision(this.gameState, this.gameLog, decisionContext);

            // Log the decision
            this.addLogEntry({
                round: this.gameState.currentRound,
                playerId: this.gameState.getCurrentPlayer().id,
                playerName: player.getName(),
                type: 'event',
                content: `Decision: ${decisionContext.description} -> ${JSON.stringify(decision.choice)}`,
                metadata: { reasoning: decision.reasoning }
            });

            return decision.choice;
        } catch (error) {
            console.error(`Error getting decision from ${player.getName()}:`, error);

            // Fallback to first available option
            if (decisionContext.options.length > 0) {
                return decisionContext.options[0];
            }
            return null;
        }
    }

    /**
     * Run the complete game session until finished
     */
    public async runToCompletion(): Promise<void> {
        this.start();

        while (this.masterState === 'playing') {
            await this.executeTurn();
        }

        console.log('\n=== Game Session Complete ===');
        this.printGameSummary();
    }

    /**
     * Get the current game state
     */
    public getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Get the master state
     */
    public getMasterState(): GameMasterState {
        return this.masterState;
    }

    /**
     * Get the game log
     */
    public getGameLog(): readonly GameLogEntry[] {
        return [...this.gameLog];
    }

    /**
     * Update the game state (useful for UI changes like extra instructions)
     */
    public updateGameState(newGameState: GameState): void {
        this.gameState = newGameState;
    }

    /**
     * Add an entry to the game log
     */
    private addLogEntry(entry: GameLogEntry): void {
        this.gameLog.push(entry);
    }

    /**
     * Convert GameAction to readable string
     */
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

    /**
     * Determine log entry type based on action
     */
    private getActionType(action: GameAction): 'movement' | 'combat' | 'harvest' | 'diary' | 'event' | 'system' {
        switch (action.type) {
            case 'moveChampion':
            case 'moveBoat':
                return 'movement';
            case 'harvest':
                return 'harvest';
            default:
                return 'system';
        }
    }

    private endGame(winnerId?: number, condition?: string): void {
        this.masterState = 'finished';

        if (winnerId) {
            const winner = this.players.find(p => this.gameState.getPlayerById(winnerId)?.id === winnerId);
            console.log(`\n🎉 GAME WON! 🎉`);
            console.log(`Winner: ${winner?.getName() || `Player ${winnerId}`}`);
            if (condition) {
                console.log(`Victory Condition: ${condition}`);
            }

            this.addLogEntry({
                round: this.gameState.currentRound,
                playerId: winnerId,
                playerName: winner?.getName() || `Player ${winnerId}`,
                type: 'system',
                content: `VICTORY! ${condition || 'Game won'}`
            });
        } else {
            console.log(`\nGame ended without a winner`);
            this.addLogEntry({
                round: this.gameState.currentRound,
                playerId: -1,
                playerName: 'System',
                type: 'system',
                content: 'Game ended without a winner'
            });
        }

        this.gameState = this.gameState.withUpdates({
            gameEnded: true,
            winner: winnerId
        });
    }

    private printGameSummary(): void {
        console.log(`\nGame completed after ${this.gameState.currentRound} rounds`);
        console.log(`Total log entries: ${this.gameLog.length}`);

        // Print final player states
        console.log('\nFinal Player States:');
        for (const player of this.gameState.players) {
            console.log(`${player.name}: Fame=${player.fame}, Resources=${JSON.stringify(player.resources)}`);
        }

        // Print log entry statistics
        const logTypes = this.gameLog.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log(`\nLog Entry Statistics:`);
        Object.entries(logTypes).forEach(([type, count]) => {
            console.log(`${type}: ${count}`);
        });
    }
} 