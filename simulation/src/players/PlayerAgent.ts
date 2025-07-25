// Lords of Doomspire Player Interface

import { DiceAction } from "@/lib/actionTypes";
import { Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";


/**
 * Interface that all player implementations must follow
 */
export interface PlayerAgent {
  /**
   * Get the player's display name
   */
  getName(): string;

  /**
   * Get the player's type identifier
   */
  getType(): PlayerType;


  /**
   * Provide strategic assessment at the start of each turn
   * @param gameState Current game state
   * @param gameLog Sequential log of all game events so far
   * @param diceRolls Optional dice rolls for this turn to provide strategic context
   * @returns String describing strategic assessment (situation, strategy, tactical plan) or undefined to skip
   */
  makeStrategicAssessment(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    diceRolls?: number[],
  ): Promise<string | undefined>;

  /**
   * Decide what to do with a single die value
   * @param gameState Current game state
   * @param gameLog Sequential log of all game events so far
   * @param turnContext Information about the current turn and remaining dice
   * @returns DiceAction intent declaring what the player wants to do
   */
  decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
  ): Promise<DiceAction>;

  /**
   * Make a runtime decision when choices arise during action resolution
   * @param gameState Current game state
   * @param gameLog Sequential log of all game events so far
   * @param decisionContext Description of the choice to be made
   * @returns Decision object with the chosen option
   */
  makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
  ): Promise<Decision>;
}
