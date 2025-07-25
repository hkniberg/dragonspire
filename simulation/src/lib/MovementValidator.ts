// Lords of Doomspire Movement Validation

import { GameUtilities } from "./GameUtilities";
import type { Champion, Position } from "./types";

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
        errorMessage: "Invalid path: empty path",
      };
    }

    // Check if path starts from champion's current position - if so, remove the starting position
    let actualPath = path;
    const startPos = path[0];
    if (startPos.row === champion.position.row && startPos.col === champion.position.col) {
      // Path includes starting position, remove it for validation
      actualPath = path.slice(1);
    }

    // If after removing start position we have no moves, that's valid (staying in place)
    if (actualPath.length === 0) {
      return { isValid: true };
    }

    // For non-empty paths, validate that the first position is adjacent to champion's position
    if (!GameUtilities.areAdjacent(champion.position, actualPath[0])) {
      return {
        isValid: false,
        errorMessage: `Invalid path: first move from (${champion.position.row}, ${champion.position.col}) to (${actualPath[0].row}, ${actualPath[0].col}) is not adjacent`,
      };
    }

    // Validate each step in the remaining path is adjacent
    for (let i = 1; i < actualPath.length; i++) {
      if (!GameUtilities.areAdjacent(actualPath[i - 1], actualPath[i])) {
        return {
          isValid: false,
          errorMessage: `Invalid path: positions (${actualPath[i - 1].row}, ${actualPath[i - 1].col}) and (${actualPath[i].row}, ${actualPath[i].col}) are not adjacent`,
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
        errorMessage: "Invalid path: empty path",
      };
    }

    // For now, just ensure path is not empty
    // Additional boat-specific validation can be added here
    // Ocean tiles are represented as strings, so different validation logic applies
    return { isValid: true };
  }
}
