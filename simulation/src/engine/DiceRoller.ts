export interface DiceRoller {
  /**
   * Roll a single D3 die (showing 1,1,2,2,3,3)
   */
  rollD3(): number;

  /**
   * Roll multiple D3 dice
   */
  rollMultipleD3(count: number): number[];
}

export class RandomDiceRoller implements DiceRoller {
  private seed?: number;
  private rngState?: number;

  constructor(seed?: number) {
    this.seed = seed;
    this.rngState = seed;
  }

  /**
   * Generate a random number between 0 and 1
   * Uses seeded LCG if seed provided, otherwise Math.random()
   */
  private random(): number {
    if (this.seed !== undefined && this.rngState !== undefined) {
      // Linear Congruential Generator (LCG)
      // Using parameters from Numerical Recipes
      this.rngState = (this.rngState * 1664525 + 1013904223) % Math.pow(2, 32);
      return this.rngState / Math.pow(2, 32);
    }
    return Math.random();
  }

  /**
   * Roll a single D3 die (showing 1,1,2,2,3,3)
   */
  public rollD3(): number {
    const outcomes = [1, 1, 2, 2, 3, 3];
    return outcomes[Math.floor(this.random() * outcomes.length)];
  }

  /**
   * Roll multiple D3 dice
   */
  public rollMultipleD3(count: number): number[] {
    return Array.from({ length: count }, () => this.rollD3());
  }
}
