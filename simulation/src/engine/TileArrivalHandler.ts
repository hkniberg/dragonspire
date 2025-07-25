// Lords of Doomspire Tile Arrival Handler

import { GameState } from "../game/GameState";
import { GameDecks } from "../lib/cards";
import { GameSettings } from "../lib/GameSettings";
import { GameUtilities } from "../lib/GameUtilities";
import type { Monster, Position } from "../lib/types";
import { ActionResult, Player } from "../players/Player";
import { CombatResolver } from "./CombatResolver";
import { EventCardResolver } from "./EventCardResolver";

export interface ArrivalOptions {
  claimTile?: boolean;
  gameDecks?: GameDecks;
  currentPlayer?: Player;
}

export class TileArrivalHandler {
  private eventCardResolver: EventCardResolver;

  constructor(private combatResolver: CombatResolver = new CombatResolver()) {
    this.eventCardResolver = new EventCardResolver();
  }

  /**
   * Handles all the logic for a champion arriving at a tile (exploration, battles, claiming, etc.)
   */
  async handleChampionArrival(
    gameState: GameState,
    playerId: number,
    championId: number,
    destination: Position,
    options: ArrivalOptions = {},
  ): Promise<ActionResult> {
    const { claimTile = false, gameDecks, currentPlayer } = options;

    const player = gameState.getPlayerById(playerId);
    if (!player) {
      return {
        newGameState: gameState,
        summary: `Player ${playerId} not found`,
        success: false,
      };
    }

    const champion = gameState.getChampionById(playerId, championId);
    if (!champion) {
      return {
        newGameState: gameState,
        summary: `Champion ${championId} not found for player ${playerId}`,
        success: false,
      };
    }

    const destinationTile = gameState.getTile(destination);
    if (!destinationTile) {
      return {
        newGameState: gameState,
        summary: `Invalid destination: tile at (${destination.row}, ${destination.col}) does not exist`,
        success: false,
      };
    }

    // Validate home tile access
    if (destinationTile.tileType === "home") {
      const homeOwner = GameUtilities.getHomeTileOwner(destination);
      if (homeOwner && homeOwner !== playerId) {
        return {
          newGameState: gameState,
          summary: `Cannot enter home tile at (${destination.row}, ${destination.col}): belongs to player ${homeOwner}`,
          success: false,
        };
      }
    }

    // Check for champions on destination tile
    const destinationChampions = gameState.players
      .flatMap((p) => p.champions)
      .filter((c) => c.position.row === destination.row && c.position.col === destination.col);

    let battleSummary = "";
    let updatedGameState = gameState;

    // Handle champion vs champion battles first
    if (destinationChampions.length > 0) {
      const existingChampion = destinationChampions[0];

      // Allow staying in the same position (e.g., to claim a tile)
      if (existingChampion.playerId === playerId && existingChampion.id === championId) {
        // Champion is staying in the same position - this is allowed
      } else if (existingChampion.playerId === playerId) {
        // Different champion from same player - not allowed
        return {
          newGameState: gameState,
          summary: `Cannot move to tile (${destination.row}, ${destination.col}): already occupied by your champion${existingChampion.id}`,
          success: false,
        };
      } else {
        // Champion vs champion battle
        const defendingPlayer = gameState.getPlayerById(existingChampion.playerId);
        if (!defendingPlayer) {
          return {
            newGameState: gameState,
            summary: `Defending player ${existingChampion.playerId} not found`,
            success: false,
          };
        }

        const combatResult = this.combatResolver.resolveChampionCombat(player, defendingPlayer, existingChampion);

        if (!combatResult.attackerWins) {
          // Attacker lost - cannot move to tile
          const updatedPlayers = gameState.players.map((p) =>
            p.id === player.id ? combatResult.updatedAttackingPlayer : p,
          );

          return {
            newGameState: gameState.withUpdates({ players: updatedPlayers }),
            summary: `Champion battle: ${combatResult.summary} - cannot move to tile`,
            success: false,
          };
        } else {
          // Attacker won - update both players and continue with tile logic
          const updatedPlayers = gameState.players.map((p) => {
            if (p.id === player.id) return combatResult.updatedAttackingPlayer;
            if (p.id === defendingPlayer.id) return combatResult.updatedDefendingPlayer;
            return p;
          });

          updatedGameState = gameState.withUpdates({ players: updatedPlayers });
          battleSummary = ` and ${combatResult.summary}`;
        }
      }
    }

    // Check for existing monsters on the tile and handle combat BEFORE claiming
    let updatedBoard = updatedGameState.board;
    let updatedPlayer = updatedGameState.getPlayerById(playerId)!;
    let existingMonsterCombatSummary = "";

    if (destinationTile.monster) {
      // There's an existing monster on this tile - must defeat it first
      const combatResult = this.combatResolver.resolveMonsterCombat(updatedPlayer, champion, destinationTile.monster);

      if (combatResult.championReturnedHome) {
        // Champion lost and went home
        const updatedChampions = combatResult.updatedPlayer.champions;
        const finalPlayer = { ...combatResult.updatedPlayer, champions: updatedChampions };
        const finalPlayers = updatedGameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

        const newGameState = updatedGameState.withUpdates({
          board: updatedBoard,
          players: finalPlayers,
        });

        return {
          newGameState,
          summary: `Champion${championId} fought ${destinationTile.monster.name} and ${combatResult.summary}`,
          success: true,
        };
      } else {
        // Champion won - remove monster from tile and continue
        updatedPlayer = combatResult.updatedPlayer;
        existingMonsterCombatSummary = ` and ${combatResult.summary}`;

        // Remove the monster from the tile
        destinationTile.monster = undefined;
      }
    }

    // If tile is not explored, reveal it
    if (!destinationTile.explored) {
      destinationTile.explored = true;

      // If tile has a group, explore all tiles in the same group
      if (destinationTile.tileGroup !== undefined) {
        const tilesToExplore = updatedGameState.board.findTiles(
          (tile) => tile.tileGroup === destinationTile.tileGroup && !tile.explored,
        );

        tilesToExplore.forEach((tile) => {
          tile.explored = true;
        });
      }

      // Award 1 fame for exploring an unexplored tile (per game rules)
      updatedPlayer = {
        ...updatedPlayer,
        fame: updatedPlayer.fame + 1,
      };
    }

    // Now validate claiming if requested (after monster combat)
    if (claimTile) {
      // Check if tile is a resource tile
      if (destinationTile.tileType !== "resource") {
        return {
          newGameState: gameState,
          success: false,
          summary: `Cannot claim ${destinationTile.tileType} tile`,
        };
      }

      // Check if tile is already claimed
      if (destinationTile.claimedBy !== undefined) {
        return {
          newGameState: gameState,
          success: false,
          summary: "Tile is already claimed",
        };
      }

      // Check if player has reached max claims
      const currentClaimedCount = updatedGameState.board.findTiles((tile) => tile.claimedBy === playerId).length;

      if (currentClaimedCount >= player.maxClaims) {
        return {
          newGameState: gameState,
          success: false,
          summary: "Player has reached maximum number of claims",
        };
      }

      // Claim the tile
      destinationTile.claimedBy = playerId;
    }

    // Initialize cardDrawn variable for tracking any card draws
    let cardDrawn = undefined;

    // Handle adventure tile logic
    if (destinationTile.tileType === "adventure" || destinationTile.tileType === "oasis") {
      if (destinationTile.adventureTokens && destinationTile.adventureTokens > 0) {
        // Remove one adventure token
        destinationTile.adventureTokens = Math.max(0, destinationTile.adventureTokens - 1);

        // Note: Fame is only awarded for exploring new tiles, not for taking adventure tokens

        // Draw a card if gameDecks is available
        if (gameDecks && destinationTile.tier) {
          const drawnCard = gameDecks.drawCard(destinationTile.tier, 1);
          if (drawnCard) {
            if (drawnCard.type === "event" && currentPlayer) {
              // Handle event card
              const eventResult = await this.eventCardResolver.resolveEventCard(
                updatedGameState,
                currentPlayer,
                drawnCard.id,
              );
              updatedGameState = eventResult.newGameState;

              // Get the event definition to get the display name
              const eventCard = await import("../content/eventCards").then((m) => m.getEventCardById(drawnCard.id));
              const displayName = eventCard ? eventCard.name : drawnCard.id;

              cardDrawn = {
                cardType: "event",
                cardName: displayName,
                effect: eventResult.effect,
              };
            } else {
              // For non-event cards or when currentPlayer is not available
              cardDrawn = {
                cardType: drawnCard.type,
                cardName: drawnCard.id,
                effect: `drew ${drawnCard.type} card (not yet implemented)`,
              };
            }
          }
        }
      }
    } else if (destinationTile.tileType === "doomspire") {
      // Handle dragon encounter at doomspire
      return this.handleDragonEncounter(
        updatedGameState,
        playerId,
        championId,
        destination,
        updatedPlayer,
        champion,
        battleSummary,
        existingMonsterCombatSummary,
      );
    }

    // Create new game state with champion moved
    const updatedChampions = updatedPlayer.champions.map((c) =>
      c.id === championId ? { ...c, position: destination } : c,
    );

    const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
    const updatedPlayers = updatedGameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

    const newGameState = updatedGameState.withUpdates({
      board: updatedBoard,
      players: updatedPlayers,
    });

    // Generate descriptive summary based on what happened at the tile
    let arrivalSummary = this.generateArrivalSummary(newGameState, destinationTile, claimTile, playerId, destination);

    // Include card draw information in summary if a card was drawn
    let fullSummary = `Champion${championId} ${arrivalSummary}${battleSummary}${existingMonsterCombatSummary}`;
    if (cardDrawn) {
      fullSummary += ` and drew ${cardDrawn.cardName} card: ${cardDrawn.effect}`;
    }

    return {
      newGameState,
      summary: fullSummary,
      success: true,
      cardDrawn,
    };
  }

