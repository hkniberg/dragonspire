// Lords of Doomspire Evolution Manager
// Manages populations of evolutionary AI players and runs genetic algorithm

import { EvolutionaryPlayer, PlayerGenome, generateRandomGenome, mutateGenome } from "./EvolutionaryPlayer";
import { GameMaster } from "@/engine/GameMaster";
import { GameSettings } from "@/lib/GameSettings";

export interface EvolutionStats {
  generation: number;
  gamesPlayed: number;
  bestFitness: number;
  averageFitness: number;
  populationDiversity: number;
}

export interface GenomePerformance {
  genome: PlayerGenome;
  gamesPlayed: number;
  totalPlacement: number; // Sum of placements (1=1st, 2=2nd, etc.)
  wins: number;
  averagePlacement: number;
  fitness: number;
}

export class EvolutionManager {
  private population: GenomePerformance[] = [];
  private populationSize: number;
  private mutationRate: number;
  private elitismRate: number;

  constructor(
    populationSize: number = 20,
    mutationRate: number = 0.15,
    elitismRate: number = 0.2
  ) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.elitismRate = elitismRate;
    this.initializePopulation();
  }

  /**
   * Initialize population with random genomes
   */
  private initializePopulation(): void {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push({
        genome: generateRandomGenome(),
        gamesPlayed: 0,
        totalPlacement: 0,
        wins: 0,
        averagePlacement: 0,
        fitness: 0
      });
    }
  }

  /**
   * Run a single 4-player game with random genomes and record results
   */
  async runGame(gameNumber: number): Promise<void> {
    // Select 4 random genomes for this game
    const selectedPerformances = this.selectRandomGenomes(4);
    const playerNames = [`Evo1_G${gameNumber}`, `Evo2_G${gameNumber}`, `Evo3_G${gameNumber}`, `Evo4_G${gameNumber}`];

    // Create players
    const players = selectedPerformances.map((perf, index) => {
      const player = new EvolutionaryPlayer(perf.genome, playerNames[index]);
      return player;
    });

    try {
      // Create game master with config
      const gameMaster = new GameMaster({
        players: players,
        maxRounds: 50, // Shorter games for evolution
      });

      // Run the game
      gameMaster.start();

      while (gameMaster.getMasterState() === "playing") {
        await gameMaster.executeTurn();
      }

      // Record results
      const finalGameState = gameMaster.getGameState();
      this.recordGameResults(selectedPerformances, { gameState: finalGameState });

    } catch (error) {
      console.error(`Error in evolution game ${gameNumber}:`, error);
      // Don't record results for failed games
    }
  }

  /**
   * Select random genomes from population
   */
  private selectRandomGenomes(count: number): GenomePerformance[] {
    const selected: GenomePerformance[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      selected.push(this.population[randomIndex]);
    }
    return selected;
  }

  /**
   * Record game results and update fitness
   */
  private recordGameResults(performances: GenomePerformance[], gameResult: any): void {
    // Determine final rankings
    const finalState = gameResult.gameState;
    const players = finalState.players;

    // Sort players by final ranking criteria
    const rankedPlayers = this.calculateFinalRankings(players);

    // Update performance stats
    performances.forEach((perf, index) => {
      const playerName = rankedPlayers[index].name;
      const placement = index + 1; // 1st, 2nd, 3rd, 4th

      perf.gamesPlayed++;
      perf.totalPlacement += placement;
      if (placement === 1) perf.wins++;

      perf.averagePlacement = perf.totalPlacement / perf.gamesPlayed;
      perf.fitness = this.calculateFitness(perf, rankedPlayers[index], finalState);
    });
  }

  /**
   * Calculate final rankings based on game rules
   */
  private calculateFinalRankings(players: any[]): any[] {
    // Simplified ranking - just sort by multiple criteria
    return players.sort((a, b) => {
      // Primary: Fame (higher is better)
      if (a.fame !== b.fame) return b.fame - a.fame;

      // Secondary: Gold (higher is better)
      if (a.resources.gold !== b.resources.gold) return b.resources.gold - a.resources.gold;

      // Tertiary: Total resources (higher is better)
      const aTotalRes = a.resources.food + a.resources.wood + a.resources.ore + a.resources.gold;
      const bTotalRes = b.resources.food + b.resources.wood + b.resources.ore + b.resources.gold;
      if (aTotalRes !== bTotalRes) return bTotalRes - aTotalRes;

      // Final: Might (higher is better)
      return b.might - a.might;
    });
  }

  /**
   * Calculate fitness score for a genome performance using sophisticated success measurement
   */
  private calculateFitness(perf: GenomePerformance, finalPlayerState: any, gameState?: any): number {
    if (perf.gamesPlayed === 0) return 0;

    let fitness = 0;

    // 1. HIGHEST PRIORITY: Did it win?
    const winRate = perf.wins / perf.gamesPlayed;
    fitness += winRate * 100; // Massive bonus for actual wins

    // 2. VERY STRONG WEIGHT: Dragon impression attempts (met victory conditions)
    const dragonImpressions = this.calculateDragonImpressions(finalPlayerState, gameState);
    fitness += dragonImpressions * 50; // Strong bonus for being dragon-ready

    // MASSIVE REWARD: Actually visiting dragon when victory-ready (this is what we want evolution to learn!)
    if (dragonImpressions > 0 && perf.wins > 0) {
      fitness += 200; // Huge bonus for converting potential into victory action
    }
    
    // MASSIVE PENALTY: If you met victory conditions but never visited dragon (failed to convert potential to action)
    if (dragonImpressions > 0 && perf.wins === 0) {
      fitness -= 100; // Big penalty for not capitalizing on victory opportunities
    }

    // 3. VICTORY CONDITION PROXIMITY: How close to winning?

    // Fame proximity to threshold
    const fameProgress = Math.min(finalPlayerState.fame / GameSettings.VICTORY_FAME_THRESHOLD, 1.0);
    fitness += fameProgress * 20;

    // Starred tiles proximity  
    const starredTiles = gameState ? gameState.getStarredTileCount?.(finalPlayerState.name) || 0 : 0;
    const starredProgress = Math.min(starredTiles / GameSettings.VICTORY_STARRED_TILES_THRESHOLD, 1.0);
    fitness += starredProgress * 20;

    // Gold equivalent (market-aware conversion)
    const fitnessDirectGold = finalPlayerState.resources.gold;
    const fitnessConvertibleResources = finalPlayerState.resources.food + finalPlayerState.resources.wood + finalPlayerState.resources.ore;
    const fitnessHasMarket = finalPlayerState.buildings.includes('market');
    const fitnessGoldEquivalent = fitnessDirectGold + (fitnessHasMarket ? Math.floor(fitnessConvertibleResources / 2) : fitnessConvertibleResources * 0.5);
    const goldProgress = Math.min(fitnessGoldEquivalent / GameSettings.VICTORY_GOLD_THRESHOLD, 1.0);
    fitness += goldProgress * 20;

    // Might proximity to dragon base might
    const mightProgress = Math.min(finalPlayerState.might / GameSettings.DRAGON_BASE_MIGHT, 1.0);
    fitness += mightProgress * 15;

    // 4. SECONDARY FACTORS: Strong winning position indicators

    // Number of champions (max 3)
    const championCount = finalPlayerState.champions?.length || 0;
    fitness += (championCount / GameSettings.MAX_CHAMPIONS_PER_PLAYER) * 10;

    // Number of claimed resource tiles  
    const claimedTiles = gameState ? this.countClaimedTiles(finalPlayerState.name, gameState) : 0;
    fitness += Math.min(claimedTiles / 6, 1.0) * 10; // Assume ~6 tiles is good

    // 5. PLACEMENT BONUS: Reward consistent strong placement
    fitness += (5 - perf.averagePlacement) * 5; // 20 for 1st, 15 for 2nd, 10 for 3rd, 5 for 4th

    return Math.max(0, fitness);
  }

  /**
   * Calculate how many times this player met victory conditions (dragon impressions)
   */
  private calculateDragonImpressions(player: any, gameState?: any): number {
    let impressions = 0;

    // Check each victory condition
    if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) impressions++;

    // Account for market conversion at 2:1 rate if player has market
    const directGold = player.resources.gold;
    const convertibleResources = player.resources.food + player.resources.wood + player.resources.ore;
    const hasMarket = player.buildings.includes('market');
    const goldEquivalent = directGold + (hasMarket ? Math.floor(convertibleResources / 2) : convertibleResources * 0.5);
    if (goldEquivalent >= GameSettings.VICTORY_GOLD_THRESHOLD) impressions++;

    if (gameState) {
      const starredTiles = gameState.getStarredTileCount?.(player.name) || 0;
      if (starredTiles >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) impressions++;
    }

    if (player.might >= GameSettings.DRAGON_BASE_MIGHT) impressions++;

    return impressions;
  }

  /**
   * Count claimed resource tiles for a player
   */
  private countClaimedTiles(playerName: string, gameState: any): number {
    if (!gameState || !gameState.tiles) return 0;

    let count = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const tile = gameState.getTile?.({ row, col });
        if (tile && tile.claimedBy === playerName && tile.tileType === "resource") {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Evolve the population using genetic algorithm
   */
  evolvePopulation(): void {
    // Sort by fitness
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Keep elite performers
    const eliteCount = Math.floor(this.populationSize * this.elitismRate);
    const newPopulation = this.population.slice(0, eliteCount);

    // Generate rest through mutation and crossover
    while (newPopulation.length < this.populationSize) {
      if (Math.random() < 0.7) {
        // Mutation of good performer
        const parent = this.tournamentSelection();
        const mutatedGenome = mutateGenome(parent.genome, this.mutationRate);
        newPopulation.push({
          genome: mutatedGenome,
          gamesPlayed: 0,
          totalPlacement: 0,
          wins: 0,
          averagePlacement: 0,
          fitness: 0
        });
      } else {
        // Crossover of two good performers
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        const childGenome = this.crossover(parent1.genome, parent2.genome);
        newPopulation.push({
          genome: childGenome,
          gamesPlayed: 0,
          totalPlacement: 0,
          wins: 0,
          averagePlacement: 0,
          fitness: 0
        });
      }
    }

    this.population = newPopulation;
  }

  /**
   * Tournament selection for parent selection
   */
  private tournamentSelection(tournamentSize: number = 3): GenomePerformance {
    const candidates = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      candidates.push(this.population[randomIndex]);
    }

    // Return best candidate
    return candidates.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Crossover two genomes to create offspring
   */
  private crossover(genome1: PlayerGenome, genome2: PlayerGenome): PlayerGenome {
    const child: PlayerGenome = {
      combatRiskTolerance: Math.random() < 0.5 ? genome1.combatRiskTolerance : genome2.combatRiskTolerance,
      economicFocus: Math.random() < 0.5 ? genome1.economicFocus : genome2.economicFocus,
      territorialAggression: Math.random() < 0.5 ? genome1.territorialAggression : genome2.territorialAggression,
      explorationAggression: Math.random() < 0.5 ? genome1.explorationAggression : genome2.explorationAggression,
      famePathWeight: Math.random() < 0.5 ? genome1.famePathWeight : genome2.famePathWeight,
      goldPathWeight: Math.random() < 0.5 ? genome1.goldPathWeight : genome2.goldPathWeight,
      territorialPathWeight: Math.random() < 0.5 ? genome1.territorialPathWeight : genome2.territorialPathWeight,
      combatPathWeight: Math.random() < 0.5 ? genome1.combatPathWeight : genome2.combatPathWeight,
      defensivePosture: Math.random() < 0.5 ? genome1.defensivePosture : genome2.defensivePosture,
      dragonTimingAggression: Math.random() < 0.5 ? genome1.dragonTimingAggression : genome2.dragonTimingAggression,
      safetyMarginPreference: Math.random() < 0.5 ? genome1.safetyMarginPreference : genome2.safetyMarginPreference,
    };

    // Renormalize victory path weights
    const totalWeight = child.famePathWeight + child.goldPathWeight +
      child.territorialPathWeight + child.combatPathWeight;
    if (totalWeight > 0) {
      child.famePathWeight /= totalWeight;
      child.goldPathWeight /= totalWeight;
      child.territorialPathWeight /= totalWeight;
      child.combatPathWeight /= totalWeight;
    }

    return child;
  }

  /**
   * Get current evolution statistics
   */
  getStats(): EvolutionStats {
    const totalGames = this.population.reduce((sum, perf) => sum + perf.gamesPlayed, 0);
    const totalFitness = this.population.reduce((sum, perf) => sum + perf.fitness, 0);
    const averageFitness = this.population.length > 0 ? totalFitness / this.population.length : 0;
    const bestFitness = Math.max(...this.population.map(perf => perf.fitness));

    // Calculate diversity as average distance between genomes
    let diversitySum = 0;
    let comparisons = 0;
    for (let i = 0; i < this.population.length; i++) {
      for (let j = i + 1; j < this.population.length; j++) {
        diversitySum += this.calculateGenomeDistance(this.population[i].genome, this.population[j].genome);
        comparisons++;
      }
    }
    const diversity = comparisons > 0 ? diversitySum / comparisons : 0;

    return {
      generation: Math.floor(totalGames / this.populationSize), // Approximate generation
      gamesPlayed: totalGames,
      bestFitness,
      averageFitness,
      populationDiversity: diversity
    };
  }

  /**
   * Calculate distance between two genomes for diversity measurement
   */
  private calculateGenomeDistance(genome1: PlayerGenome, genome2: PlayerGenome): number {
    const keys = Object.keys(genome1) as (keyof PlayerGenome)[];
    let distance = 0;

    for (const key of keys) {
      distance += Math.abs(genome1[key] - genome2[key]);
    }

    return distance / keys.length;
  }

  /**
   * Get the best performing genomes
   */
  getBestGenomes(count: number = 5): GenomePerformance[] {
    return this.population
      .filter(perf => perf.gamesPlayed > 0)
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, count);
  }

  /**
   * Export population for analysis
   */
  exportPopulation(): GenomePerformance[] {
    return [...this.population];
  }

  /**
   * Import population from previous evolution
   */
  importPopulation(population: GenomePerformance[]): void {
    this.population = [...population];
  }

  /**
   * Save the current population and best genomes to JSON file
   */
  async saveEvolutionResults(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const evolutionData = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      bestGenomes: this.getBestGenomes(10), // Save top 10 performers
      fullPopulation: this.exportPopulation(),
    };

    const evolutionDir = path.join(process.cwd(), 'evolution-results');
    await fs.mkdir(evolutionDir, { recursive: true });

    const filePath = path.join(evolutionDir, filename);
    await fs.writeFile(filePath, JSON.stringify(evolutionData, null, 2));

    console.log(`\n💾 Evolution results saved to: evolution-results/${filename}`);
    console.log(`📊 Best fitness: ${evolutionData.stats.bestFitness.toFixed(2)}`);
    console.log(`🧬 Population size: ${evolutionData.fullPopulation.length}`);
  }

  /**
   * Load evolution results from JSON file
   */
  static async loadEvolutionResults(filename: string): Promise<EvolutionManager> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'evolution-results', filename);
    const data = await fs.readFile(filePath, 'utf-8');
    const evolutionData = JSON.parse(data);

    const manager = new EvolutionManager();
    manager.importPopulation(evolutionData.fullPopulation);

    console.log(`\n📂 Loaded evolution results from: evolution-results/${filename}`);
    console.log(`📊 Previous best fitness: ${evolutionData.stats.bestFitness.toFixed(2)}`);
    console.log(`🧬 Loaded population size: ${evolutionData.fullPopulation.length}`);

    return manager;
  }

  /**
   * Create a player from a saved genome (for use in regular games)
   */
  static createPlayerFromGenome(genome: PlayerGenome, name: string): EvolutionaryPlayer {
    return new EvolutionaryPlayer(genome, name);
  }

  /**
   * Save just the best genome for easy reuse
   */
  async saveBestGenome(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const bestGenome = this.getBestGenomes(1)[0];
    if (!bestGenome) {
      throw new Error("No genomes available to save");
    }

    const genomeData = {
      timestamp: new Date().toISOString(),
      fitness: bestGenome.fitness,
      gamesPlayed: bestGenome.gamesPlayed,
      winRate: bestGenome.wins / bestGenome.gamesPlayed,
      averagePlacement: bestGenome.averagePlacement,
      genome: bestGenome.genome,
    };

    const genomesDir = path.join(process.cwd(), 'best-genomes');
    await fs.mkdir(genomesDir, { recursive: true });

    const filePath = path.join(genomesDir, filename);
    await fs.writeFile(filePath, JSON.stringify(genomeData, null, 2));

    console.log(`\n🏆 Best genome saved to: best-genomes/${filename}`);
    console.log(`📊 Fitness: ${genomeData.fitness.toFixed(2)}, Win Rate: ${(genomeData.winRate * 100).toFixed(1)}%`);
  }

  /**
   * Find the latest (most recent) genome file in best-genomes folder
   */
  static async findLatestGenomeFile(): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const genomesDir = path.join(process.cwd(), 'best-genomes');

    try {
      const files = await fs.readdir(genomesDir);
      const genomeFiles = files.filter(file => file.startsWith('best-genome-') && file.endsWith('.json'));

      if (genomeFiles.length === 0) {
        throw new Error('No genome files found in best-genomes folder. Run evolution first with: node run-evolution.js');
      }

      // Sort by filename (which includes timestamp) in descending order to get the latest
      genomeFiles.sort().reverse();

      return genomeFiles[0];
    } catch (error) {
      throw new Error(`Failed to find genome files: ${error}`);
    }
  }

  /**
   * Load a genome from file, or the latest file if no filename specified
   */
  static async loadGenome(filename?: string): Promise<PlayerGenome> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // If no filename specified, find the latest one
    const actualFilename = filename || await this.findLatestGenomeFile();

    const filePath = path.join(process.cwd(), 'best-genomes', actualFilename);
    const data = await fs.readFile(filePath, 'utf-8');
    const genomeData = JSON.parse(data);

    if (!filename) {
      console.log(`\n🏆 Auto-loaded latest genome from: best-genomes/${actualFilename}`);
    } else {
      console.log(`\n🏆 Loaded genome from: best-genomes/${actualFilename}`);
    }
    console.log(`📊 Original fitness: ${genomeData.fitness.toFixed(2)}, Win Rate: ${(genomeData.winRate * 100).toFixed(1)}%`);

    return genomeData.genome;
  }
}