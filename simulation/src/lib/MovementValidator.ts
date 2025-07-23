// Lords of Doomspire Movement Validation

import { GameUtilities } from './GameUtilities';
import type { Champion, Position } from './types';

export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

export class MovementValidator {
    /**
     * Validate a movement path for a champion
     */
    static validateChampionPath(champion: Champion, path: Position[]): ValidationResult {
        // Validate path is not empty
        if (path.length === 0) {
            return {
                isValid: false,
                errorMessage: 'Invalid path: empty path'
            };
        }

        // Check that path starts from champion's current position
        const startPos = path[0];
        if (startPos.row !== champion.position.row || startPos.col !== champion.position.col) {
            return {
                isValid: false,
                errorMessage: `Invalid path: path must start from champion's current position (${champion.position.row}, ${champion.position.col})`
            };
        }

        // Validate each step in the path is adjacent
        for (let i = 1; i < path.length; i++) {
            if (!GameUtilities.areAdjacent(path[i - 1], path[i])) {
                return {
                    isValid: false,
                    errorMessage: `Invalid path: positions (${path[i - 1].row}, ${path[i - 1].col}) and (${path[i].row}, ${path[i].col}) are not adjacent`
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Validate a boat movement path (ocean tiles as strings)
     */
    static validateBoatPath(path: string[]): ValidationResult {
        if (path.length === 0) {
            return {
                isValid: false,
                errorMessage: 'Invalid path: empty path'
            };
        }

        // For now, just ensure path is not empty
        // Additional boat-specific validation can be added here
        // Ocean tiles are represented as strings, so different validation logic applies
        return { isValid: true };
    }
} 