import { useState, useEffect, useCallback } from "react";
import { Tile } from "../lib/types";
import { GameState } from "../game/GameState";
import { DiceAction, TileAction } from "../lib/actionTypes";

interface UseMovementAndDiceReturn {
  selectedChampionId: number | null;
  championMovementPath: { row: number; col: number }[];
  diceValues: number[];
  usedDiceIndices: number[];
  selectedDieIndex: number | null;
  isDiceRolling: boolean;
  pendingChampionAction: {
    diceValue: number;
    championId: number;
    movementPath: { row: number; col: number }[];
    destinationTile: Tile;
  } | null;
  tileActionModalOpen: boolean;
  setSelectedChampionId: (id: number | null) => void;
  setChampionMovementPath: (path: { row: number; col: number }[]) => void;
  setDiceValues: (values: number[]) => void;
  setUsedDiceIndices: (indices: number[]) => void;
  setSelectedDieIndex: (index: number | null) => void;
  setIsDiceRolling: (rolling: boolean) => void;
  setPendingChampionAction: (action: {
    diceValue: number;
    championId: number;
    movementPath: { row: number; col: number }[];
    destinationTile: Tile;
  } | null) => void;
  setTileActionModalOpen: (open: boolean) => void;
  handleDieSelection: (dieIndex: number) => void;
  handleChampionSelection: (championId: number, gameState?: GameState) => void;
  handleTileClick: (row: number, col: number) => void;
  handleMovementUndo: () => void;
  handleMovementCancel: () => void;
  handleMovementDone: (gameState?: GameState) => void;
  handleTileActionConfirm: (tileAction: TileAction, resolver?: (action: DiceAction) => void) => void;
  handleTileActionCancel: () => void;
  handleWASDMovement: (key: string) => void;
}

