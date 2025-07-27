// Lords of Doomspire Player Interface

import { BuildingUsageDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
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
   * @returns String describing strategic assessment or undefined to skip
   */
  makeStrategicAssessment(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    diceRolls: number[],
    thinkingLogger?: (content: string) => void,
  ): Promise<string | undefined>;

  /**
   * Decide on a single action to take.
   * @returns DiceAction intent declaring what the player wants to do
   */
  decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction>;

  /**
   * Make a decision when choices arise during action resolution
   * @param decisionContext Description of the choice to be made
   * @returns Decision object with the chosen option
   */
  makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision>;

  /**
   * Make trader decisions when visiting a trader tile
   * @param gameState Current game state
   * @param gameLog Game log entries
   * @param traderContext Available trader options and player resources
   * @returns TraderDecision with actions to perform
   */
  makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision>;

  /**
   * Decide which buildings to use after all dice have been consumed
   * @param gameState Current game state
   * @param gameLog Game log entries
   * @param playerName Name of the player making the decision
   * @returns BuildingUsageDecision with which buildings to use
   */
  useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void,
  ): Promise<BuildingUsageDecision>;
}
