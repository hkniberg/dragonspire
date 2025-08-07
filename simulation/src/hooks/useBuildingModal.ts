import { useState, useCallback } from "react";
import { GameState } from "../game/GameState";
import { BuildingDecision } from "../lib/actionTypes";
import { GameLogEntry } from "../lib/types";

interface UseBuildingModalReturn {
  isBuildingModalOpen: boolean;
  openBuildingModal: (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string
  ) => Promise<BuildingDecision>;
  closeBuildingModal: () => void;
  handleBuildingDecision: (decision: BuildingDecision) => void;
}

export function useBuildingModal(): UseBuildingModalReturn {
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [buildingResolver, setBuildingResolver] = useState<((decision: BuildingDecision) => void) | null>(null);

  const openBuildingModal = useCallback((
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    playerName: string
  ): Promise<BuildingDecision> => {
    return new Promise((resolve) => {
      setBuildingResolver(() => resolve);
      setIsBuildingModalOpen(true);
    });
  }, []);

  const closeBuildingModal = useCallback(() => {
    setIsBuildingModalOpen(false);
    setBuildingResolver(null);
  }, []);

  const handleBuildingDecision = useCallback((decision: BuildingDecision) => {
    if (buildingResolver) {
      buildingResolver(decision);
    }
    closeBuildingModal();
  }, [buildingResolver, closeBuildingModal]);

  return {
    isBuildingModalOpen,
    openBuildingModal,
    closeBuildingModal,
    handleBuildingDecision,
  };
}
