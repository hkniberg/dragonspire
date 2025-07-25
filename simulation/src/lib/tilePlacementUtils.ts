import type { Position } from "./types";

export type Rotation = 0 | 1 | 2 | 3;

/**
 * Figure out how to place a trio (L-shaped group of 3 tiles) on the board at the specified position with rotation
 * @param cornerPosition The position where the corner tile should be placed
 * @param rotation Number of 90-degree clockwise rotations (0, 1, 2, 3)
 * @returns Array of positions where the trio tiles would be placed: [corner, right, below]
 */
export function calculateTrioPlacement(cornerPosition: Position, rotation: Rotation): Position[] {
  const { row, col } = cornerPosition;

  // Define the relative positions for each rotation
  // Original: corner(0,0), right(0,+1), below(+1,0)
  const rotationOffsets = [
    // Rotation 0: no rotation
    { right: { row: 0, col: 1 }, below: { row: 1, col: 0 } },
    // Rotation 1: 90° clockwise
    { right: { row: 1, col: 0 }, below: { row: 0, col: -1 } },
    // Rotation 2: 180° clockwise
    { right: { row: 0, col: -1 }, below: { row: -1, col: 0 } },
    // Rotation 3: 270° clockwise
    { right: { row: -1, col: 0 }, below: { row: 0, col: 1 } },
  ];

  const offsets = rotationOffsets[rotation];

  const cornerPos = { row, col };
  const rightPos = {
    row: row + offsets.right.row,
    col: col + offsets.right.col,
  };
  const belowPos = {
    row: row + offsets.below.row,
    col: col + offsets.below.col,
  };

  return [cornerPos, rightPos, belowPos];
}
