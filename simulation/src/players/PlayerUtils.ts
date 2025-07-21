import { GameState } from '../game/GameState';
import { Position } from '../lib/types';

export interface Direction {
    row: number;
    col: number;
    name: string;
}

export const DIRECTIONS: Direction[] = [
    { row: -1, col: 0, name: 'north' },
    { row: 1, col: 0, name: 'south' },
    { row: 0, col: -1, name: 'west' },
    { row: 0, col: 1, name: 'east' }
];

/**
 * Check if a position is within the board bounds
 */
export function isValidBoardPosition(position: Position): boolean {
    return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

/**
 * Check if a champion can move in a given direction from their current position
 * Returns the maximum number of steps they can take in that direction
 */
export function getMaxStepsInDirection(
    gameState: GameState,
    championPosition: Position,
    direction: Direction,
    maxSteps: number
): number {
    let steps = 0;
    let currentPos = championPosition;

    for (let step = 1; step <= maxSteps; step++) {
        const nextPos = {
            row: currentPos.row + direction.row,
            col: currentPos.col + direction.col
        };

        // Check if next position is within board bounds
        if (!isValidBoardPosition(nextPos)) {
            break;
        }

        // Check if tile exists at this position
        const tile = gameState.getTile(nextPos);
        if (!tile) {
            break;
        }

        // TODO: Add more validation rules here as needed
        // - Check for other champions (except in non-combat zones)
        // - Check for home tile restrictions
        // - etc.

        steps = step;
        currentPos = nextPos;
    }

    return steps;
}

/**
 * Get all valid directions a champion can move in, with the number of steps possible
 */
export function getValidMoveDirections(
    gameState: GameState,
    championPosition: Position,
    dieValue: number
): Array<{ direction: Direction; maxSteps: number }> {
    const validDirections = [];

    for (const direction of DIRECTIONS) {
        const maxSteps = getMaxStepsInDirection(gameState, championPosition, direction, dieValue);
        if (maxSteps > 0) {
            validDirections.push({ direction, maxSteps });
        }
    }

    return validDirections;
}

/**
 * Generate a path in a given direction for a specified number of steps
 */
export function generatePath(
    startPosition: Position,
    direction: Direction,
    steps: number
): Position[] {
    const path: Position[] = [startPosition];
    let currentPos = startPosition;

    for (let step = 0; step < steps; step++) {
        const nextPos = {
            row: currentPos.row + direction.row,
            col: currentPos.col + direction.col
        };
        path.push(nextPos);
        currentPos = nextPos;
    }

    return path;
} 