  /**
   * Generate a descriptive summary of what happened when arriving at a tile
   */
  private generateArrivalSummary(
    gameState: GameState,
    tile: any,
    claimedTile: boolean,
    playerId: number,
    destination: Position,
  ): string {
    const tileDescription = this.getTileDescription(tile);

    // Check if we just claimed this tile
    if (claimedTile && tile.claimedBy === playerId) {
      return `claimed ${tileDescription}`;
    }

    // Check if this tile is claimed by another player (blockading)
    if (tile.claimedBy !== undefined && tile.claimedBy !== playerId) {
      const ownerPlayer = gameState.getPlayerById(tile.claimedBy);
      const ownerName = ownerPlayer ? ownerPlayer.name : `Player ${tile.claimedBy}`;
      return `blockading ${ownerName}'s ${tileDescription}`;
    }

    // Default case - just arrived at the tile
    return `arrived at ${tileDescription}`;
  }

  /**
   * Get a descriptive string for a tile including its type and resources
   */
  private getTileDescription(tile: any): string {
    if (tile.tileType === "resource" && tile.resources) {
      const resourceList = Object.entries(tile.resources)
        .filter(([_, amount]) => (amount as number) > 0)
        .map(([resource, _]) => resource)
        .join(", ");

      return resourceList ? `resource tile with ${resourceList}` : "resource tile";
    }

    switch (tile.tileType) {
      case "adventure":
        return "adventure tile";
      case "oasis":
        return "oasis tile";
      case "home":
        return "home tile";
      case "chapel":
        return "chapel tile";
      case "trader":
        return "trader tile";
      case "mercenary":
        return "mercenary tile";
      case "doomspire":
        return "doomspire tile";
      default:
        return "tile";
    }
  }

