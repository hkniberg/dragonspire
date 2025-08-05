import type { Position, Path, Bounds, ReachablePosition } from "./types";

/**
 * Generates all permutations of an array
 */
function generatePermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const permutations = generatePermutations(remaining);

    for (const perm of permutations) {
      result.push([current, ...perm]);
    }
  }

  return result;
}

/**
 * Removes duplicate arrays from an array of arrays
 */
function removeDuplicatePaths(paths: Path[]): Path[] {
  const unique: Path[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const pathStr = JSON.stringify(path);
    if (!seen.has(pathStr)) {
      seen.add(pathStr);
      unique.push(path);
    }
  }

  return unique;
}

/**
 * Returns all shortest Manhattan distance paths from startPos to endPos.
 * Manhattan distance only allows horizontal and vertical movement.
 * 
 * @param startPos Starting position
 * @param endPos Target position
 * @returns Array of paths, each being an array of positions including start and end
 */
export function getClosestPaths(startPos: Position, endPos: Position): Path[] {
  // If start and end are the same, return a path with just the start position
  if (startPos.row === endPos.row && startPos.col === endPos.col) {
    return [[startPos]];
  }

  const rowDiff = endPos.row - startPos.row;
  const colDiff = endPos.col - startPos.col;

  // Create array of moves needed
  const moves: Array<{ deltaRow: number; deltaCol: number }> = [];

  // Add horizontal moves
  for (let i = 0; i < Math.abs(colDiff); i++) {
    moves.push({ deltaRow: 0, deltaCol: colDiff > 0 ? 1 : -1 });
  }

  // Add vertical moves  
  for (let i = 0; i < Math.abs(rowDiff); i++) {
    moves.push({ deltaRow: rowDiff > 0 ? 1 : -1, deltaCol: 0 });
  }

  // Generate all permutations of moves
  const movePermutations = generatePermutations(moves);

  // Convert move sequences to position paths
  const paths: Path[] = [];
  for (const moveSequence of movePermutations) {
    const path: Path = [startPos];
    let currentPos = { ...startPos };

    for (const move of moveSequence) {
      currentPos = {
        row: currentPos.row + move.deltaRow,
        col: currentPos.col + move.deltaCol
      };
      path.push({ ...currentPos });
    }

    paths.push(path);
  }

  // Remove duplicate paths (can happen with repeated moves)
  return removeDuplicatePaths(paths);
}

/**
 * Calculates the Manhattan distance between two positions
 */
function getManhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Returns all positions reachable within maxSteps from startPos, along with
 * the minimum steps needed and all shortest paths to reach each position.
 * 
 * @param startPos Starting position
 * @param maxSteps Maximum number of steps allowed
 * @param bounds Boundary constraints for valid positions
 * @returns Array of ReachablePosition objects
 */
export function getReachablePositions(
  startPos: Position,
  maxSteps: number,
  bounds: Bounds
): ReachablePosition[] {
  const reachablePositions: ReachablePosition[] = [];

  // Iterate through all positions within bounds
  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      const endPos: Position = { row, col };
      const steps = getManhattanDistance(startPos, endPos);

      // Check if position is reachable within maxSteps
      if (steps <= maxSteps) {
        const paths = getClosestPaths(startPos, endPos);

        reachablePositions.push({
          startPos,
          endPos,
          steps,
          paths
        });
      }
    }
  }

  return reachablePositions;
}