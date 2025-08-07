// Lords of Doomspire Movement Indicator Component

import React from "react";

interface MovementIndicatorProps {
  championId: number;
  onUndo: () => void;
  onDone: () => void;
  canUndo: boolean;
}

const MovementIndicator: React.FC<MovementIndicatorProps> = ({ championId, onUndo, onDone, canUndo }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        minWidth: "120px",
        padding: "10px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          color: "#2c3e50",
          textAlign: "center",
        }}
      >
        Moving Champion {championId}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            backgroundColor: canUndo ? "#e74c3c" : "#bdc3c7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: canUndo ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            opacity: canUndo ? 1 : 0.6,
          }}
          title="Undo last move"
        >
          ↶ Undo
        </button>

        {/* Done Button */}
        <button
          onClick={onDone}
          style={{
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          title="Finish moving champion"
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
};

export default MovementIndicator;
