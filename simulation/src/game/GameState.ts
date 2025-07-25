// Lords of Doomspire Game State Model

import { Board } from "../lib/Board";
import { BoardBuilder } from "../lib/BoardBuilder";
import type { Champion, Player, Position, Tile } from "../lib/types";

export class GameState {
  public readonly board: Board;
  public readonly players: Player[];
  public readonly currentPlayerIndex: number;
  public readonly currentRound: number;
  public readonly gameEnded: boolean;
  public readonly winner?: number;

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
    startingValues?: { fame?: number; might?: number },
  ): GameState {
    if (playerNames.length !== 4) {
      throw new Error(`Expected 4 player names, got ${playerNames.length}`);
    }

    const board = BoardBuilder.buildBoard();
    const players = GameState.initializePlayersWithNames(playerNames, startingValues);

    return new GameState(board, players);
  }

  private static initializePlayersWithNames(
    playerNames: string[],
    startingValues?: { fame?: number; might?: number },
  ): Player[] {
    const players: Player[] = [];
    const startingPositions: Position[] = [
      { row: 0, col: 0 }, // Player 1
      { row: 0, col: 7 }, // Player 2
      { row: 7, col: 0 }, // Player 3
      { row: 7, col: 7 }, // Player 4
    ];
    const oceanPositions = ["nw", "ne", "sw", "se"] as const;

    const startingFame = startingValues?.fame ?? 0;
    const startingMight = startingValues?.might ?? 0;

    for (let i = 0; i < 4; i++) {
      const champion: Champion = {
        id: 1,
        position: startingPositions[i],
        playerId: i + 1,
        treasures: [],
      };

      const boat = {
        id: 1,
        playerId: i + 1,
        position: oceanPositions[i],
      };

      players.push({
        id: i + 1,
        name: playerNames[i],
        fame: startingFame,
        might: startingMight,
        resources: { food: 1, wood: 1, ore: 0, gold: 0 },
        maxClaims: 10,
        champions: [champion],
        boats: [boat],
        homePosition: startingPositions[i],
        extraInstructions: "", // Initialize with empty extra instructions
      });
    }

    return players;
  }

  public getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  public getPlayerById(playerId: number): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  public getTile(position: Position): Tile | undefined {
    return this.board.getTileAt(position) || undefined;
  }

  public getChampionById(playerId: number, championId: number): Champion | undefined {
    const player = this.getPlayerById(playerId);
    return player?.champions.find((c) => c.id === championId);
  }

  public updatePlayerExtraInstructions(playerId: number, extraInstructions: string): GameState {
    const updatedPlayers = this.players.map((player) =>
      player.id === playerId ? { ...player, extraInstructions } : player,
    );

    return this.withUpdates({ players: updatedPlayers });
  }

  public getValidActions(diceRolls: number[]): string[] {
    const currentPlayer = this.getCurrentPlayer();
    const actions: string[] = [];

    for (const dieValue of diceRolls) {
      actions.push(`Move & Act (die value ${dieValue}): Move a champion up to ${dieValue} tiles and perform an action`);
      actions.push(`Harvest (die value ${dieValue}): Collect up to ${dieValue} resources from claimed tiles`);
      actions.push(`Build: Construct a building in your castle (die value doesn't matter)`);
      actions.push(`Boat Travel (die value ${dieValue}): Move boat and transport champion`);
    }

    return actions;
  }

  /**
   * Creates a new immutable GameState with updated properties
   */
  public withUpdates(
    updates: Partial<{
      board: Board;
      players: Player[];
      currentPlayerIndex: number;
      currentRound: number;
      gameEnded: boolean;
      winner: number;
    }>,
  ): GameState {
    return new GameState(
      updates.board || this.board,
      updates.players || this.players,
      updates.currentPlayerIndex !== undefined ? updates.currentPlayerIndex : this.currentPlayerIndex,
      updates.currentRound !== undefined ? updates.currentRound : this.currentRound,
      updates.gameEnded !== undefined ? updates.gameEnded : this.gameEnded,
      updates.winner !== undefined ? updates.winner : this.winner,
    );
  }

  /**
   * Advances to the next player's turn
   */
  public advanceToNextPlayer(): GameState {
    const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    const nextRound = nextPlayerIndex === 0 ? this.currentRound + 1 : this.currentRound;

    return this.withUpdates({
      currentPlayerIndex: nextPlayerIndex,
      currentRound: nextRound,
    });
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
}

// Utility function to roll D3 dice (showing 1,1,2,2,3,3)
export function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

// Utility function to roll multiple D3 dice
export function rollMultipleD3(count: number): number[] {
  return Array.from({ length: count }, () => rollD3());
}
