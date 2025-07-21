// Lords of Doomspire CLI Runner

import * as dotenv from 'dotenv';
import { GameSession, GameSessionConfig } from '../engine/GameSession';
import { Claude } from '../lib/llm';
import { ClaudePlayer } from '../players/ClaudePlayer';
import { Player } from '../players/Player';
import { RandomPlayer } from '../players/RandomPlayer';

// Load environment variables
dotenv.config();

export interface PlayerConfig {
    name: string;
    type: 'random' | 'claude';
}

export interface CLIConfig {
    maxRounds?: number;
    singleTurnTest?: boolean;
    specificTurns?: number;
    playerConfigs?: PlayerConfig[];
}

export class CLIRunner {
    private static createPlayer(config: PlayerConfig): Player {
        switch (config.type) {
            case 'random':
                return new RandomPlayer(config.name);
            case 'claude':
                const apiKey = process.env.ANTHROPIC_API_KEY;
                if (!apiKey) {
                    throw new Error('ANTHROPIC_API_KEY not found in environment variables. Please add it to your .env file.');
                }
                const claude = new Claude(apiKey);
                return new ClaudePlayer(config.name, claude);
            default:
                throw new Error(`Unknown player type: ${config.type}`);
        }
    }

    private static parsePlayerArgs(args: string[]): PlayerConfig[] {
        const playerConfigs: PlayerConfig[] = [];
        const defaultNames = ['Alice', 'Bob', 'Charlie', 'Diana'];

        // Look for player specifications like p1=random, p2=claude, etc.
        const playerArgs = args.filter(arg => arg.match(/^p[1-4]=(random|claude)$/));

        if (playerArgs.length === 0) {
            // No player specifications, default to all random players
            return defaultNames.map(name => ({ name, type: 'random' }));
        }

        // Initialize with default random players
        for (let i = 0; i < 4; i++) {
            playerConfigs.push({ name: defaultNames[i], type: 'random' });
        }

        // Override with specified player types
        for (const arg of playerArgs) {
            const match = arg.match(/^p([1-4])=(random|claude)$/);
            if (match) {
                const playerIndex = parseInt(match[1]) - 1;
                const playerType = match[2] as 'random' | 'claude';

                if (playerIndex >= 0 && playerIndex < 4) {
                    playerConfigs[playerIndex].type = playerType;
                }
            }
        }

        return playerConfigs;
    }

    /**
     * Run a single turn test with specified players
     */
    public static async runSingleTurnTest(config: CLIConfig = {}): Promise<void> {
        console.log('=== Lords of Doomspire - Single Turn Test ===\n');

        // Create players based on configuration
        const playerConfigs = config.playerConfigs || [
            { name: 'Alice', type: 'random' },
            { name: 'Bob', type: 'random' },
            { name: 'Charlie', type: 'random' },
            { name: 'Diana', type: 'random' }
        ];

        console.log('Player Configuration:');
        playerConfigs.forEach((config, index) => {
            console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
        });
        console.log();

        const players = playerConfigs.map(config => this.createPlayer(config));

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
     * Run a specific number of turns
     */
    public static async runSpecificTurns(config: CLIConfig = {}): Promise<void> {
        const numTurns = config.specificTurns || 1;
        console.log(`=== Lords of Doomspire - ${numTurns} Turn(s) Simulation ===\n`);

        // Create players based on configuration
        const playerConfigs = config.playerConfigs || [
            { name: 'Alice', type: 'random' },
            { name: 'Bob', type: 'random' },
            { name: 'Charlie', type: 'random' },
            { name: 'Diana', type: 'random' }
        ];

        console.log('Player Configuration:');
        playerConfigs.forEach((config, index) => {
            console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
        });
        console.log();

        const players = playerConfigs.map(config => this.createPlayer(config));

        // Create game session with enough rounds to complete the requested turns
        // We need at least numTurns / players.length rounds, but let's be generous
        const maxRounds = Math.max(Math.ceil(numTurns / players.length), 10);
        const sessionConfig: GameSessionConfig = {
            players: players,
            maxRounds: maxRounds
        };

        const session = new GameSession(sessionConfig);

        try {
            session.start();

            // Execute the specified number of turns
            for (let i = 0; i < numTurns; i++) {
                await session.executeTurn();

                // Check if game ended early due to victory condition
                if (session.getGameState().gameEnded) {
                    console.log(`\nGame ended after ${i + 1} turn(s) due to victory condition.`);
                    break;
                }
            }

            console.log(`\n=== ${numTurns} Turn(s) Simulation Complete ===`);
            console.log('✅ Specific turns simulation successful!');

            // Print summary
            const actionLog = session.getActionLog();
            console.log(`\nTotal turns executed: ${actionLog.length}`);

            if (actionLog.length > 0) {
                console.log('Turn summary:');
                actionLog.forEach((turn, index) => {
                    console.log(`  Turn ${index + 1}: ${turn.playerName} - ${turn.turnSummary}`);
                });
            }

        } catch (error) {
            console.error(`❌ ${numTurns} turn(s) simulation failed:`, error);
            throw error;
        }
    }

    /**
     * Run a complete game simulation
     */
    public static async runCompleteGame(config: CLIConfig = {}): Promise<void> {
        console.log('=== Lords of Doomspire - Complete Game Simulation ===\n');

        // Create players based on configuration
        const playerConfigs = config.playerConfigs || [
            { name: 'Alice', type: 'random' },
            { name: 'Bob', type: 'random' },
            { name: 'Charlie', type: 'random' },
            { name: 'Diana', type: 'random' }
        ];

        console.log('Player Configuration:');
        playerConfigs.forEach((config, index) => {
            console.log(`  Player ${index + 1}: ${config.name} (${config.type})`);
        });
        console.log();

        const players = playerConfigs.map(config => this.createPlayer(config));

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

        // Parse player configurations first
        config.playerConfigs = this.parsePlayerArgs(args);

        // Parse other command line arguments
        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--single-turn':
                    config.singleTurnTest = true;
                    break;
                case '--turns':
                    config.specificTurns = parseInt(args[i + 1]);
                    i++; // Skip next argument
                    break;
                case '--max-rounds':
                    config.maxRounds = parseInt(args[i + 1]);
                    i++; // Skip next argument
                    break;
                // Skip player arguments as they're already parsed
                default:
                    if (args[i].match(/^p[1-4]=(random|claude)$/)) {
                        // Skip player arguments
                        continue;
                    }
                    break;
            }
        }

        try {
            if (config.singleTurnTest) {
                await CLIRunner.runSingleTurnTest(config);
            } else if (config.specificTurns) {
                await CLIRunner.runSpecificTurns(config);
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