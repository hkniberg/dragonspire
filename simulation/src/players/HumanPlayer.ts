// Lords of Doomspire Human Player Implementation

import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";

export class HumanPlayer implements PlayerAgent {
  private playerName: string;
  private onDiceActionNeeded?: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext
  ) => Promise<DiceAction>;
  private onDecisionNeeded?: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext
  ) => Promise<Decision>;

  constructor(
    name: string,
    callbacks?: {
      onDiceActionNeeded?: (
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext
      ) => Promise<DiceAction>;
      onDecisionNeeded?: (
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext
      ) => Promise<Decision>;
    }
  ) {
    this.playerName = name;
    this.onDiceActionNeeded = callbacks?.onDiceActionNeeded;
    this.onDecisionNeeded = callbacks?.onDecisionNeeded;
  }

  getName(): string {
    return this.playerName;
  }

  getType(): PlayerType {
    return "human";
  }

  async makeStrategicAssessment(): Promise<string | undefined> {
    // Human players don't need strategic assessment
    return undefined;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void
  ): Promise<DiceAction> {
    if (!this.onDiceActionNeeded) {
      throw new Error("Human player dice action callback not configured");
    }

    return await this.onDiceActionNeeded(gameState, gameLog, turnContext);
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void
  ): Promise<Decision> {
    if (!this.onDecisionNeeded) {
      throw new Error("Human player decision callback not configured");
    }

    return await this.onDecisionNeeded(gameState, gameLog, decisionContext);
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void
  ): Promise<TraderDecision> {
    // Return empty decision for now
    return {
      actions: [],
      reasoning: "Human player - trader decisions not implemented yet"
    };
  }

  async useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void
  ): Promise<BuildingDecision> {
    // Return empty decision for now
    return {
      reasoning: "Human player - building usage not implemented yet"
    };
  }

  // Method to update callbacks (useful for connecting UI)
  setCallbacks(callbacks: {
    onDiceActionNeeded?: (
      gameState: GameState,
      gameLog: readonly GameLogEntry[],
      turnContext: TurnContext
    ) => Promise<DiceAction>;
    onDecisionNeeded?: (
      gameState: GameState,
      gameLog: readonly GameLogEntry[],
      decisionContext: DecisionContext
    ) => Promise<Decision>;
  }): void {
    this.onDiceActionNeeded = callbacks.onDiceActionNeeded;
    this.onDecisionNeeded = callbacks.onDecisionNeeded;
  }
}