export function useMovementAndDice(): UseMovementAndDiceReturn {
  const [selectedChampionId, setSelectedChampionId] = useState<number | null>(null);
  const [championMovementPath, setChampionMovementPath] = useState<{ row: number; col: number }[]>([]);
  const [diceValues, setDiceValues] = useState<number[]>([]);
  const [usedDiceIndices, setUsedDiceIndices] = useState<number[]>([]);
  const [selectedDieIndex, setSelectedDieIndex] = useState<number | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [pendingChampionAction, setPendingChampionAction] = useState<{
    diceValue: number;
    championId: number;
    movementPath: { row: number; col: number }[];
    destinationTile: Tile;
  } | null>(null);
  const [tileActionModalOpen, setTileActionModalOpen] = useState(false);

  const handleDieSelection = useCallback((dieIndex: number) => {
    if (usedDiceIndices.includes(dieIndex)) {
      return; // Can't select used die
    }

    if (selectedDieIndex === dieIndex) {
      // Deselect if clicking same die
      setSelectedDieIndex(null);
    } else {
      // Select new die
      setSelectedDieIndex(dieIndex);
      // Clear champion selection when selecting new die
      setSelectedChampionId(null);
      setChampionMovementPath([]);
    }
  }, [usedDiceIndices, selectedDieIndex]);

  const handleChampionSelection = useCallback((championId: number, gameState?: GameState) => {
    // Must have a die selected first
    if (selectedDieIndex === null) {
      return;
    }

    if (selectedChampionId === championId) {
      // Just deselect the champion (Done button will handle movement completion)
      setSelectedChampionId(null);
      setChampionMovementPath([]);
    } else {
      // Select new champion
      setSelectedChampionId(championId);
      if (gameState) {
        const champion = gameState.getChampion(
          gameState.getCurrentPlayer().name,
          championId,
        );
        if (champion) {
          setChampionMovementPath([champion.position]);
        }
      }
    }
  }, [selectedDieIndex, selectedChampionId]);

  const handleTileClick = useCallback((row: number, col: number) => {
    // Tile clicking is disabled for movement - use WASD keys instead
    console.log("🎯 Tile clicked:", { row, col }, "but movement is WASD-only");
  }, []);

  const handleMovementUndo = useCallback(() => {
    if (championMovementPath.length > 1) {
      // Remove the last position from the path
      setChampionMovementPath(championMovementPath.slice(0, -1));
    }
  }, [championMovementPath]);

  const handleMovementCancel = useCallback(() => {
    // Cancel entire movement and deselect champion
    console.log("❌ Canceling entire movement and deselecting champion");
    setSelectedChampionId(null);
    setChampionMovementPath([]);
  }, []);

  const handleMovementDone = useCallback((gameState?: GameState) => {
    if (
      selectedChampionId !== null &&
      championMovementPath.length > 1 &&
      selectedDieIndex !== null &&
      gameState
    ) {
      const diceValue = diceValues[selectedDieIndex];
      const destinationPosition = championMovementPath[championMovementPath.length - 1];
      const destinationTile = gameState.board.getTileAt(destinationPosition);

      if (!destinationTile) {
        console.error("Invalid destination tile");
        return;
      }

      // Store the pending action and show tile action modal
      setPendingChampionAction({
        diceValue,
        championId: selectedChampionId,
        movementPath: championMovementPath,
        destinationTile,
      });
      setTileActionModalOpen(true);
    }
  }, [selectedChampionId, championMovementPath, selectedDieIndex, diceValues]);

  const handleTileActionConfirm = useCallback((tileAction: TileAction, resolver?: (action: DiceAction) => void) => {
    if (pendingChampionAction && resolver) {
      const action: DiceAction = {
        actionType: "championAction",
        championAction: {
          diceValueUsed: pendingChampionAction.diceValue,
          championId: pendingChampionAction.championId,
          movementPathIncludingStartPosition: pendingChampionAction.movementPath,
          tileAction,
        },
        reasoning: "Human player champion movement with tile actions",
      };

      // Mark die as used and reset state
      setUsedDiceIndices([...usedDiceIndices, selectedDieIndex!]);
      setSelectedDieIndex(null);
      setSelectedChampionId(null);
      setChampionMovementPath([]);
      setPendingChampionAction(null);
      setTileActionModalOpen(false);

      // Resolve the action
      resolver(action);
    }
  }, [pendingChampionAction, usedDiceIndices, selectedDieIndex]);

  const handleTileActionCancel = useCallback(() => {
    setTileActionModalOpen(false);
    setPendingChampionAction(null);
    // Don't reset other state - let player continue moving or cancel movement manually
  }, []);

  const handleWASDMovement = useCallback((key: string) => {
    if (championMovementPath.length === 0 || selectedDieIndex === null) {
      return;
    }

    const currentPos = championMovementPath[championMovementPath.length - 1];
    let newPos: { row: number; col: number } | null = null;

    switch (key.toLowerCase()) {
      case "w":
        newPos = { row: currentPos.row - 1, col: currentPos.col };
        break;
      case "s":
        newPos = { row: currentPos.row + 1, col: currentPos.col };
        break;
      case "a":
        newPos = { row: currentPos.row, col: currentPos.col - 1 };
        break;
      case "d":
        newPos = { row: currentPos.row, col: currentPos.col + 1 };
        break;
    }

    if (newPos && newPos.row >= 0 && newPos.row < 8 && newPos.col >= 0 && newPos.col < 8) {
      console.log("⌨️ WASD key pressed:", key, "Moving to:", newPos, "Current path:", championMovementPath);

      // Check if this position is already in the path (backtracking)
      const existingIndex = championMovementPath.findIndex(
        (pos) => pos.row === newPos.row && pos.col === newPos.col,
      );

      if (existingIndex !== -1) {
        console.log(
          "🔙 WASD Backtracking to index:",
          existingIndex,
          "Truncating path from",
          championMovementPath.length,
          "to",
          existingIndex + 1,
        );
        // Backtracking: truncate path to this position
        setChampionMovementPath(championMovementPath.slice(0, existingIndex + 1));
      } else {
        // Check if we can move forward (dice value restriction)
        const selectedDieValue = diceValues[selectedDieIndex];
        const currentPathLength = championMovementPath.length - 1; // Subtract 1 because first position is starting position

        if (currentPathLength >= selectedDieValue) {
          console.log(
            "❌ Cannot move further - dice value limit reached:",
            selectedDieValue,
            "steps already taken:",
            currentPathLength,
          );
          return;
        }

        console.log(
          "➡️ WASD Moving forward to:",
          newPos,
          "Steps taken:",
          currentPathLength,
          "Dice value:",
          selectedDieValue,
        );
        // Moving forward: add new position to path
        setChampionMovementPath([...championMovementPath, newPos]);
      }
    }
  }, [championMovementPath, selectedDieIndex, diceValues]);

  return {
    selectedChampionId,
    championMovementPath,
    diceValues,
    usedDiceIndices,
    selectedDieIndex,
    isDiceRolling,
    pendingChampionAction,
    tileActionModalOpen,
    setSelectedChampionId,
    setChampionMovementPath,
    setDiceValues,
    setUsedDiceIndices,
    setSelectedDieIndex,
    setIsDiceRolling,
    setPendingChampionAction,
    setTileActionModalOpen,
    handleDieSelection,
    handleChampionSelection,
    handleTileClick,
    handleMovementUndo,
    handleMovementCancel,
    handleMovementDone,
    handleTileActionConfirm,
    handleTileActionCancel,
    handleWASDMovement,
  };
}
