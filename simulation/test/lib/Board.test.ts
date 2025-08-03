import { Board } from "@/lib/Board";
import { Position, Tile } from "@/lib/types";

describe("Board", () => {
  let board: Board;

  beforeEach(() => {
    // Create a 5x5 board for testing
    board = new Board(5, 5);
  });

  describe("getTilesWithinRange", () => {
    it("should return empty array for invalid position", () => {
      const invalidPosition: Position = { row: -1, col: 0 };
      const result = board.getTilesWithinRange(invalidPosition, 1);
      expect(result).toEqual([]);
    });

    it("should return empty array for negative steps", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, -1);
      expect(result).toEqual([]);
    });

    it("should return only start tile when steps is 0 and includeStartTile is true", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 0, true);

      expect(result).toHaveLength(1);
      expect(result[0].position).toEqual(startPosition);
    });

    it("should return empty array when steps is 0 and includeStartTile is false", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 0, false);

      expect(result).toEqual([]);
    });

    it("should return correct tiles within 1 step from center position", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 1, true);

      // Should include center tile + 4 adjacent tiles
      expect(result).toHaveLength(5);

      const positions = result.map(tile => tile.position);
      expect(positions).toContainEqual({ row: 2, col: 2 }); // center
      expect(positions).toContainEqual({ row: 1, col: 2 }); // up
      expect(positions).toContainEqual({ row: 3, col: 2 }); // down
      expect(positions).toContainEqual({ row: 2, col: 1 }); // left
      expect(positions).toContainEqual({ row: 2, col: 3 }); // right
    });

    it("should return correct tiles within 1 step from center position excluding start tile", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 1, false);

      // Should include only 4 adjacent tiles
      expect(result).toHaveLength(4);

      const positions = result.map(tile => tile.position);
      expect(positions).not.toContainEqual({ row: 2, col: 2 }); // center should not be included
      expect(positions).toContainEqual({ row: 1, col: 2 }); // up
      expect(positions).toContainEqual({ row: 3, col: 2 }); // down
      expect(positions).toContainEqual({ row: 2, col: 1 }); // left
      expect(positions).toContainEqual({ row: 2, col: 3 }); // right
    });

    it("should return correct tiles within 2 steps from center position", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 2, true);

      // Should include center + 4 tiles at distance 1 + 8 tiles at distance 2
      expect(result).toHaveLength(13);

      const positions = result.map(tile => tile.position);

      // Distance 0 (center)
      expect(positions).toContainEqual({ row: 2, col: 2 });

      // Distance 1
      expect(positions).toContainEqual({ row: 1, col: 2 });
      expect(positions).toContainEqual({ row: 3, col: 2 });
      expect(positions).toContainEqual({ row: 2, col: 1 });
      expect(positions).toContainEqual({ row: 2, col: 3 });

      // Distance 2
      expect(positions).toContainEqual({ row: 0, col: 2 }); // up 2
      expect(positions).toContainEqual({ row: 4, col: 2 }); // down 2
      expect(positions).toContainEqual({ row: 2, col: 0 }); // left 2
      expect(positions).toContainEqual({ row: 2, col: 4 }); // right 2
      expect(positions).toContainEqual({ row: 1, col: 1 }); // up-left
      expect(positions).toContainEqual({ row: 1, col: 3 }); // up-right
      expect(positions).toContainEqual({ row: 3, col: 1 }); // down-left
      expect(positions).toContainEqual({ row: 3, col: 3 }); // down-right
    });

    it("should handle edge cases near board boundaries", () => {
      const cornerPosition: Position = { row: 0, col: 0 }; // top-left corner
      const result = board.getTilesWithinRange(cornerPosition, 1, true);

      // Should include corner tile + 2 adjacent tiles (down and right)
      expect(result).toHaveLength(3);

      const positions = result.map(tile => tile.position);
      expect(positions).toContainEqual({ row: 0, col: 0 }); // corner
      expect(positions).toContainEqual({ row: 1, col: 0 }); // down
      expect(positions).toContainEqual({ row: 0, col: 1 }); // right
    });

    it("should work with a tile object as input instead of position", () => {
      const startTile = board.getTileAt({ row: 2, col: 2 })!;
      const result = board.getTilesWithinRange(startTile, 1, true);

      expect(result).toHaveLength(5);
      const positions = result.map(tile => tile.position);
      expect(positions).toContainEqual({ row: 2, col: 2 });
    });

    it("should return all tiles when steps is large enough to cover entire board", () => {
      const startPosition: Position = { row: 2, col: 2 };
      const result = board.getTilesWithinRange(startPosition, 10, true);

      // Should include all 25 tiles on a 5x5 board
      expect(result).toHaveLength(25);
    });

    it("should not include duplicate tiles", () => {
      const startPosition: Position = { row: 1, col: 1 };
      const result = board.getTilesWithinRange(startPosition, 3, true);

      const positions = result.map(tile => tile.position);
      const uniquePositions = new Set(positions.map(pos => `${pos.row},${pos.col}`));

      expect(positions.length).toEqual(uniquePositions.size);
    });
  });
});