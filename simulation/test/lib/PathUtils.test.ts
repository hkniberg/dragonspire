import { getClosestPaths, getReachablePositions } from "../../src/lib/PathUtils";
import type { Position, Path, Bounds, ReachablePosition } from "../../src/lib/types";

describe("PathUtils", () => {
  describe("getClosestPaths", () => {
    test("returns single path when start and end are the same", () => {
      const start: Position = { row: 5, col: 3 };
      const end: Position = { row: 5, col: 3 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual([start]);
    });

    test("returns single path for horizontal movement only", () => {
      const start: Position = { row: 0, col: 0 };
      const end: Position = { row: 0, col: 3 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 }
      ]);
    });

    test("returns single path for vertical movement only", () => {
      const start: Position = { row: 1, col: 2 };
      const end: Position = { row: 4, col: 2 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual([
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 4, col: 2 }
      ]);
    });

    test("returns single path for backward horizontal movement", () => {
      const start: Position = { row: 0, col: 3 };
      const end: Position = { row: 0, col: 1 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual([
        { row: 0, col: 3 },
        { row: 0, col: 2 },
        { row: 0, col: 1 }
      ]);
    });

    test("returns single path for upward vertical movement", () => {
      const start: Position = { row: 3, col: 1 };
      const end: Position = { row: 1, col: 1 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual([
        { row: 3, col: 1 },
        { row: 2, col: 1 },
        { row: 1, col: 1 }
      ]);
    });

    test("returns two paths for 1x1 diagonal movement", () => {
      const start: Position = { row: 0, col: 0 };
      const end: Position = { row: 1, col: 1 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(2);

      // Sort paths for consistent testing
      const sortedPaths = paths.sort((a, b) => {
        // Sort by the second position in the path
        if (a[1].row !== b[1].row) return a[1].row - b[1].row;
        return a[1].col - b[1].col;
      });

      expect(sortedPaths[0]).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 }
      ]);

      expect(sortedPaths[1]).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
      ]);
    });

    test("returns correct number of paths for 2x1 movement", () => {
      const start: Position = { row: 0, col: 0 };
      const end: Position = { row: 2, col: 1 };

      const paths = getClosestPaths(start, end);

      expect(paths).toHaveLength(3);

      // All paths should have length 4 (start + 3 moves)
      expect(paths.every(path => path.length === 4)).toBe(true);

      // All paths should start at start and end at end
      expect(paths.every(path =>
        path[0].row === start.row && path[0].col === start.col &&
        path[path.length - 1].row === end.row && path[path.length - 1].col === end.col
      )).toBe(true);

      // Check that we have the expected path variations
      const pathStrings = paths.map(path =>
        path.slice(1).map(pos =>
          pos.row > path[path.indexOf(pos) - 1].row ? "D" :
            pos.row < path[path.indexOf(pos) - 1].row ? "U" :
              pos.col > path[path.indexOf(pos) - 1].col ? "R" : "L"
        ).join("")
      ).sort();

      expect(pathStrings).toEqual(["DDR", "DRD", "RDD"]);
    });

    test("handles negative direction movement", () => {
      const start: Position = { row: 3, col: 3 };
      const end: Position = { row: 1, col: 1 };

      const paths = getClosestPaths(start, end);

      // For 2 up + 2 left, we should have 4!/(2!*2!) = 6 unique paths
      expect(paths).toHaveLength(6);

      // All paths should have length 5 (start + 4 moves)
      expect(paths.every(path => path.length === 5)).toBe(true);

      // All paths should start at start and end at end
      expect(paths.every(path =>
        path[0].row === start.row && path[0].col === start.col &&
        path[path.length - 1].row === end.row && path[path.length - 1].col === end.col
      )).toBe(true);
    });

    test("handles mixed positive and negative movement", () => {
      const start: Position = { row: 1, col: 3 };
      const end: Position = { row: 3, col: 1 };

      const paths = getClosestPaths(start, end);

      // For 2 down + 2 left, we should have 4!/(2!*2!) = 6 unique paths
      expect(paths).toHaveLength(6);

      // All paths should have length 5 (start + 4 moves)
      expect(paths.every(path => path.length === 5)).toBe(true);

      // All paths should start at start and end at end
      expect(paths.every(path =>
        path[0].row === start.row && path[0].col === start.col &&
        path[path.length - 1].row === end.row && path[path.length - 1].col === end.col
      )).toBe(true);
    });

    test("returns correct number of unique paths for larger distances", () => {
      const start: Position = { row: 0, col: 0 };
      const end: Position = { row: 2, col: 2 };

      const paths = getClosestPaths(start, end);

      // For 2 right + 2 down, we should have 4!/(2!*2!) = 6 unique paths
      expect(paths).toHaveLength(6);

      // All paths should have length 5 (start + 4 moves)
      expect(paths.every(path => path.length === 5)).toBe(true);

      // Verify all paths are unique
      const pathStrings = new Set(paths.map(path => JSON.stringify(path)));
      expect(pathStrings.size).toBe(6);
    });

    test("ensures all returned paths are indeed shortest", () => {
      const start: Position = { row: 1, col: 1 };
      const end: Position = { row: 4, col: 3 };

      const paths = getClosestPaths(start, end);
      const expectedLength = Math.abs(end.row - start.row) + Math.abs(end.col - start.col) + 1;

      expect(paths.every(path => path.length === expectedLength)).toBe(true);
    });
  });

  describe("getReachablePositions", () => {
    test("returns only starting position when maxSteps is 0", () => {
      const startPos: Position = { row: 2, col: 2 };
      const bounds: Bounds = { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 };

      const reachable = getReachablePositions(startPos, 0, bounds);

      expect(reachable).toHaveLength(1);
      expect(reachable[0].endPos).toEqual(startPos);
      expect(reachable[0].steps).toBe(0);
      expect(reachable[0].paths).toEqual([[startPos]]);
    });

    test("returns correct positions for maxSteps of 1", () => {
      const startPos: Position = { row: 2, col: 2 };
      const bounds: Bounds = { minRow: 0, maxRow: 4, minCol: 0, maxCol: 4 };

      const reachable = getReachablePositions(startPos, 1, bounds);

      // Should include start position (0 steps) + 4 adjacent positions (1 step each)
      expect(reachable).toHaveLength(5);

      const positions = reachable.map(r => r.endPos);
      expect(positions).toContainEqual({ row: 2, col: 2 }); // start
      expect(positions).toContainEqual({ row: 1, col: 2 }); // up
      expect(positions).toContainEqual({ row: 3, col: 2 }); // down
      expect(positions).toContainEqual({ row: 2, col: 1 }); // left
      expect(positions).toContainEqual({ row: 2, col: 3 }); // right

      // Check steps are correct
      const startResult = reachable.find(r => r.endPos.row === 2 && r.endPos.col === 2);
      expect(startResult?.steps).toBe(0);

      const adjacentResults = reachable.filter(r => r.steps === 1);
      expect(adjacentResults).toHaveLength(4);
    });

    test("returns correct positions for maxSteps of 2", () => {
      const startPos: Position = { row: 1, col: 1 };
      const bounds: Bounds = { minRow: 0, maxRow: 3, minCol: 0, maxCol: 3 };

      const reachable = getReachablePositions(startPos, 2, bounds);

      // Should include:
      // 0 steps: 1 position (start): (1,1)
      // 1 step: 4 positions (adjacent): (0,1), (2,1), (1,0), (1,2)
      // 2 steps: 6 positions (Manhattan distance 2 within bounds): (0,0), (0,2), (1,3), (2,0), (2,2), (3,1)
      expect(reachable).toHaveLength(11);

      const stepCounts = reachable.reduce((acc, r) => {
        acc[r.steps] = (acc[r.steps] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      expect(stepCounts[0]).toBe(1); // start position
      expect(stepCounts[1]).toBe(4); // adjacent positions
      expect(stepCounts[2]).toBe(6); // distance-2 positions within bounds
    });

    test("respects bounds correctly", () => {
      const startPos: Position = { row: 0, col: 0 };
      const bounds: Bounds = { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 };

      const reachable = getReachablePositions(startPos, 3, bounds);

      // Only positions within bounds should be returned
      const positions = reachable.map(r => r.endPos);
      expect(positions).toHaveLength(4);
      expect(positions).toContainEqual({ row: 0, col: 0 });
      expect(positions).toContainEqual({ row: 0, col: 1 });
      expect(positions).toContainEqual({ row: 1, col: 0 });
      expect(positions).toContainEqual({ row: 1, col: 1 });

      // Check that no positions outside bounds are included
      expect(positions.every(pos =>
        pos.row >= bounds.minRow && pos.row <= bounds.maxRow &&
        pos.col >= bounds.minCol && pos.col <= bounds.maxCol
      )).toBe(true);
    });

    test("correctly calculates paths for reachable positions", () => {
      const startPos: Position = { row: 0, col: 0 };
      const bounds: Bounds = { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 };

      const reachable = getReachablePositions(startPos, 2, bounds);

      // Find the diagonal position (1,1) which should have 2 paths
      const diagonalResult = reachable.find(r => r.endPos.row === 1 && r.endPos.col === 1);
      expect(diagonalResult).toBeDefined();
      expect(diagonalResult!.steps).toBe(2);
      expect(diagonalResult!.paths).toHaveLength(2);

      // Verify that all paths are valid shortest paths
      expect(diagonalResult!.paths.every(path => path.length === 3)).toBe(true);
      expect(diagonalResult!.paths.every(path =>
        path[0].row === startPos.row && path[0].col === startPos.col &&
        path[2].row === 1 && path[2].col === 1
      )).toBe(true);
    });

    test("handles starting position at edge of bounds", () => {
      const startPos: Position = { row: 0, col: 0 };
      const bounds: Bounds = { minRow: 0, maxRow: 2, minCol: 0, maxCol: 0 };

      const reachable = getReachablePositions(startPos, 2, bounds);

      // Should only include positions in the single column
      expect(reachable).toHaveLength(3);
      expect(reachable.map(r => r.endPos)).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 }
      ]);

      expect(reachable.map(r => r.steps)).toEqual([0, 1, 2]);
    });

    test("returns empty array when startPos is outside bounds", () => {
      const startPos: Position = { row: 5, col: 5 };
      const bounds: Bounds = { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 };

      const reachable = getReachablePositions(startPos, 2, bounds);

      // All positions in bounds are too far away
      expect(reachable).toHaveLength(0);
    });

    test("includes all properties in ReachablePosition objects", () => {
      const startPos: Position = { row: 1, col: 1 };
      const bounds: Bounds = { minRow: 1, maxRow: 1, minCol: 1, maxCol: 2 };

      const reachable = getReachablePositions(startPos, 1, bounds);

      expect(reachable).toHaveLength(2);

      reachable.forEach(r => {
        expect(r.startPos).toEqual(startPos);
        expect(r.endPos).toBeDefined();
        expect(typeof r.steps).toBe('number');
        expect(Array.isArray(r.paths)).toBe(true);
        expect(r.paths.length).toBeGreaterThan(0);
      });
    });
  });
});