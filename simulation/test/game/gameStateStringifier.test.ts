import { GameState } from '../../src/game/GameState';
import { GameStateStringifier } from '../../src/game/gameStateStringifier';
import { Board } from '../../src/lib/Board';
import type { Player, Position, Tile } from '../../src/lib/types';

describe('GameStateStringifier', () => {
    test('should stringify game state to match expected markdown format', () => {
        const sampleGameState = createSampleGameState();
        const result = GameStateStringifier.stringify(sampleGameState);

        const expected = `# Game session
- Current round: 2
- Current player: Jim

# Players

## Jim
- Might: 0
- Fame: 3
- Home: (0,7)
- Resource stockpile: 1 food, 2 wood
- champion1 at (3,3)
  - Has broken-shield
  - Has rusty-sword
- champion2 at (3,5)
- champion1 at (2,5)
- boat1 at (sw)
- claims (2 tiles of max 10):
  - Tile (0,5) providing 2 food, 1 gold (blockaded by Bob champion1)
  - Tile (0,7) providing 1 ore

## Bob
- Might: 1
- Fame: 2
- Home: (0,0)
- Resource stockpile: 1 ore
- champion1 at (0,5)
- boat1 at (ne)
- boat2 at (se)
- no claims

## Alice
- Might: 0
- Fame: 0
- Home: (7,0)
- Resource stockpile: 1 food, 1 wood
- champion1 at (7,0)
- boat1 at (sw)
- no claims

## David
- Might: 0
- Fame: 0
- Home: (7,7)
- Resource stockpile: 1 food, 1 wood
- champion1 at (7,7)
- boat1 at (se)
- no claims

# Board

Tile (0,0)
- Home tile for Bob

Tile (0,5)
- Resource tile providing 2 food, 1 gold
- Starred
- Claimed by Jim
- Bob champion1 is here

Tile (0,7)
- Resource tile providing 1 ore
- Claimed by Jim

Tile (1,6)
- Tier 1 adventure tile
- Remaining adventure tokens: 0
- Monster: bandit (might 3)

Tile (2,5)
- Tier 2 adventure tile
- Remaining adventure tokens: 2
- Jim champion1 is here

Tile (2,6)
- Resource tile providing 1 wood
- Unclaimed
- Monster: wolf (might 6)

Tile (3,3)
- Unexplored tier 1 tile
- Jim champion1 is here

Tile (3,5)
- Chapel
- Jim champion2 is here

Tile (3,6)
- Trader

Tile (3,7)
- Mercenary camp

Tile (4,4)
- Doomspire Dragon (might 13)

Tile (7,0)
- Home tile for Alice
- Alice champion1 is here

Tile (7,7)
- Home tile for David
- David champion1 is here`;

        expect(result).toBe(expected);
    });
});

