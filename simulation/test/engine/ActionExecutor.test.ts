import { ActionExecutor } from '../../src/engine/ActionExecutor';
import { GameState } from '../../src/game/GameState';
import type { Champion, ClaimTileAction, HarvestAction, MoveChampionAction, Player, Tile } from '../../src/lib/types';

describe('ActionExecutor', () => {
    let gameState: GameState;

    beforeEach(() => {
        // Create a basic GameState with default board and players
        gameState = new GameState();
    });

    // Helper function to create a test game state
    function createTestGameState() {
        // Create a simple 2x2 board
        const board: Tile[][] = [
            [
                { position: { row: 0, col: 0 }, tier: 1, explored: true, tileType: 'resource', resources: { food: 2, wood: 0, ore: 0, gold: 0 } },
                { position: { row: 0, col: 1 }, tier: 1, explored: true, tileType: 'resource', resources: { food: 0, wood: 2, ore: 0, gold: 0 } }
            ],
            [
                { position: { row: 1, col: 0 }, tier: 1, explored: true, tileType: 'resource', resources: { food: 0, wood: 0, ore: 2, gold: 0 } },
                { position: { row: 1, col: 1 }, tier: 1, explored: true, tileType: 'resource', resources: { food: 0, wood: 0, ore: 0, gold: 2 } }
            ]
        ];

        // Create a champion at position 0,0
        const champion: Champion = {
            id: 1,
            position: { row: 0, col: 0 },
            playerId: 1,
            treasures: []
        };

        // Create a player with the champion
        const player: Player = {
            id: 1,
            name: 'Player 1',
            fame: 0,
            might: 0,
            champions: [champion],
            boats: [],
            resources: { food: 5, wood: 5, ore: 5, gold: 5 },
            maxClaims: 3,
            homePosition: { row: 0, col: 0 }
        };

        // Create the initial game state
        return new GameState(
            board,
            [player],
            0,  // currentPlayerIndex
            1   // currentRound
        );
    }

    describe('executeAction', () => {
        it('should handle unknown action type', () => {
            const unknownAction = { type: 'unknown' } as any;

            const result = ActionExecutor.executeAction(gameState, unknownAction);

            expect(result.success).toBe(false);
            expect(result.summary).toContain('Unknown action type');
        });
    });

    describe('moveChampion', () => {
        it('should move champion successfully to adjacent tile', () => {
            const action: MoveChampionAction = {
                type: 'moveChampion',
                playerId: 1,
                championId: 1,
                path: [
                    { row: 0, col: 0 }, // Start position
                    { row: 0, col: 1 }  // Adjacent position
                ]
            };

            const result = ActionExecutor.executeAction(gameState, action);

            expect(result.success).toBe(true);
            expect(result.summary).toContain('moved champion');

            // Verify champion position was updated
            const updatedChampion = result.newGameState.getChampionById(1, 1);
            expect(updatedChampion?.position).toEqual({ row: 0, col: 1 });
        });

        it('should grant fame when exploring unexplored tile', () => {
            // Get the initial state and verify player starts with 0 fame
            const player = gameState.getPlayerById(1);
            expect(player?.fame).toBe(0);

            // Manually create an unexplored tile at position (3, 3) - this should be Tier 2
            const updatedBoard = gameState.board.map((row, rowIndex) =>
                row.map((tile, colIndex) =>
                    rowIndex === 3 && colIndex === 3
                        ? { ...tile, explored: false }
                        : tile
                )
            );

            const gameStateWithUnexploredTile = gameState.withUpdates({ board: updatedBoard });

            // Verify the tile is unexplored
            const targetTile = gameStateWithUnexploredTile.getTile({ row: 3, col: 3 });
            expect(targetTile?.explored).toBe(false);

            // Move champion to an unexplored tile
            const action: MoveChampionAction = {
                type: 'moveChampion',
                playerId: 1,
                championId: 1,
                path: [
                    { row: 0, col: 0 }, // Start position (home)
                    { row: 1, col: 0 }, // Step 1
                    { row: 2, col: 0 }, // Step 2  
                    { row: 3, col: 0 }, // Step 3
                    { row: 3, col: 1 }, // Step 4
                    { row: 3, col: 2 }, // Step 5
                    { row: 3, col: 3 }  // Final position (unexplored tile)
                ]
            };

            const result = ActionExecutor.executeAction(gameStateWithUnexploredTile, action);

            expect(result.success).toBe(true);
            expect(result.summary).toContain('explored a new tile');
            expect(result.summary).toContain('gained 1 Fame');

            // Verify player gained fame
            const updatedPlayer = result.newGameState.getPlayerById(1);
            expect(updatedPlayer?.fame).toBe(1);

            // Verify tile is now explored
            const exploredTile = result.newGameState.getTile({ row: 3, col: 3 });
            expect(exploredTile?.explored).toBe(true);

            // Verify champion position was updated
            const updatedChampion = result.newGameState.getChampionById(1, 1);
            expect(updatedChampion?.position).toEqual({ row: 3, col: 3 });
        });

        it('should not grant fame when moving to already explored tile', () => {
            // Get the initial state and verify player starts with 0 fame
            const player = gameState.getPlayerById(1);
            expect(player?.fame).toBe(0);

            // Move champion to an already explored tile (Tier 1 tiles start explored)
            const action: MoveChampionAction = {
                type: 'moveChampion',
                playerId: 1,
                championId: 1,
                path: [
                    { row: 0, col: 0 }, // Start position
                    { row: 0, col: 1 }  // Adjacent explored tile
                ]
            };

            const result = ActionExecutor.executeAction(gameState, action);

            expect(result.success).toBe(true);
            expect(result.summary).not.toContain('explored a new tile');
            expect(result.summary).not.toContain('gained 1 Fame');

            // Verify player did not gain fame
            const updatedPlayer = result.newGameState.getPlayerById(1);
            expect(updatedPlayer?.fame).toBe(0);
        });

        it('should reject a move with non-adjacent tiles', () => {
            const gameState = createTestGameState();

            // Create a move champion action with a diagonal move (invalid)
            const action: MoveChampionAction = {
                type: 'moveChampion',
                playerId: 1,
                championId: 1,
                path: [
                    { row: 0, col: 0 },
                    { row: 1, col: 1 }  // Diagonal move (not allowed)
                ]
            };

            // Execute the action
            const result = ActionExecutor.executeAction(gameState, action);

            // Verify the action was rejected
            expect(result.success).toBe(false);

            // Verify the error message
            expect(result.summary).toContain('not adjacent');

            // Verify the champion has not moved
            const champion = result.newGameState.getChampionById(1, 1);
            expect(champion?.position).toEqual({ row: 0, col: 0 });
        });
    });

    describe('executeAction - harvest', () => {
        it('should correctly harvest resources', () => {
            const gameState = createTestGameState();
            const initialResources = gameState.getPlayerById(1)!.resources;

            // Create a harvest action
            const action: HarvestAction = {
                type: 'harvest',
                playerId: 1,
                resources: {
                    food: 2,
                    wood: 1,
                    ore: 0,
                    gold: 0
                }
            };

            // Execute the action
            const result = ActionExecutor.executeAction(gameState, action);

            // Verify the action was successful
            expect(result.success).toBe(true);

            // Verify the resources were added correctly
            const newResources = result.newGameState.getPlayerById(1)!.resources;
            expect(newResources.food).toBe(initialResources.food + 2);
            expect(newResources.wood).toBe(initialResources.wood + 1);
            expect(newResources.ore).toBe(initialResources.ore);
            expect(newResources.gold).toBe(initialResources.gold);

            // Verify the summary is correct
            expect(result.summary).toBe('Player 1 harvested 2 food, 1 wood');
        });

        it('should reject negative harvest amounts', () => {
            const gameState = createTestGameState();

            // Create a harvest action with negative amount
            const action: HarvestAction = {
                type: 'harvest',
                playerId: 1,
                resources: {
                    food: -1,  // Negative harvest (not allowed)
                    wood: 0,
                    ore: 0,
                    gold: 0
                }
            };

            // Execute the action
            const result = ActionExecutor.executeAction(gameState, action);

            // Verify the action was rejected
            expect(result.success).toBe(false);

            // Verify the error message
            expect(result.summary).toContain('negative food');

            // Verify the resources didn't change
            const newResources = result.newGameState.getPlayerById(1)!.resources;
            expect(newResources).toEqual(gameState.getPlayerById(1)!.resources);
        });
    });

    describe('executeAction - claimTile', () => {
        it('should allow a champion to claim a tile they are standing on', () => {
            const gameState = createTestGameState();

            // Create a claim tile action for the champion's current position
            const action: ClaimTileAction = {
                type: 'claimTile',
                playerId: 1,
                championId: 1,
                position: { row: 0, col: 0 }
            };

            // Execute the action
            const result = ActionExecutor.executeAction(gameState, action);

            // Verify the action was successful
            expect(result.success).toBe(true);

            // Verify the tile was claimed
            const tile = result.newGameState.getTile({ row: 0, col: 0 });
            expect(tile?.claimedBy).toBe(1);

            // Verify player's maxClaims remains unchanged (it's a fixed maximum)
            const player = result.newGameState.getPlayerById(1);
            expect(player?.maxClaims).toBe(3); // Should remain the same

            // Verify the summary is correct
            expect(result.summary).toContain('claimed resource tile at (0, 0)');
        });

        it('should reject claiming a tile the champion is not on', () => {
            const gameState = createTestGameState();

            // Create a claim tile action for a position the champion is not at
            const action: ClaimTileAction = {
                type: 'claimTile',
                playerId: 1,
                championId: 1,
                position: { row: 0, col: 1 }  // Champion is at 0,0
            };

            // Execute the action
            const result = ActionExecutor.executeAction(gameState, action);

            // Verify the action was rejected
            expect(result.success).toBe(false);

            // Verify the error message
            expect(result.summary).toContain('not at position');

            // Verify no tile was claimed
            const tile = result.newGameState.getTile({ row: 0, col: 1 });
            expect(tile?.claimedBy).toBeUndefined();

            // Verify player's claim count was not reduced
            const player = result.newGameState.getPlayerById(1);
            expect(player?.maxClaims).toBe(3);
        });
    });
}); 