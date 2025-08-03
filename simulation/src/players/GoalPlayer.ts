// GoalPlayer - A smarter variant of RandomPlayer that uses goal-based decision making
// Routes all decisions through specific goals based on current game state

import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { GameSettings } from "@/lib/GameSettings";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";
import { Goal } from "./goals/Goal";
import { ObtainBlacksmith } from "./goals/ObtainBlacksmith";
import { BuildMight } from "./goals/BuildMight";

export class GoalPlayer implements PlayerAgent {
  private name: string;
  private obtainBlacksmithGoal: Goal;
  private buildMightGoal: Goal;

  constructor(name: string) {
    this.name = name;
    this.obtainBlacksmithGoal = new ObtainBlacksmith(name);
    this.buildMightGoal = new BuildMight(name);
  }

  getName(): string {
    return this.name;
  }

  getType(): PlayerType {
    return "random"; // Note: using "random" type since GoalPlayer isn't a distinct PlayerType in the system
  }

  /**
   * Select the appropriate goal based on current game state
   */
  private selectCurrentGoal(gameState: GameState): Goal {
    const player = gameState.getCurrentPlayer();

    // If player doesn't have blacksmith and can't afford it, focus on obtaining it
    const hasBlacksmith = player.buildings.includes("blacksmith");
    if (!hasBlacksmith) {
      return this.obtainBlacksmithGoal;
    }

    // If player has blacksmith, focus on building might
    return this.buildMightGoal;
  }

  async makeStrategicAssessment(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    diceValues: number[],
    turnNumber: number,
    traderItems: readonly TraderCard[],
    adventureDeckThemes: [AdventureThemeType, AdventureThemeType, AdventureThemeType],
    thinkingLogger?: (content: string) => void,
  ): Promise<string | undefined> {
    const currentGoal = this.selectCurrentGoal(gameState);
    return await currentGoal.makeStrategicAssessment(
      gameState,
      gameLog,
      diceValues,
      turnNumber,
      traderItems,
      adventureDeckThemes,
      thinkingLogger
    );
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const currentGoal = this.selectCurrentGoal(gameState);

    if (thinkingLogger) {
      const player = gameState.getCurrentPlayer();
      const hasBlacksmith = player.buildings.includes("blacksmith");
      thinkingLogger(`GoalPlayer: Using ${hasBlacksmith ? 'BuildMight' : 'ObtainBlacksmith'} goal`);
    }

    return await currentGoal.decideDiceAction(gameState, gameLog, turnContext, thinkingLogger);
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision> {
    const currentGoal = this.selectCurrentGoal(gameState);
    return await currentGoal.makeDecision(gameState, gameLog, decisionContext, thinkingLogger);
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    const currentGoal = this.selectCurrentGoal(gameState);
    return await currentGoal.makeTraderDecision(gameState, gameLog, traderContext, thinkingLogger);
  }

  async useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void,
  ): Promise<BuildingDecision> {
    const currentGoal = this.selectCurrentGoal(gameState);
    return await currentGoal.useBuilding(gameState, gameLog, playerName, thinkingLogger);
  }
}