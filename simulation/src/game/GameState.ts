// Lords of Doomspire Game State Model

import { getCoastalTilesForOceanPosition } from "../engine/actions/moveCalculator";
import { Board } from "../lib/Board";
import { BoardBuilder } from "../lib/BoardBuilder";
import type { Boat, Champion, OceanPosition, Player, Position, Tile } from "../lib/types";

export class GameState {

  public board: Board;
  public players: Player[];
  public currentPlayerIndex: number;
  public currentRound: number;
  public gameEnded: boolean;
  public winner?: number;

  constructor(
    board: Board,
    players: Player[],
    currentPlayerIndex: number = 0,
    currentRound: number = 1,
    gameEnded: boolean = false,
    winner?: number,
  ) {
    this.board = board;
    this.players = players;
    this.currentPlayerIndex = currentPlayerIndex;
    this.currentRound = currentRound;
    this.gameEnded = gameEnded;
    this.winner = winner;
  }

  /**
   * Create a new GameState with the specified player names
   */
  public static createWithPlayerNames(
    playerNames: string[],
    startingValues?: { fame?: number; might?: number; food?: number; wood?: number; ore?: number; gold?: number },
    seed?: number,
  ): GameState {
    if (playerNames.length !== 4) {
      throw new Error(`Expected 4 player names, got ${playerNames.length}`);
    }

    const board = BoardBuilder.buildBoard(seed || 0);
    const players = GameState.initializePlayersWithNames(playerNames, startingValues);

    // Create the initial game state
    const gameState = new GameState(board, players);

    // Claim home tiles for each player (according to game rules)
    gameState.claimHomeTilesForPlayers();

    return gameState;
  }

  private static initializePlayersWithNames(
    playerNames: string[],
    startingValues?: { fame?: number; might?: number; food?: number; wood?: number; ore?: number; gold?: number },
  ): Player[] {
    const players: Player[] = [];
    const startingPositions: Position[] = [
      { row: 0, col: 0 }, // Player 1
      { row: 0, col: 7 }, // Player 2
      { row: 7, col: 0 }, // Player 3
      { row: 7, col: 7 }, // Player 4
    ];
    const oceanPositions = ["nw", "ne", "sw", "se"] as const;

    // Predefined player colors - matches the UI color scheme
    const playerColors = [
      "#e74c3c", // Red
      "#3498db", // Blue
      "#2ecc71", // Green
      "#f39c12", // Orange
    ];

    const startingFame = startingValues?.fame ?? 0;
    const startingMight = startingValues?.might ?? 0;
    const startingFood = startingValues?.food ?? 0;
    const startingWood = startingValues?.wood ?? 0;
    const startingOre = startingValues?.ore ?? 0;
    const startingGold = startingValues?.gold ?? 0;

    for (let i = 0; i < 4; i++) {
      const playerName = playerNames[i];
      const champion: Champion = {
        id: 1,
        position: startingPositions[i],
        playerName: playerName,
        items: [],
      };

      const boat: Boat = {
        id: 1,
        playerName: playerName,
        position: oceanPositions[i],
      };

      players.push({
        name: playerNames[i],
        color: playerColors[i],
        fame: startingFame,
        might: startingMight,
        resources: {
          food: startingFood,
          wood: startingWood,
          ore: startingOre,
          gold: startingGold
        },
        maxClaims: 10,
        champions: [champion],
        boats: [boat],
        buildings: [], // Initialize with no buildings
        homePosition: startingPositions[i],
        extraInstructions: "", // Initialize with empty extra instructions
      });
    }

    return players;
  }

  /**
   * Claim home tiles for each player according to game rules
   * Home tiles are automatically claimed by players from the start of the game
   */
  private claimHomeTilesForPlayers(): void {
    for (const player of this.players) {
      const homeTile = this.getTile(player.homePosition);
      if (homeTile && homeTile.tileType === "home") {
        homeTile.claimedBy = player.name;
      }
    }
  }

  public getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  public getPlayer(playerName: string): Player | undefined {
    return this.players.find((p) => p.name === playerName);
  }

  public getTile(position: Position): Tile | undefined {
    return this.board.getTileAt(position) || undefined;
  }

  public getChampion(playerName: string, championId: number): Champion | undefined {
    const player = this.getPlayer(playerName);
    if (!player) {
      return undefined;
    }
    return player?.champions.find((c) => c.id === championId);
  }

  public getOpposingChampionsAtPosition(playerName: string, position: Position): Champion[] {
    const player = this.players.find((p) => p.name === playerName);
    if (!player) {
      throw new Error(`Player ${playerName} not found`);
    }

    const opposingChampions: Champion[] = [];

    // Iterate through all players
    for (const otherPlayer of this.players) {
      // Skip the current player
      if (otherPlayer.name === playerName) {
        continue;
      }

      // Check all champions of this other player
      for (const champion of otherPlayer.champions) {
        // If champion is at the specified position, add to result
        if (champion.position.row === position.row && champion.position.col === position.col) {
          opposingChampions.push(champion);
        }
      }
    }

    return opposingChampions;
  }

  public getStarredTileCount(playerName: string): number {
    const starredTileCount = this.board.findTiles(
      (tile) => tile.tileType === "resource" && tile.isStarred === true && tile.claimedBy === playerName,
    ).length;
    return starredTileCount;
  }