  /**
   * Handle dragon encounter at doomspire - check victory conditions first, then dragon combat if needed
   */
  private handleDragonEncounter(
    gameState: GameState,
    playerId: number,
    championId: number,
    destination: Position,
    updatedPlayer: any,
    champion: any,
    battleSummary: string,
    existingMonsterCombatSummary: string,
  ): ActionResult {
    // Award fame for reaching doomspire
    updatedPlayer = {
      ...updatedPlayer,
      fame: updatedPlayer.fame + 1,
    };

    // Check alternative victory conditions first (player can win without fighting dragon)

    // Check fame victory (10+ fame)
    if (updatedPlayer.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
      // Update champion position and return victory
      const updatedChampions = updatedPlayer.champions.map((c: any) =>
        c.id === championId ? { ...c, position: destination } : c,
      );
      const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
      const updatedPlayers = gameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

      const newGameState = gameState.withUpdates({ players: updatedPlayers });

      return {
        newGameState,
        summary: `Champion${championId} reached doomspire and achieved FAME VICTORY with ${updatedPlayer.fame} fame! The dragon recognizes their reputation and surrenders.${battleSummary}${existingMonsterCombatSummary}`,
        success: true,
      };
    }

    // Check gold victory (10+ gold)
    if (updatedPlayer.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
      const updatedChampions = updatedPlayer.champions.map((c: any) =>
        c.id === championId ? { ...c, position: destination } : c,
      );
      const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
      const updatedPlayers = gameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

      const newGameState = gameState.withUpdates({ players: updatedPlayers });

      return {
        newGameState,
        summary: `Champion${championId} reached doomspire and achieved GOLD VICTORY with ${updatedPlayer.resources.gold} gold! The dragon accepts the tribute and surrenders.${battleSummary}${existingMonsterCombatSummary}`,
        success: true,
      };
    }

    // Check starred tiles victory (3+ starred resource tiles)
    const starredTileCount = gameState.board.findTiles(
      (tile) => tile.tileType === "resource" && tile.isStarred === true && tile.claimedBy === playerId,
    ).length;

    if (starredTileCount >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
      const updatedChampions = updatedPlayer.champions.map((c: any) =>
        c.id === championId ? { ...c, position: destination } : c,
      );
      const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
      const updatedPlayers = gameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

      const newGameState = gameState.withUpdates({ players: updatedPlayers });

      return {
        newGameState,
        summary: `Champion${championId} reached doomspire and achieved ECONOMIC VICTORY with ${starredTileCount} starred resource tiles! The dragon acknowledges their dominance and surrenders.${battleSummary}${existingMonsterCombatSummary}`,
        success: true,
      };
    }

    // No alternative victory conditions met - must fight the dragon
    const dragonMight = GameSettings.DRAGON_BASE_MIGHT + this.rollD3();
    const dragon: Monster = {
      id: "dragon",
      name: "Dragon",
      tier: 3,
      icon: "🐲",
      might: dragonMight,
      fame: 10, // High fame reward for defeating dragon
      resources: { food: 0, wood: 0, ore: 0, gold: 5 }, // Generous gold reward
    };

    const combatResult = this.combatResolver.resolveMonsterCombat(updatedPlayer, champion, dragon);

    if (combatResult.championReturnedHome) {
      // Champion lost and went home (or was eaten by dragon)
      const updatedChampions = combatResult.updatedPlayer.champions.filter((c) => c.id !== championId);
      const finalPlayer = { ...combatResult.updatedPlayer, champions: updatedChampions };
      const finalPlayers = gameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

      const newGameState = gameState.withUpdates({ players: finalPlayers });

      return {
        newGameState,
        summary: `Champion${championId} fought the dragon (might ${dragonMight}) and ${combatResult.summary}. The champion was eaten by the dragon!${battleSummary}${existingMonsterCombatSummary}`,
        success: true,
      };
    } else {
      // Champion won - COMBAT VICTORY!
      const updatedChampions = combatResult.updatedPlayer.champions.map((c: any) =>
        c.id === championId ? { ...c, position: destination } : c,
      );
      const finalPlayer = { ...combatResult.updatedPlayer, champions: updatedChampions };
      const finalPlayers = gameState.players.map((p) => (p.id === playerId ? finalPlayer : p));

      const newGameState = gameState.withUpdates({ players: finalPlayers });

      return {
        newGameState,
        summary: `Champion${championId} fought the dragon (might ${dragonMight}) and achieved COMBAT VICTORY! ${combatResult.summary}${battleSummary}${existingMonsterCombatSummary}`,
        success: true,
      };
    }
  }

  /**
   * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
   */
  private rollD3(): number {
    const outcomes = [1, 1, 2, 2, 3, 3];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }
}
