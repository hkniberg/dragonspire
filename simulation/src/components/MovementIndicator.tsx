// Lords of Doomspire Movement Indicator Component

import React from "react";

interface MovementIndicatorProps {
  championId: number;
  onCancel: () => void;
  onDone: () => void;
  canCancel: boolean;
}

const MovementIndicator: React.FC<MovementIndicatorProps> = ({ championId, onCancel, onDone, canCancel }) => {
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
        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={!canCancel}
          style={{
            backgroundColor: canCancel ? "#e74c3c" : "#bdc3c7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: canCancel ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            opacity: canCancel ? 1 : 0.6,
          }}
          title="Cancel entire movement (Esc key)"
        >
          ✖ Cancel
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
          title="Finish moving champion (Enter key)"
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
};

export default MovementIndicator;
