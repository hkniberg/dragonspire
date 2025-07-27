/**
 * DiceRolls class manages dice consumption for a single turn
 */
export class DiceRolls {
  private remainingDice: number[];

  constructor(diceRolls: number[]) {
    this.remainingDice = [...diceRolls];
  }

  public hasRemainingRolls(): boolean {
    return this.remainingDice.length > 0;
  }

  public getRemainingRolls(): number[] {
    return [...this.remainingDice];
  }

  public consumeDiceRoll(diceValue: number): void {
    const diceIndex = this.remainingDice.findIndex(v => v === diceValue);
    if (diceIndex === -1) {
      throw new Error(
        `Dice value ${diceValue} not found in remaining dice [${this.remainingDice.join(", ")}]`
      );
    }
    this.remainingDice.splice(diceIndex, 1);
  }

  public consumeMultipleDiceRolls(diceValues: number[]): void {
    for (const diceValue of diceValues) {
      this.consumeDiceRoll(diceValue);
    }
  }
} 