import { ActionExecutor } from "../../src/engine/ActionExecutor";
import { GameState } from "../../src/game/GameState";
import { Board } from "../../src/lib/Board";
import type { Champion, HarvestAction, MoveChampionAction, Player } from "../../src/lib/types";

describe("ActionExecutor", () => {
  let gameState: GameState;
  let actionExecutor: ActionExecutor;

  beforeEach(() => {
    // Create a basic GameState with default board and players
    gameState = createTestGameState();
    actionExecutor = new ActionExecutor();
  });

  // Helper function to create a test game state
  function createTestGameState() {
    // Create a simple 3x3 board to allow for more movement
    const board = new Board(3, 3);

    // Add tiles to the board - most are explored
    board.setTile({
      position: { row: 0, col: 0 },
      tier: 1,
      explored: true,
      tileType: "resource",
      resources: { food: 2, wood: 0, ore: 0, gold: 0 },
    });
    board.setTile({
      position: { row: 0, col: 1 },
      tier: 1,
      explored: true,
      tileType: "resource",
      resources: { food: 0, wood: 2, ore: 0, gold: 0 },
    });
    board.setTile({
      position: { row: 1, col: 0 },
      tier: 1,
      explored: true,
      tileType: "resource",
      resources: { food: 0, wood: 0, ore: 2, gold: 0 },
    });
    board.setTile({
      position: { row: 1, col: 1 },
      tier: 1,
      explored: true,
      tileType: "resource",
      resources: { food: 0, wood: 0, ore: 0, gold: 2 },
    });

    // Add an unexplored tile at (1, 2)
    board.setTile({
      position: { row: 1, col: 2 },
      tier: 2,
      explored: false,
      tileType: "resource",
      resources: { food: 1, wood: 1, ore: 0, gold: 0 },
    });

    // Fill remaining positions with empty explored tiles
    board.setTile({ position: { row: 0, col: 2 }, tier: 1, explored: true, tileType: "empty" });
    board.setTile({ position: { row: 2, col: 0 }, tier: 1, explored: true, tileType: "empty" });
    board.setTile({ position: { row: 2, col: 1 }, tier: 1, explored: true, tileType: "empty" });
    board.setTile({ position: { row: 2, col: 2 }, tier: 1, explored: true, tileType: "empty" });

    // Create a champion at position 0,0
    const champion: Champion = {
      id: 1,
      position: { row: 0, col: 0 },
      playerId: 1,
      treasures: [],
    };

    // Create a player with the champion
    const player: Player = {
      id: 1,
      name: "Player 1",
      fame: 0,
      might: 0,
      champions: [champion],
      boats: [],
      resources: { food: 5, wood: 5, ore: 5, gold: 5 },
      maxClaims: 3,
      homePosition: { row: 0, col: 0 },
    };

    // Create the initial game state
    return new GameState(
      board,
      [player],
      0, // currentPlayerIndex
      1, // currentRound
    );
  }

  describe("executeAction", () => {
    it("should handle unknown action type", async () => {
      const unknownAction = { type: "unknown" } as any;

      const result = await actionExecutor.executeAction(gameState, unknownAction);

      expect(result.success).toBe(false);
      expect(result.newGameState).toBe(gameState); // State should be unchanged
    });
  });

  describe("moveChampion", () => {
    it("should move champion successfully to adjacent tile", async () => {
      const action: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 }, // Start position
          { row: 0, col: 1 }, // Adjacent position
        ],
      };

      const result = await actionExecutor.executeAction(gameState, action);

      expect(result.success).toBe(true);

      // Verify champion position was updated
      const updatedChampion = result.newGameState.getChampionById(1, 1);
      expect(updatedChampion?.position).toEqual({ row: 0, col: 1 });
    });

    it("should grant fame when exploring unexplored tile", async () => {
      // Get the initial state and verify player starts with 0 fame
      const player = gameState.getPlayerById(1);
      expect(player?.fame).toBe(0);

      // Verify the tile at (1, 2) is unexplored (set up in createTestGameState)
      const targetTile = gameState.getTile({ row: 1, col: 2 });
      expect(targetTile?.explored).toBe(false);

      // Move champion to the unexplored tile
      const action: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 }, // Start position (home)
          { row: 1, col: 0 }, // Step 1 (south)
          { row: 1, col: 1 }, // Step 2 (east)
          { row: 1, col: 2 }, // Final position (unexplored tile)
        ],
      };

      const result = await actionExecutor.executeAction(gameState, action);

      expect(result.success).toBe(true);

      // Verify player gained fame
      const updatedPlayer = result.newGameState.getPlayerById(1);
      expect(updatedPlayer?.fame).toBe(1);

      // Verify tile is now explored
      const exploredTile = result.newGameState.getTile({ row: 1, col: 2 });
      expect(exploredTile?.explored).toBe(true);

      // Verify champion position was updated
      const updatedChampion = result.newGameState.getChampionById(1, 1);
      expect(updatedChampion?.position).toEqual({ row: 1, col: 2 });
    });

    it("should not grant fame when moving to already explored tile", async () => {
      // Get the initial state and verify player starts with 0 fame
      const player = gameState.getPlayerById(1);
      expect(player?.fame).toBe(0);

      // Move champion to an already explored tile (Tier 1 tiles start explored)
      const action: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 }, // Start position
          { row: 0, col: 1 }, // Adjacent explored tile
        ],
      };

      const result = await actionExecutor.executeAction(gameState, action);

      expect(result.success).toBe(true);

      // Verify player did not gain fame
      const updatedPlayer = result.newGameState.getPlayerById(1);
      expect(updatedPlayer?.fame).toBe(0);

      // Verify champion moved to the correct position
      const updatedChampion = result.newGameState.getChampionById(1, 1);
      expect(updatedChampion?.position).toEqual({ row: 0, col: 1 });
    });

    it("should reject a move with non-adjacent tiles", async () => {
      // Create a move champion action with a diagonal move (invalid)
      const action: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 },
          { row: 1, col: 1 }, // Diagonal move (not allowed)
        ],
      };

      // Execute the action
      const result = await actionExecutor.executeAction(gameState, action);

      // Verify the action was rejected
      expect(result.success).toBe(false);

      // Verify the champion has not moved
      const champion = result.newGameState.getChampionById(1, 1);
      expect(champion?.position).toEqual({ row: 0, col: 0 });
    });
  });

  describe("harvest", () => {
    it("should correctly harvest resources", async () => {
      const action: HarvestAction = {
        type: "harvest",
        playerId: 1,
        resources: { food: 2, wood: 1, ore: 0, gold: 0 },
      };

      // Execute the action
      const result = await actionExecutor.executeAction(gameState, action);

      // Verify the action was successful
      expect(result.success).toBe(true);

      // Verify the player's resources were updated
      const updatedPlayer = result.newGameState.getPlayerById(1)!;
      expect(updatedPlayer.resources.food).toBe(7); // 5 initial + 2 harvested
      expect(updatedPlayer.resources.wood).toBe(6); // 5 initial + 1 harvested
      expect(updatedPlayer.resources.ore).toBe(5); // 5 initial + 0 harvested
      expect(updatedPlayer.resources.gold).toBe(5); // 5 initial + 0 harvested
    });

    it("should reject negative harvest amounts", async () => {
      const action: HarvestAction = {
        type: "harvest",
        playerId: 1,
        resources: { food: -1, wood: 0, ore: 0, gold: 0 },
      };

      // Execute the action
      const result = await actionExecutor.executeAction(gameState, action);

      // Verify the action was rejected
      expect(result.success).toBe(false);

      // Verify the player's resources were not updated
      const updatedPlayer = result.newGameState.getPlayerById(1)!;
      expect(updatedPlayer.resources.food).toBe(5); // Should remain unchanged
    });
  });

  describe("tile claiming", () => {
    it("should allow a champion to claim a tile they are standing on", async () => {
      // Move champion to a resource tile first
      const moveAction: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
        claimTile: false,
      };

      const moveResult = await actionExecutor.executeAction(gameState, moveAction);
      expect(moveResult.success).toBe(true);

      // Now claim the tile they're standing on
      const claimAction: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [{ row: 0, col: 1 }], // Same position
        claimTile: true,
      };

      const result = await actionExecutor.executeAction(moveResult.newGameState, claimAction);

      expect(result.success).toBe(true);

      // Verify tile is claimed
      const claimedTile = result.newGameState.getTile({ row: 0, col: 1 });
      expect(claimedTile?.claimedBy).toBe(1);

      // Verify champion position unchanged
      const updatedChampion = result.newGameState.getChampionById(1, 1);
      expect(updatedChampion?.position).toEqual({ row: 0, col: 1 });
    });

    it("should allow a champion to move and claim a tile in the same action", async () => {
      const action: MoveChampionAction = {
        type: "moveChampion",
        playerId: 1,
        championId: 1,
        path: [
          { row: 0, col: 0 }, // Start
          { row: 0, col: 1 }, // Destination
        ],
        claimTile: true,
      };

      const result = await actionExecutor.executeAction(gameState, action);

      expect(result.success).toBe(true);

      // Verify champion moved
      const updatedChampion = result.newGameState.getChampionById(1, 1);
      expect(updatedChampion?.position).toEqual({ row: 0, col: 1 });

      // Verify tile is claimed
      const claimedTile = result.newGameState.getTile({ row: 0, col: 1 });
      expect(claimedTile?.claimedBy).toBe(1);
    });
  });
});
