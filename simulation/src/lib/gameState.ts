// Lords of Doomspire Game State Model

import type {
    Champion,
    Player,
    Position,
    ResourceType,
    Tile,
    TileTier
} from './types';

export class GameState {
    public board: Tile[][];
    public players: Player[];
    public currentPlayerIndex: number;
    public currentRound: number;
    public gameEnded: boolean;
    public winner?: number;

    constructor() {
        this.board = this.initializeBoard();
        this.players = this.initializePlayers();
        this.currentPlayerIndex = 0;
        this.currentRound = 1;
        this.gameEnded = false;
    }

    private initializeBoard(): Tile[][] {
        const board: Tile[][] = [];

        for (let row = 0; row < 8; row++) {
            board[row] = [];
            for (let col = 0; col < 8; col++) {
                const position: Position = { row, col };
                const distanceFromCenter = Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5));

                let tier: TileTier;
                let explored = false;

                if (distanceFromCenter >= 2.5) {
                    tier = 1;
                    explored = true; // Tier 1 tiles start explored
                } else if (distanceFromCenter >= 1.5) {
                    tier = 2;
                } else {
                    tier = 3;
                }

                // Simplified tile generation for the model
                const tile: Tile = {
                    position,
                    tier,
                    explored,
                    resources: Math.random() < 0.6 ? this.randomResources() : undefined,
                    isStarred: Math.random() < 0.1, // 10% chance of starred resource
                };

                // Add special locations
                if (tier === 3 && row === 3 && col === 3) {
                    tile.tileType = 'doomspire';
                }

                board[row].push(tile);
            }
        }

        return board;
    }

    private randomResources(): Record<ResourceType, number> {
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        const randomType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const amount = Math.floor(Math.random() * 3) + 1;

        return {
            food: randomType === 'food' ? amount : 0,
            wood: randomType === 'wood' ? amount : 0,
            ore: randomType === 'ore' ? amount : 0,
            gold: randomType === 'gold' ? amount : 0
        };
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