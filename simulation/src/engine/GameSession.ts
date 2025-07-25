// Lords of Doomspire Game Session Manager

import { GameState, rollMultipleD3 } from '../game/GameState';
import { formatActionLogEntry } from '../lib/actionLogFormatter';
import { CARDS, GameDecks } from '../lib/cards';
import { GameAction } from '../lib/types';
import { ActionLogEntry, ActionResult, ExecuteActionFunction, Player } from '../players/Player';
import { ActionExecutor } from './ActionExecutor';

export type GameSessionState = 'setup' | 'playing' | 'finished';

export interface GameSessionConfig {
    players: Player[];
    maxRounds?: number; // Optional limit for testing
    startingValues?: { fame?: number; might?: number }; // Optional starting fame and might
}

export class GameSession {
    private gameState: GameState;
    private players: Player[];
    private sessionState: GameSessionState;
    private maxRounds: number;
    private actionLog: ActionLogEntry[];
    private gameDecks: GameDecks;
    private actionExecutor: ActionExecutor;

    constructor(config: GameSessionConfig) {
        // Create GameState with the correct player names from the start
        const playerNames = config.players.map(player => player.getName());
        this.gameState = GameState.createWithPlayerNames(playerNames, config.startingValues);
        this.players = config.players;
        this.sessionState = 'setup';
        this.maxRounds = config.maxRounds || 100; // Default limit to prevent infinite games
        this.actionLog = [];
        this.gameDecks = new GameDecks(CARDS);
        this.actionExecutor = new ActionExecutor();
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

        // Track actions for this turn
        const turnActions: Array<{ action: GameAction; result: ActionResult }> = [];

        // Create the execute action function that the player will use
        let currentState = this.gameState;
        const executeAction: ExecuteActionFunction = async (action: GameAction, diceValues?: number[]) => {
            const result = await this.actionExecutor.executeAction(currentState, action, diceValues, this.gameDecks, currentPlayer);

            // Track the action
            turnActions.push({ action, result });

            // Update current state for next action
            if (result.success) {
                currentState = result.newGameState;
            }

            return result;
        };

        // Let the player execute their turn
        let diaryEntry: string | undefined;
        try {
            diaryEntry = await currentPlayer.executeTurn(this.gameState, diceRolls, executeAction, this.actionLog);
        } catch (error) {
            console.error(`Error during ${currentPlayer.getName()}'s turn:`, error);
        }

        // Update game state to the final state after all actions
        this.gameState = currentState;

        // Create the turn log entry
        const turnLogEntry: ActionLogEntry = {
            round: this.gameState.currentRound,
            playerId: playerId,
            playerName: currentPlayer.getName(),
            diceRolls: diceRolls,
            actions: turnActions,
            diaryEntry: diaryEntry
        };

        // Log using unified format (includes diary entries)
        const unifiedLog = formatActionLogEntry(turnLogEntry);
        console.log('\n' + unifiedLog.join('\n'));

        // Add to action log
        this.actionLog.push(turnLogEntry);

        // Check for victory conditions
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

    /**
     * Update the game state (useful for UI changes like extra instructions)
     */
    public updateGameState(newGameState: GameState): void {
        this.gameState = newGameState;
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