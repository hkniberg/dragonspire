import React from "react";

// Simple spinner for loading states
const Spinner = ({ size = 20 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid #f3f3f3`,
      borderTop: `2px solid #3498db`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginRight: "8px",
    }}
  />
);

type SimulationState = "setup" | "playing" | "finished";

interface ControlPanelProps {
  simulationState: SimulationState;
  isExecutingTurn: boolean;
  autoPlay: boolean;
  autoPlaySpeed: number;
  showActionLog: boolean;
  debugMode: boolean;
  isStartingGame: boolean;
  onStartNewGame: () => void;
  onExecuteNextTurn: () => void;
  onToggleAutoPlay: () => void;
  onSetAutoPlaySpeed: (speed: number) => void;
  onResetGame: () => void;
  onToggleActionLog: () => void;
  onToggleDebugMode: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationState,
  isExecutingTurn,
  autoPlay,
  autoPlaySpeed,
  showActionLog,
  debugMode,
  isStartingGame,
  onStartNewGame,
  onExecuteNextTurn,
  onToggleAutoPlay,
  onSetAutoPlaySpeed,
  onResetGame,
  onToggleActionLog,
  onToggleDebugMode,
}) => {
  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {simulationState === "setup" && (
          <button
            onClick={onStartNewGame}
            disabled={isStartingGame}
            style={{
              padding: "10px 20px",
              backgroundColor: isStartingGame ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: isStartingGame ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isStartingGame ? (
              <>
                <Spinner />
                Starting Game...
              </>
            ) : (
              "🎮 Start New Game"
            )}
          </button>
        )}

        {simulationState === "playing" && (
          <>
            <button
              onClick={onExecuteNextTurn}
              disabled={isExecutingTurn || autoPlay}
              style={{
                padding: "10px 20px",
                backgroundColor: isExecutingTurn || autoPlay ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: isExecutingTurn || autoPlay ? "not-allowed" : "pointer",
              }}
            >
              {isExecutingTurn ? (
                <>
                  <Spinner />
                  Executing Turn...
                </>
              ) : (
                "▶️ Next Turn"
              )}
            </button>

            <button
              onClick={onToggleAutoPlay}
              style={{
                padding: "10px 20px",
                backgroundColor: autoPlay ? "#dc3545" : "#ffc107",
                color: autoPlay ? "white" : "#000",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {autoPlay ? "⏸️ Pause Auto-Play" : "⏩ Auto-Play"}
            </button>

            {autoPlay && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <label style={{ fontSize: "14px" }}>Speed:</label>
                <select
                  value={autoPlaySpeed}
                  onChange={(e) => onSetAutoPlaySpeed(Number(e.target.value))}
                  style={{
                    padding: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value={500}>Fast (0.5s)</option>
                  <option value={1000}>Normal (1s)</option>
                  <option value={2000}>Slow (2s)</option>
                  <option value={5000}>Very Slow (5s)</option>
                </select>
              </div>
            )}
          </>
        )}

        {(simulationState === "playing" || simulationState === "finished") && (
          <>
            <button
              onClick={onResetGame}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🔄 Reset Game
            </button>

            <button
              onClick={onToggleActionLog}
              style={{
                padding: "10px 20px",
                backgroundColor: showActionLog ? "#17a2b8" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {showActionLog ? "📋 Hide Log" : "📋 Show Log"}
            </button>

            <button
              onClick={onToggleDebugMode}
              style={{
                padding: "10px 20px",
                backgroundColor: debugMode ? "#ff6b35" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {debugMode ? "🔍 Hide All Tiles" : "🔍 Reveal All Tiles"}
            </button>
          </>
        )}

        {/* Universal buttons - always visible */}
        <a
          href="/cards"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#8B0000",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          🃏 Card Gallery
        </a>

        <a
          href="/print"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          🖨️ Print
        </a>
      </div>
    </div>
  );
};
