// Lords of Doomspire Game State Model

import { RandomMapGenerator } from './randomMapGenerator';
import type {
    Champion,
    Player,
    Position,
    Tile
} from './types';

export class GameState {
    public board: Tile[][];
    public players: Player[];
    public currentPlayerIndex: number;
    public currentRound: number;
    public gameEnded: boolean;
    public winner?: number;

    constructor() {
        this.board = RandomMapGenerator.generateBoard();
        this.players = this.initializePlayers();
        this.currentPlayerIndex = 0;
        this.currentRound = 1;
        this.gameEnded = false;
    }

    private initializePlayers(): Player[] {
        const players: Player[] = [];
        const startingPositions: Position[] = [
            { row: 0, col: 0 }, // Player 1
            { row: 0, col: 7 }, // Player 2
            { row: 7, col: 0 }, // Player 3
            { row: 7, col: 7 }  // Player 4
        ];

        for (let i = 0; i < 4; i++) {
            const champion: Champion = {
                id: 1,
                position: startingPositions[i],
                playerId: i + 1,
                treasures: []
            };

            players.push({
                id: i + 1,
                name: `Player ${i + 1}`,
                fame: 0,
                might: 0,
                resources: { food: 1, wood: 1, ore: 0, gold: 0 },
                maxClaims: 10,
                champions: [champion],
                boats: [],
                homePosition: startingPositions[i]
            });
        }

        return players;
    }

    public getCurrentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    public getValidActions(diceRolls: number[]): string[] {
        const currentPlayer = this.getCurrentPlayer();
        const actions: string[] = [];

        for (const dieValue of diceRolls) {
            actions.push(`Move & Act (die value ${dieValue}): Move a champion up to ${dieValue} tiles and perform an action`);
            actions.push(`Harvest (die value ${dieValue}): Collect up to ${dieValue} resources from claimed tiles`);
            actions.push(`Build: Construct a building in your castle (die value doesn't matter)`);
            actions.push(`Boat Travel (die value ${dieValue}): Move boat and transport champion`);
        }

        return actions;
    }

    public toJSON() {
        return {
            board: this.board,
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentRound: this.currentRound,
            gameEnded: this.gameEnded,
            winner: this.winner
        };
    }

    /**
 * Returns a filtered version of the game state for AI consumption.
 * Unexplored tiles only show position, tier, and explored: false.
 */
    public toAIJSON() {
        const filteredBoard = this.board.map(row =>
            row.map(tile => {
                if (!tile.explored) {
                    // For unexplored tiles, only show position, tier, and explored status
                    return {
                        position: tile.position,
                        tier: tile.tier,
                        explored: false
                        // Note: intentionally omitting adventureTokens, resources, monster, etc.
                    };
                } else {
                    // For explored tiles, show all information
                    return tile;
                }
            })
        );

        return {
            board: filteredBoard,
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentRound: this.currentRound,
            gameEnded: this.gameEnded,
            winner: this.winner
        };
    }
}

// Utility function to roll D3 dice (showing 1,1,2,2,3,3)
export function rollD3(): number {
    const outcomes = [1, 1, 2, 2, 3, 3];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
}

// Utility function to roll multiple D3 dice
export function rollMultipleD3(count: number): number[] {
    return Array.from({ length: count }, () => rollD3());
} 