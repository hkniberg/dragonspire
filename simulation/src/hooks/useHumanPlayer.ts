import { useState, useCallback } from "react";
import { DecisionContext, GameLogEntry, TurnContext } from "../lib/types";
import { GameState } from "../game/GameState";
import { DiceAction } from "../lib/actionTypes";

interface UseHumanPlayerReturn {
  humanDecisionContext: DecisionContext | null;
  humanDecisionResolver: ((choice: string) => void) | null;
  humanDiceActionContext: {
    gameState: GameState;
    gameLog: readonly GameLogEntry[];
    turnContext: TurnContext;
    resolver: (action: DiceAction) => void;
  } | null;
  handleHumanDecision: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
  ) => Promise<{ choice: string }>;
  handleHumanDiceAction: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
  ) => Promise<DiceAction>;
  setHumanDecisionContext: (context: DecisionContext | null) => void;
  setHumanDecisionResolver: (resolver: ((choice: string) => void) | null) => void;
  setHumanDiceActionContext: (context: {
    gameState: GameState;
    gameLog: readonly GameLogEntry[];
    turnContext: TurnContext;
    resolver: (action: DiceAction) => void;
  } | null) => void;
}

export function useHumanPlayer(): UseHumanPlayerReturn {
  const [humanDecisionContext, setHumanDecisionContext] = useState<DecisionContext | null>(null);
  const [humanDecisionResolver, setHumanDecisionResolver] = useState<((choice: string) => void) | null>(null);
  const [humanDiceActionContext, setHumanDiceActionContext] = useState<{
    gameState: GameState;
    gameLog: readonly GameLogEntry[];
    turnContext: TurnContext;
    resolver: (action: DiceAction) => void;
  } | null>(null);

  const handleHumanDecision = useCallback((
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
  ): Promise<{ choice: string }> => {
    return new Promise((resolve) => {
      setHumanDecisionContext(decisionContext);
      setHumanDecisionResolver(() => (choice: string) => {
        setHumanDecisionContext(null);
        setHumanDecisionResolver(null);
        resolve({ choice });
      });
    });
  }, []);

  const handleHumanDiceAction = useCallback((
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
  ): Promise<DiceAction> => {
    return new Promise((resolve) => {
      setHumanDiceActionContext({
        gameState,
        gameLog,
        turnContext,
        resolver: resolve,
      });
    });
  }, []);

  return {
    humanDecisionContext,
    humanDecisionResolver,
    humanDiceActionContext,
    handleHumanDecision,
    handleHumanDiceAction,
    setHumanDecisionContext,
    setHumanDecisionResolver,
    setHumanDiceActionContext,
  };
}
