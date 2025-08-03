import { Position, Tile } from "./types";

export class Board {
  private tiles: Tile[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = this.initializeEmptyBoard();
  }

  private initializeEmptyBoard(): Tile[][] {
    const board: Tile[][] = [];
    for (let row = 0; row < this.height; row++) {
      board[row] = [];
      for (let col = 0; col < this.width; col++) {
        // Create empty tiles with default values
        board[row][col] = {
          position: { row, col },
          tileType: "empty",
        };
      }
    }
    return board;
  }

  /**
   * Set a tile at a specific position (replaces existing tile)
   */
  setTile(tile: Tile): void {
    const { row, col } = tile.position;
    if (this.isValidPosition({ row, col })) {
      this.tiles[row][col] = tile;
    } else {
      throw new Error(`Invalid position: (${row}, ${col}). Board size is ${this.height}x${this.width}`);
    }
  }

  /**
   * Get all tiles as a flat array
   */
  getAllTiles(): Tile[] {
    const allTiles: Tile[] = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        allTiles.push(this.tiles[row][col]);
      }
    }
    return allTiles;
  }

  /**
   * Get a tile at a specific position
   */
  getTileAt(position: Position): Tile | undefined {
    const { row, col } = position;
    if (this.isValidPosition(position)) {
      return this.tiles[row][col];
    }
    return undefined;
  }

  /**
   * Check if a position is valid for this board
   */
  private isValidPosition(position: Position): boolean {
    const { row, col } = position;
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  /**
   * Get the board dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get the 2D tiles array (for advanced use cases)
   */
  getTilesGrid(): Tile[][] {
    return this.tiles;
  }

  /**
   * Find tiles that match a predicate
   */
  findTiles(predicate: (tile: Tile) => boolean): Tile[] {
    return this.getAllTiles().filter(predicate);
  }

  /**
   * Execute a function for each tile with position information
   */
  forEachTile(callback: (tile: Tile, position: Position) => void): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const position = { row, col };
        const tile = this.tiles[row][col];
        callback(tile, position);
      }
    }
  }

  setTileGroupToExplored(tileGroup: number) {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.tileGroup === tileGroup) {
          tile.explored = true;
        }
      });
    });
  }

  /**
   * Get all tiles within a specified range from a starting tile
   * Uses Manhattan distance to find tiles reachable within the given number of steps
   * @param startTile The starting tile (or position)
   * @param steps Maximum number of steps/moves allowed
   * @param includeStartTile Whether to include the starting tile in the result
   * @returns Array of tiles within range
   */
  getTilesWithinRange(startTile: Tile | Position, steps: number, includeStartTile: boolean = true): Tile[] {
    const startPosition = 'position' in startTile ? startTile.position : startTile;

    if (!this.isValidPosition(startPosition) || steps < 0) {
      return [];
    }

    const result: Tile[] = [];
    const { row: startRow, col: startCol } = startPosition;

    // Iterate through all positions that could be within range
    for (let row = startRow - steps; row <= startRow + steps; row++) {
      for (let col = startCol - steps; col <= startCol + steps; col++) {
        const position: Position = { row, col };

        // Check if position is within board bounds
        if (!this.isValidPosition(position)) {
          continue;
        }

        // Calculate Manhattan distance
        const distance = Math.abs(row - startRow) + Math.abs(col - startCol);

        // Check if within range
        if (distance <= steps) {
          // Skip start tile if not including it
          if (!includeStartTile && distance === 0) {
            continue;
          }

          const tile = this.getTileAt(position);
          if (tile) {
            result.push(tile);
          }
        }
      }
    }

    return result;
  }
}