  /**
   * Advances to the next player's turn
   */
  public advanceToNextPlayer(): GameState {
    const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    const nextRound = nextPlayerIndex === 0 ? this.currentRound + 1 : this.currentRound;

    this.currentPlayerIndex = nextPlayerIndex;
    this.currentRound = nextRound;
    return this;
  }

  public updateChampionPosition(playerName: string, championId: number, endPosition: Position): Tile {
    const player = this.players.find((p) => p.name === playerName);
    if (!player) {
      throw new Error(`Player ${playerName} not found`);
    }
    const champion = player.champions.find((c) => c.id === championId);
    if (!champion) {
      throw new Error(`Champion ${championId} not found for player ${playerName}`);
    }
    const tile = this.getTile(endPosition);
    if (!tile) {
      throw new Error(`Tile at (${endPosition.row}, ${endPosition.col}) does not exist`);
    }

    champion.position = endPosition;
    return tile;
  }

  public moveChampionToHome(playerName: string, championId: number) {
    const player = this.players.find((p) => p.name === playerName);
    if (!player) {
      throw new Error(`Player ${playerName} not found`);
    }
    const champion = player.champions.find((c) => c.id === championId);
    if (!champion) {
      throw new Error(`Champion ${championId} not found for player ${playerName}`);
    }
    champion.position = player.homePosition;
  }

  public getClaimedTiles(playerName: string): Tile[] {
    const claimedTiles: Tile[] = [];
    for (const row of this.board.getTilesGrid()) {
      for (const tile of row) {
        if (tile.claimedBy === playerName) {
          claimedTiles.push(tile);
        }
      }
    }
    return claimedTiles;
  }

  public toJSON() {
    return {
      board: this.board.getTilesGrid(),
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      gameEnded: this.gameEnded,
      winner: this.winner,
    };
  }

  /**
   * Returns a filtered version of the game state for AI consumption.
   * Unexplored tiles only show position, tier, and explored: false.
   */
  public toAIJSON() {
    const filteredBoard: Tile[][] = [];

    // Reconstruct 2D array structure for backwards compatibility
    for (let row = 0; row < 8; row++) {
      filteredBoard[row] = [];
      for (let col = 0; col < 8; col++) {
        const tile = this.board.getTileAt({ row, col });
        if (!tile) continue;

        if (!tile.explored) {
          // For unexplored tiles, only show position, tier, and explored status
          filteredBoard[row][col] = {
            position: tile.position,
            tier: tile.tier,
            explored: false,
            // Note: intentionally omitting adventureTokens, resources, monster, etc.
          } as Tile;
        } else {
          // For explored tiles, show all information
          filteredBoard[row][col] = tile;
        }
      }
    }

    return {
      board: filteredBoard,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      gameEnded: this.gameEnded,
      winner: this.winner,
    };
  }

  /**
   * Get the number of supporting units (knights and warships) for a player at a given position
   * This implements the combat support rules where your own units provide +1 might per supporting unit
   */
  public getCombatSupport(playerName: string, combatPosition: Position): number {
    let supportCount = 0;

    // Find all adjacent positions
    const adjacentPositions = this.getAdjacentPositions(combatPosition);

    // Check for supporting knights in adjacent tiles
    for (const adjacentPos of adjacentPositions) {
      const adjacentTile = this.getTile(adjacentPos);
      if (adjacentTile) {
        // Find champions of the same player in adjacent tiles
        const supportingChampions = this.getChampionsAtPosition(playerName, adjacentPos);
        supportCount += supportingChampions.length;
      }
    }

    // Check for supporting warships in adjacent ocean zones
    const player = this.getPlayer(playerName);
    if (player) {
      for (const boat of player.boats) {
        if (this.isWarship(player) && this.isBoatAdjacentToPosition(boat.position, combatPosition)) {
          supportCount += 1;
        }
      }
    }

    return supportCount;
  }

  /**
   * Get all adjacent positions to a given position (horizontally and vertically only)
   */
  private getAdjacentPositions(position: Position): Position[] {
    const adjacent: Position[] = [];
    const { row, col } = position;

    // Check all four directions: up, down, left, right
    const directions = [
      { row: row - 1, col: col }, // up
      { row: row + 1, col: col }, // down
      { row: row, col: col - 1 }, // left
      { row: row, col: col + 1 }, // right
    ];

    for (const dir of directions) {
      if (dir.row >= 0 && dir.row < 8 && dir.col >= 0 && dir.col < 8) {
        adjacent.push(dir);
      }
    }

    return adjacent;
  }

  /**
   * Get all champions of a specific player at a given position
   */
  private getChampionsAtPosition(playerName: string, position: Position): Champion[] {
    const player = this.getPlayer(playerName);
    if (!player) return [];

    return player.champions.filter(champion =>
      champion.position.row === position.row && champion.position.col === position.col
    );
  }

  /**
   * Check if a player has the warship upgrade
   */
  private isWarship(player: Player): boolean {
    return player.buildings.includes("warshipUpgrade");
  }

  /**
   * Check if a boat's ocean position is adjacent to a given tile position
   * Warships provide +1 might to battles in tiles adjacent to their ocean zone
   */
  private isBoatAdjacentToPosition(boatPosition: OceanPosition, tilePosition: Position): boolean {
    const adjacentTiles = getCoastalTilesForOceanPosition(boatPosition);
    return adjacentTiles.some(pos =>
      pos.row === tilePosition.row && pos.col === tilePosition.col
    );
  }
}
