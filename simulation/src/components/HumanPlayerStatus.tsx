// Lords of Doomspire Human Player Status Component

import React from "react";

type ActionType = "movement" | "harvest" | "diceSelection";

interface HumanPlayerStatusProps {
  actionType: ActionType;
  championId?: number;
  selectedTileCount?: number;
  maxTiles?: number;
  onCancel: () => void;
  onDone: () => void;
  canCancel: boolean;
  canConfirm: boolean;
}

const HumanPlayerStatus: React.FC<HumanPlayerStatusProps> = ({
  actionType,
  championId,
  selectedTileCount,
  maxTiles,
  onCancel,
  onDone,
  canCancel,
  canConfirm,
}) => {
  const getTitle = () => {
    if (actionType === "movement") {
      return `Moving Champion ${championId}`;
    } else if (actionType === "harvest") {
      return "Harvest Action";
    } else {
      return "Your Turn";
    }
  };

  const getInstructions = () => {
    if (actionType === "movement") {
      return "⌨️ Use WASD keys to move → Enter to finish / Esc to cancel";
    } else if (actionType === "harvest") {
      return `🌾 ${selectedTileCount}/${maxTiles} tile(s) selected → Enter to confirm / Esc to cancel`;
    } else {
      return "🎲 Click on a dice to use it, then click on a knight to move it or click on tiles to harvest from";
    }
  };

  const getInstructionStyle = () => {
    if (actionType === "movement") {
      return {
        backgroundColor: "#e8f4fd",
        border: "1px solid #3498db",
      };
    } else if (actionType === "harvest") {
      return {
        backgroundColor: "#fff3cd",
        border: "1px solid #f39c12",
      };
    } else {
      return {
        backgroundColor: "#e7f3ff",
        border: "1px solid #007bff",
      };
    }
  };

  const getConfirmButtonText = () => {
    return actionType === "movement" ? "✓ Done" : "✓ Harvest";
  };

  const getConfirmButtonTitle = () => {
    return actionType === "movement" ? "Finish moving champion (Enter key)" : "Confirm harvest action (Enter key)";
  };

  const getCancelButtonTitle = () => {
    return actionType === "movement" ? "Cancel entire movement (Esc key)" : "Cancel harvest selection (Esc key)";
  };

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
        {getTitle()}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#7f8c8d",
          textAlign: "center",
          padding: "8px",
          borderRadius: "6px",
          ...getInstructionStyle(),
        }}
      >
        {getInstructions()}
      </div>

      {actionType !== "diceSelection" && (
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
            title={getCancelButtonTitle()}
          >
            ✖ Cancel
          </button>

          {/* Confirm Button */}
          <button
            onClick={onDone}
            disabled={!canConfirm}
            style={{
              backgroundColor: canConfirm ? "#27ae60" : "#bdc3c7",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: canConfirm ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: canConfirm ? 1 : 0.6,
            }}
            title={getConfirmButtonTitle()}
          >
            {getConfirmButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default HumanPlayerStatus;
