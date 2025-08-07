import { useState, useCallback } from "react";
import { GameState } from "../game/GameState";
import { TraderContext, TraderDecision } from "../lib/traderTypes";
import { GameLogEntry } from "../lib/types";

interface UseTraderModalReturn {
  isTraderModalOpen: boolean;
  traderContext: TraderContext | null;
  openTraderModal: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    context: TraderContext
  ) => Promise<TraderDecision>;
  closeTraderModal: () => void;
  handleTraderDecision: (decision: TraderDecision) => void;
}

export function useTraderModal(): UseTraderModalReturn {
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);
  const [traderContext, setTraderContext] = useState<TraderContext | null>(null);
  const [traderResolver, setTraderResolver] = useState<((decision: TraderDecision) => void) | null>(null);

  const openTraderModal = useCallback((
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    context: TraderContext
  ): Promise<TraderDecision> => {
    return new Promise((resolve) => {
      setTraderContext(context);
      setTraderResolver(() => resolve);
      setIsTraderModalOpen(true);
    });
  }, []);

  const closeTraderModal = useCallback(() => {
    setIsTraderModalOpen(false);
    setTraderContext(null);
    setTraderResolver(null);
  }, []);

  const handleTraderDecision = useCallback((decision: TraderDecision) => {
    if (traderResolver) {
      traderResolver(decision);
    }
    closeTraderModal();
  }, [traderResolver, closeTraderModal]);

  return {
    isTraderModalOpen,
    traderContext,
    openTraderModal,
    closeTraderModal,
    handleTraderDecision,
  };
}