function createSampleGameState(): GameState {
    // Create the board
    const board = new Board(8, 8);

    // Initialize all tiles
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            board.setTile(createBasicTile(row, col));
        }
    }

    // Set up specific tiles from the example
    // Tile (0,5) - Resource tile, starred, claimed by Jim, with Bob champion1
    board.setTile({
        position: { row: 0, col: 5 },
        tier: 1,
        explored: true,
        tileType: 'resource',
        resources: { food: 2, wood: 0, ore: 0, gold: 1 },
        isStarred: true,
        claimedBy: 1
    });

    // Tile (0,7) - Resource tile, claimed by Jim, with Jim champion1
    board.setTile({
        position: { row: 0, col: 7 },
        tier: 1,
        explored: true,
        tileType: 'resource',
        resources: { food: 0, wood: 0, ore: 1, gold: 0 },
        claimedBy: 1
    });

    // Tile (2,6) - Resource tile with monster
    board.setTile({
        position: { row: 2, col: 6 },
        tier: 1,
        explored: true,
        tileType: 'resource',
        resources: { food: 0, wood: 1, ore: 0, gold: 0 },
        monster: {
            id: 'wolf',
            name: 'wolf',
            tier: 1,
            icon: '🐺',
            might: 6,
            fame: 2,
            resources: { food: 1, wood: 0, ore: 0, gold: 0 }
        }
    });

    // Tile (2,7) - Unexplored tier 2 tile
    board.setTile({
        position: { row: 2, col: 7 },
        tier: 2,
        explored: false
    });

    // Tile (2,5) - Adventure tile with tokens, Jim champion1 (moved from 2,8 to 2,5 to stay in bounds)
    board.setTile({
        position: { row: 2, col: 5 },
        tier: 2,
        explored: true,
        tileType: 'adventure',
        adventureTokens: 2
    });

    // Tile (1,6) - Adventure tile with monster (moved from 1,8 to 1,6 to stay in bounds)
    board.setTile({
        position: { row: 1, col: 6 },
        tier: 1,
        explored: true,
        tileType: 'adventure',
        adventureTokens: 0,
        monster: {
            id: 'bandit',
            name: 'bandit',
            tier: 1,
            icon: '🗡️',
            might: 3,
            fame: 1,
            resources: { food: 0, wood: 0, ore: 0, gold: 1 }
        }
    });

    // Tile (4,4) - Doomspire
    board.setTile({
        position: { row: 4, col: 4 },
        tier: 3,
        explored: true,
        tileType: 'doomspire'
    });

    // Tile (3,5) - Chapel, Jim champion2
    board.setTile({
        position: { row: 3, col: 5 },
        tier: 1,
        explored: true,
        tileType: 'chapel'
    });

    // Tile (3,6) - Trader
    board.setTile({
        position: { row: 3, col: 6 },
        tier: 1,
        explored: true,
        tileType: 'trader'
    });

    // Tile (3,7) - Mercenary
    board.setTile({
        position: { row: 3, col: 7 },
        tier: 1,
        explored: true,
        tileType: 'mercenary'
    });

    // Create players
    const players: Player[] = [
        {
            id: 1,
            name: 'Jim',
            fame: 3,
            might: 0,
            resources: { food: 1, wood: 2, ore: 0, gold: 0 },
            maxClaims: 10,
            homePosition: { row: 0, col: 7 },
            champions: [
                {
                    id: 1,
                    position: { row: 3, col: 3 },
                    playerId: 1,
                    treasures: ['broken-shield', 'rusty-sword']
                },
                {
                    id: 2,
                    position: { row: 3, col: 5 },
                    playerId: 1,
                    treasures: []
                }
            ],
            boats: [
                {
                    id: 1,
                    playerId: 1,
                    position: 'sw'
                }
            ]
        },
        {
            id: 2,
            name: 'Bob',
            fame: 2,
            might: 1,
            resources: { food: 0, wood: 0, ore: 1, gold: 0 },
            maxClaims: 10,
            homePosition: { row: 0, col: 0 },
            champions: [
                {
                    id: 1,
                    position: { row: 0, col: 5 },
                    playerId: 2,
                    treasures: []
                }
            ],
            boats: [
                {
                    id: 1,
                    playerId: 2,
                    position: 'ne'
                },
                {
                    id: 2,
                    playerId: 2,
                    position: 'se'
                }
            ]
        },
        {
            id: 3,
            name: 'Alice',
            fame: 0,
            might: 0,
            resources: { food: 1, wood: 1, ore: 0, gold: 0 },
            maxClaims: 10,
            homePosition: { row: 7, col: 0 },
            champions: [
                {
                    id: 1,
                    position: { row: 7, col: 0 },
                    playerId: 3,
                    treasures: []
                }
            ],
            boats: [
                {
                    id: 1,
                    playerId: 3,
                    position: 'sw'
                }
            ]
        },
        {
            id: 4,
            name: 'David',
            fame: 0,
            might: 0,
            resources: { food: 1, wood: 1, ore: 0, gold: 0 },
            maxClaims: 10,
            homePosition: { row: 7, col: 7 },
            champions: [
                {
                    id: 1,
                    position: { row: 7, col: 7 },
                    playerId: 4,
                    treasures: []
                }
            ],
            boats: [
                {
                    id: 1,
                    playerId: 4,
                    position: 'se'
                }
            ]
        }
    ];

    // Also add a champion at (2,5) for Jim
    players[0].champions.push({
        id: 1, // This will be confusing with multiple champion1s, but it matches the example
        position: { row: 2, col: 5 },
        playerId: 1,
        treasures: []
    });

    return new GameState(
        board,
        players,
        0, // Jim is current player (index 0)
        2  // Round 2
    );
}

function createBasicTile(row: number, col: number): Tile {
    const position: Position = { row, col };

    // Set home tiles
    if ((row === 0 && col === 0) || (row === 0 && col === 7) ||
        (row === 7 && col === 0) || (row === 7 && col === 7)) {
        return {
            position,
            tier: 1,
            explored: true,
            tileType: 'home'
        };
    }

    // Default to unexplored tier 1 tiles
    return {
        position,
        tier: 1,
        explored: false
    };
} 