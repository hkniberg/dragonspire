// Lords of Doomspire CLI Runner

import { GameSession, GameSessionConfig } from '../engine/GameSession';
import { RandomPlayer } from '../players/RandomPlayer';

export interface CLIConfig {
    maxRounds?: number;
    singleTurnTest?: boolean;
    playerNames?: string[];
}

export class CLIRunner {
    /**
     * Run a single turn test with random players
     */
    public static async runSingleTurnTest(config: CLIConfig = {}): Promise<void> {
        console.log('=== Lords of Doomspire - Single Turn Test ===\n');

        // Create random players
        const playerNames = config.playerNames || ['Alice', 'Bob', 'Charlie', 'Diana'];
        const players = playerNames.map(name => new RandomPlayer(name));

        // Create game session with just 1 round for testing
        const sessionConfig: GameSessionConfig = {
            players: players,
            maxRounds: 1
        };

        const session = new GameSession(sessionConfig);

        try {
            // Execute just one turn
            session.start();
            await session.executeTurn();

            console.log('\n=== Single Turn Test Complete ===');
            console.log('✅ Single turn execution successful!');

            // Print final game state summary
            const gameState = session.getGameState();
            const actionLog = session.getActionLog();

            if (actionLog.length > 0) {
                const turn = actionLog[0];
                console.log(`\nTurn executed by: ${turn.playerName}`);
                console.log(`Dice rolled: [${turn.diceRolls.join(', ')}]`);
                console.log(`Actions taken: ${turn.actions.length}`);
                console.log(`Turn summary: ${turn.turnSummary}`);
            }

        } catch (error) {
            console.error('❌ Single turn test failed:', error);
            throw error;
        }
    }

    /**
     * Run a complete game simulation
     */
    public static async runCompleteGame(config: CLIConfig = {}): Promise<void> {
        console.log('=== Lords of Doomspire - Complete Game Simulation ===\n');

        // Create random players
        const playerNames = config.playerNames || ['Alice', 'Bob', 'Charlie', 'Diana'];
        const players = playerNames.map(name => new RandomPlayer(name));

        // Create game session
        const sessionConfig: GameSessionConfig = {
            players: players,
            maxRounds: config.maxRounds || 10 // Limit for testing
        };

        const session = new GameSession(sessionConfig);

        try {
            await session.runToCompletion();
            console.log('✅ Complete game simulation successful!');

        } catch (error) {
            console.error('❌ Complete game simulation failed:', error);
            throw error;
        }
    }

    /**
     * Main CLI entry point
     */
    public static async main(args: string[] = []): Promise<void> {
        const config: CLIConfig = {};

        // Parse command line arguments
        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--single-turn':
                    config.singleTurnTest = true;
                    break;
                case '--max-rounds':
                    config.maxRounds = parseInt(args[i + 1]);
                    i++; // Skip next argument
                    break;
                case '--players':
                    config.playerNames = args[i + 1].split(',');
                    i++; // Skip next argument
                    break;
            }
        }

        try {
            if (config.singleTurnTest) {
                await CLIRunner.runSingleTurnTest(config);
            } else {
                await CLIRunner.runCompleteGame(config);
            }
        } catch (error) {
            console.error('CLI Runner failed:', error);
            process.exit(1);
        }
    }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
    CLIRunner.main(process.argv.slice(2));
} 