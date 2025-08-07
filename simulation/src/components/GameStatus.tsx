import React from "react";
import { GameState } from "../game/GameState";

type SimulationState = "setup" | "playing" | "finished";

interface GameStatusProps {
  gameState: GameState;
  simulationState: SimulationState;
  actionLogLength: number;
  humanPlayerWaiting?: boolean;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  simulationState,
  actionLogLength,
  humanPlayerWaiting,
}) => {
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
          🎮 Waiting for human player action - First select a die, then click on a champion to move!
        </div>
      )}
    </div>
  );
};
