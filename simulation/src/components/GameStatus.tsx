import React from "react";
import { GameState } from "../game/GameState";

type SimulationState = "setup" | "playing" | "finished";

interface GameStatusProps {
  gameState: GameState;
  simulationState: SimulationState;
  actionLogLength: number;
  humanPlayerWaiting?: boolean;
  selectedDieIndex?: number | null;
  selectedChampionId?: number | null;
  championMovementPath?: Array<{ row: number; col: number }>;
  selectedHarvestTiles?: Array<{ row: number; col: number }>;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  simulationState,
  actionLogLength,
  humanPlayerWaiting,
  selectedDieIndex,
  selectedChampionId,
  championMovementPath,
  selectedHarvestTiles,
}) => {
  // Function to determine what instruction to show based on current state
  const getHumanPlayerInstruction = () => {
    // Step 1: No die selected yet
    if (selectedDieIndex === null) {
      return "🎲 Click on a dice to use it";
    }

    // Step 2: Die selected but no champion selected and no harvest tiles selected
    if (selectedChampionId === null && (!selectedHarvestTiles || selectedHarvestTiles.length === 0)) {
      return "👤 Click on a knight to move it, or click on tiles to harvest from";
    }

    // Step 2b: Die selected and harvest tiles selected but no champion
    if (selectedChampionId === null && selectedHarvestTiles && selectedHarvestTiles.length > 0) {
      return `🌾 ${selectedHarvestTiles.length} tile(s) selected for harvest → Enter to confirm / Esc to cancel`;
    }

    // Step 3: Champion selected and ready to move
    if (championMovementPath && championMovementPath.length <= 1) {
      return "⌨️ Use WASD keys to move → Enter to finish / Esc to cancel";
    }

    // Step 4: Champion is moving (has moved at least one step)
    return "🏃 Moving... Use WASD to continue → Enter to finish / Esc to cancel";
  };

  return (
    <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
      <div>
        <strong>Round:</strong> {gameState.currentRound} |<strong> Current Player:</strong>{" "}
        <span
          style={{
            color: gameState.getCurrentPlayer().color,
            fontWeight: "bold",
          }}
        >
          {gameState.getCurrentPlayer().name}
        </span>{" "}
        |<strong> Game Status:</strong> {simulationState}
        {simulationState === "finished" && gameState.winner !== undefined && (
          <span style={{ color: "#28a745", fontWeight: "bold" }}>
            {" "}
            | 🎉 Winner: {gameState.players[gameState.winner]?.name}
          </span>
        )}
      </div>
      {actionLogLength > 0 && (
        <div>
          <strong>Total Turns:</strong> {actionLogLength}
        </div>
      )}
      {humanPlayerWaiting && (
        <div
          style={{
            color: "#007bff",
            fontWeight: "bold",
            fontSize: "16px",
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#e7f3ff",
            borderRadius: "4px",
            border: "1px solid #007bff",
          }}
        >
          {getHumanPlayerInstruction()}
        </div>
      )}
    </div>
  );
};
