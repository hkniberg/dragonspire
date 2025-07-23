// Lords of Doomspire Game Utilities

import type { Position } from './types';

export class GameUtilities {
    /**
     * Check if two positions are adjacent (horizontally or vertically only, not diagonally)
     */
    static areAdjacent(pos1: Position, pos2: Position): boolean {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * Get the player ID who owns a home tile at the given position
     */
    static getHomeTileOwner(position: Position): number | undefined {
        // Home tiles are at the four corners of the 8x8 board
        // Player 1: (0,0), Player 2: (0,7), Player 3: (7,0), Player 4: (7,7)
        if (position.row === 0 && position.col === 0) {
            return 1; // Player 1
        } else if (position.row === 0 && position.col === 7) {
            return 2; // Player 2
        } else if (position.row === 7 && position.col === 0) {
            return 3; // Player 3
        } else if (position.row === 7 && position.col === 7) {
            return 4; // Player 4
        }
        return undefined; // Not a home tile
    }
} 