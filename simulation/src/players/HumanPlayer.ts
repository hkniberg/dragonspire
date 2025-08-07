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
  private onTraderDecisionNeeded?: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext
  ) => Promise<TraderDecision>;
  private onBuildingDecisionNeeded?: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string
  ) => Promise<BuildingDecision>;

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
      onTraderDecisionNeeded?: (
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        traderContext: TraderContext
      ) => Promise<TraderDecision>;
      onBuildingDecisionNeeded?: (
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string
      ) => Promise<BuildingDecision>;
    }
  ) {
    this.playerName = name;
    this.onDiceActionNeeded = callbacks?.onDiceActionNeeded;
    this.onDecisionNeeded = callbacks?.onDecisionNeeded;
    this.onTraderDecisionNeeded = callbacks?.onTraderDecisionNeeded;
    this.onBuildingDecisionNeeded = callbacks?.onBuildingDecisionNeeded;
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
    return new Promise((resolve) => {
      if (this.onTraderDecisionNeeded) {
        this.onTraderDecisionNeeded(gameState, gameLog, traderContext).then(resolve);
      } else {
        // Fallback to empty decision if no handler is set
        resolve({
          actions: [],
          reasoning: "Human player - no trader decision handler set"
        });
      }
    });
  }

  async useBuilding(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string,
    thinkingLogger?: (content: string) => void
  ): Promise<BuildingDecision> {
    return new Promise((resolve) => {
      if (this.onBuildingDecisionNeeded) {
        this.onBuildingDecisionNeeded(gameState, gameLog, playerName).then(resolve);
      } else {
        // Fallback to empty decision if no handler is set
        resolve({
          reasoning: "Human player - no building decision handler set"
        });
      }
    });
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
    onTraderDecisionNeeded?: (
      gameState: GameState,
      gameLog: readonly GameLogEntry[],
      traderContext: TraderContext
    ) => Promise<TraderDecision>;
    onBuildingDecisionNeeded?: (
      gameState: GameState,
      gameLog: readonly GameLogEntry[],
      playerName: string
    ) => Promise<BuildingDecision>;
  }): void {
    this.onDiceActionNeeded = callbacks.onDiceActionNeeded;
    this.onDecisionNeeded = callbacks.onDecisionNeeded;
    this.onTraderDecisionNeeded = callbacks.onTraderDecisionNeeded;
    this.onBuildingDecisionNeeded = callbacks.onBuildingDecisionNeeded;
  }
}