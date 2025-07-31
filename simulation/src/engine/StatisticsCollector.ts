// Lords of Doomspire Statistics Collector

import { GameState } from "../game/GameState";
import { PlayerTurnStats, TurnStatistics } from "../lib/types";

export class StatisticsCollector {
  private turnHistory: TurnStatistics[] = [];

  /**
   * Capture statistics for the current turn
   */
  public captureTurnStatistics(gameState: GameState): void {
    const round = gameState.currentRound;
    const playerStats: PlayerTurnStats[] = [];

    for (const player of gameState.players) {
      // Calculate derived statistics
      const claimedTiles = gameState.getClaimedTiles(player.name);
      const starredTiles = gameState.getStarredTileCount(player.name);

      // Calculate total resources from claimed tiles
      let totalResourcesFromTiles = 0;
      for (const tile of claimedTiles) {
        if (tile.resources) {
          totalResourcesFromTiles +=
            (tile.resources.food || 0) +
            (tile.resources.wood || 0) +
            (tile.resources.ore || 0) +
            (tile.resources.gold || 0);
        }
      }

      // Calculate total items and followers across all champions
      let totalItems = 0;
      let totalFollowers = 0;
      for (const champion of player.champions) {
        totalItems += champion.items.length;
        totalFollowers += champion.followers.length;
      }

      const playerTurnStats: PlayerTurnStats = {
        playerName: player.name,
        fame: player.fame,
        might: player.might,
        food: player.resources.food,
        wood: player.resources.wood,
        ore: player.resources.ore,
        gold: player.resources.gold,
        championCount: player.champions.length,
        boatCount: player.boats.length,
        totalItems,
        totalFollowers,
        championVsChampionWins: player.statistics?.championVsChampionWins ?? 0,
        championVsChampionLosses: player.statistics?.championVsChampionLosses ?? 0,
        championVsMonsterWins: player.statistics?.championVsMonsterWins ?? 0,
        championVsMonsterLosses: player.statistics?.championVsMonsterLosses ?? 0,
        dragonEncounters: player.statistics?.dragonEncounters ?? 0,
        marketInteractions: player.statistics?.marketInteractions ?? 0,
        blacksmithInteractions: player.statistics?.blacksmithInteractions ?? 0,
        fletcherInteractions: player.statistics?.fletcherInteractions ?? 0,
        traderInteractions: player.statistics?.traderInteractions ?? 0,
        templeInteractions: player.statistics?.templeInteractions ?? 0,
        mercenaryInteractions: player.statistics?.mercenaryInteractions ?? 0,
        championActions: player.statistics?.championActions ?? 0,
        boatActions: player.statistics?.boatActions ?? 0,
        harvestActions: player.statistics?.harvestActions ?? 0,
        buildActions: player.statistics?.buildActions ?? 0,
        adventureCards: player.statistics?.adventureCards ?? 0,
        claimedTiles: claimedTiles.length,
        starredTiles,
        totalResourcesFromTiles,
        hasBlacksmith: player.buildings.includes("blacksmith"),
        hasMarket: player.buildings.includes("market"),
        hasFletcher: player.buildings.includes("fletcher"),
        hasChapel: player.buildings.includes("chapel"),
        hasMonastery: player.buildings.includes("monastery"),
        hasWarshipUpgrade: player.buildings.includes("warshipUpgrade"),
      };

      playerStats.push(playerTurnStats);
    }

    const turnStatistics: TurnStatistics = {
      round,
      playerStats,
    };

    this.turnHistory.push(turnStatistics);
  }

  /**
   * Export statistics to CSV format
   */
  public exportToCSV(): string {
    if (this.turnHistory.length === 0) {
      return "";
    }

    const headers: string[] = ["Round"];

    // Generate headers for each player and metric
    const playerNames = this.turnHistory[0].playerStats.map(p => p.playerName);

    for (const playerName of playerNames) {
      headers.push(
        `${playerName}_Fame`,
        `${playerName}_Might`,
        `${playerName}_Food`,
        `${playerName}_Wood`,
        `${playerName}_Ore`,
        `${playerName}_Gold`,
        `${playerName}_Champions`,
        `${playerName}_Boats`,
        `${playerName}_TotalItems`,
        `${playerName}_TotalFollowers`,
        `${playerName}_ChampionVsChampionWins`,
        `${playerName}_ChampionVsChampionLosses`,
        `${playerName}_ChampionVsMonsterWins`,
        `${playerName}_ChampionVsMonsterLosses`,
        `${playerName}_DragonEncounters`,
        `${playerName}_MarketInteractions`,
        `${playerName}_BlacksmithInteractions`,
        `${playerName}_FletcherInteractions`,
        `${playerName}_TraderInteractions`,
        `${playerName}_TempleInteractions`,
        `${playerName}_MercenaryInteractions`,
        `${playerName}_ChampionActions`,
        `${playerName}_BoatActions`,
        `${playerName}_HarvestActions`,
        `${playerName}_BuildActions`,
        `${playerName}_AdventureCards`,
        `${playerName}_ClaimedTiles`,
        `${playerName}_StarredTiles`,
        `${playerName}_TotalResourcesFromTiles`,
        `${playerName}_HasBlacksmith`,
        `${playerName}_HasMarket`,
        `${playerName}_HasFletcher`,
        `${playerName}_HasChapel`,
        `${playerName}_HasMonastery`,
        `${playerName}_HasWarshipUpgrade`
      );
    }

    const rows: string[] = [headers.join(",")];

    // Generate data rows
    for (const turnStats of this.turnHistory) {
      const row: (string | number | boolean)[] = [turnStats.round];

      for (const playerName of playerNames) {
        const playerStats = turnStats.playerStats.find(p => p.playerName === playerName);
        if (!playerStats) {
          // Fill with empty values if player data is missing
          for (let i = 0; i < 35; i++) {
            row.push("");
          }
          continue;
        }

        row.push(
          playerStats.fame,
          playerStats.might,
          playerStats.food,
          playerStats.wood,
          playerStats.ore,
          playerStats.gold,
          playerStats.championCount,
          playerStats.boatCount,
          playerStats.totalItems,
          playerStats.totalFollowers,
          playerStats.championVsChampionWins,
          playerStats.championVsChampionLosses,
          playerStats.championVsMonsterWins,
          playerStats.championVsMonsterLosses,
          playerStats.dragonEncounters,
          playerStats.marketInteractions,
          playerStats.blacksmithInteractions,
          playerStats.fletcherInteractions,
          playerStats.traderInteractions,
          playerStats.templeInteractions,
          playerStats.mercenaryInteractions,
          playerStats.championActions,
          playerStats.boatActions,
          playerStats.harvestActions,
          playerStats.buildActions,
          playerStats.adventureCards,
          playerStats.claimedTiles,
          playerStats.starredTiles,
          playerStats.totalResourcesFromTiles,
          playerStats.hasBlacksmith,
          playerStats.hasMarket,
          playerStats.hasFletcher,
          playerStats.hasChapel,
          playerStats.hasMonastery,
          playerStats.hasWarshipUpgrade
        );
      }

      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Get the collected turn history
   */
  public getTurnHistory(): readonly TurnStatistics[] {
    return [...this.turnHistory];
  }

  /**
   * Clear the collected statistics (useful for testing)
   */
  public clear(): void {
    this.turnHistory = [];
  }
} 