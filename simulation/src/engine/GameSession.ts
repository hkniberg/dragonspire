// Lords of Doomspire Game Session Manager

import { GameState, rollMultipleD3 } from '../game/GameState';
import { GameLogger } from '../lib/gameLogger';
import { GameAction } from '../lib/types';
import { ActionResult, ExecuteActionFunction, Player } from '../players/Player';
import { ActionExecutor } from './ActionExecutor';

export type GameSessionState = 'setup' | 'playing' | 'finished';

export interface GameSessionConfig {
    players: Player[];
    maxRounds?: number; // Optional limit for testing
}

export class GameSession {
    private gameState: GameState;
    private players: Player[];
    private sessionState: GameSessionState;
    private maxRounds: number;
    private actionLog: Array<{
        round: number;
        playerId: number;
        playerName: string;
        diceRolls: number[];
        actions: Array<{ action: GameAction; result: ActionResult }>;
        turnSummary: string;
    }>;

    constructor(config: GameSessionConfig) {
        this.gameState = new GameState();
        this.players = config.players;
        this.sessionState = 'setup';
        this.maxRounds = config.maxRounds || 100; // Default limit to prevent infinite games
        this.actionLog = [];
    }

    /**
     * Start the game session
     */
    public start(): void {
        if (this.sessionState !== 'setup') {
            throw new Error(`Cannot start game: session is in state ${this.sessionState}`);
        }

        console.log('=== Lords of Doomspire Game Session Starting ===');
        console.log(`Players: ${this.players.map(p => p.getName()).join(', ')}`);
        console.log('================================================');

        this.sessionState = 'playing';
    }

    /**
     * Execute a single turn for the current player
     */
    public async executeTurn(): Promise<void> {
        if (this.sessionState !== 'playing') {
            throw new Error(`Cannot execute turn: session is in state ${this.sessionState}`);
        }

        const currentPlayer = this.players[this.gameState.currentPlayerIndex];
        const playerId = this.gameState.getCurrentPlayer().id;

        // Roll dice (base 2 dice + 1 per additional champion)
        const additionalChampions = this.gameState.getCurrentPlayer().champions.length - 1;
        const diceCount = 2 + additionalChampions;
        const diceRolls = rollMultipleD3(diceCount);

        // Log turn header and dice using GameLogger
        console.log('\n' + GameLogger.formatTurnHeader(this.gameState.currentRound, playerId, currentPlayer.getName()));
        console.log(GameLogger.formatDiceRolls(diceRolls));

        // Track actions for this turn
        const turnActions: Array<{ action: GameAction; result: ActionResult }> = [];

        // Create the execute action function that the player will use
        let currentState = this.gameState;
        const executeAction: ExecuteActionFunction = (action: GameAction) => {
            const result = ActionExecutor.executeAction(currentState, action);

            // Track the action
            turnActions.push({ action, result });

            // Update current state for next action
            if (result.success) {
                currentState = result.newGameState;
            }

            return result;
        };

        // Let the player execute their turn
        try {
            await currentPlayer.executeTurn(this.gameState, diceRolls, executeAction);
        } catch (error) {
            console.error(`Error during ${currentPlayer.getName()}'s turn:`, error);
        }

        // Update game state to the final state after all actions
        this.gameState = currentState;

        // Generate turn summary and log it
        const turnSummary = this.generateTurnSummary(turnActions);
        console.log(GameLogger.formatTurnSummary(turnSummary));

        // Log the turn
        this.actionLog.push({
            round: this.gameState.currentRound,
            playerId: playerId,
            playerName: currentPlayer.getName(),
            diceRolls: diceRolls,
            actions: turnActions,
            turnSummary: turnSummary
        });

        // Check for victory conditions
        const victoryCheck = ActionExecutor.checkVictory(this.gameState);
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

        // Advance to next player
        this.gameState = this.gameState.advanceToNextPlayer();
    }

    /**
     * Run the complete game session until finished
     */
    public async runToCompletion(): Promise<void> {
        this.start();

        while (this.sessionState === 'playing') {
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
     * Get the session state
     */
    public getSessionState(): GameSessionState {
        return this.sessionState;
    }

    /**
     * Get the action log
     */
    public getActionLog() {
        return [...this.actionLog];
    }

    private endGame(winnerId?: number, condition?: string): void {
        this.sessionState = 'finished';

        if (winnerId) {
            const winner = this.players.find(p => this.gameState.getPlayerById(winnerId)?.id === winnerId);
            console.log(`\n🎉 GAME WON! 🎉`);
            console.log(`Winner: ${winner?.getName() || `Player ${winnerId}`}`);
            if (condition) {
                console.log(`Victory Condition: ${condition}`);
            }
        } else {
            console.log(`\nGame ended without a winner`);
        }

        this.gameState = this.gameState.withUpdates({
            gameEnded: true,
            winner: winnerId
        });
    }

    private generateTurnSummary(turnActions: Array<{ action: GameAction; result: ActionResult }>): string {
        if (turnActions.length === 0) {
            return 'No actions taken';
        }

        const successfulActions = turnActions.filter(ta => ta.result.success);
        const failedActions = turnActions.filter(ta => !ta.result.success);

        let summary = `${successfulActions.length} successful action(s)`;
        if (failedActions.length > 0) {
            summary += `, ${failedActions.length} failed action(s)`;
        }

        return summary;
    }

    private printGameSummary(): void {
        console.log(`\nGame completed after ${this.gameState.currentRound} rounds`);
        console.log(`Total turns played: ${this.actionLog.length}`);

        // Print final player states
        console.log('\nFinal Player States:');
        for (const player of this.gameState.players) {
            console.log(`${player.name}: Fame=${player.fame}, Resources=${JSON.stringify(player.resources)}`);
        }

        // Print action statistics
        const totalActions = this.actionLog.reduce((sum, turn) => sum + turn.actions.length, 0);
        const successfulActions = this.actionLog.reduce((sum, turn) =>
            sum + turn.actions.filter(a => a.result.success).length, 0);

        console.log(`\nAction Statistics:`);
        console.log(`Total actions attempted: ${totalActions}`);
        console.log(`Successful actions: ${successfulActions}`);
        console.log(`Success rate: ${totalActions > 0 ? (successfulActions / totalActions * 100).toFixed(1) : 0}%`);
    }
} 