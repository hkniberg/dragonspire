import React from "react";
import { GameLogger } from "../lib/gameLogger";

interface ActionLogProps {
  actionLog: any[];
  isVisible: boolean;
}

export const ActionLog: React.FC<ActionLogProps> = ({
  actionLog,
  isVisible,
}) => {
  if (!isVisible || actionLog.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: "8px",
        border: "1px solid #ddd",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#2c3e50" }}>📋 Detailed Action Log</h3>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.4",
        }}
      >
        {actionLog.map((turn, index) => {
          const detailedTurn = GameLogger.enhanceWithDetailedActions(turn);
          const messages = GameLogger.getCliTurnMessages(detailedTurn);

          return (
            <div
              key={index}
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                border: "1px solid #e9ecef",
              }}
            >
              {messages.map((message, msgIndex) => (
                <div
                  key={msgIndex}
                  style={{
                    marginBottom: "2px",
                    color: message.includes("---")
                      ? "#2c3e50"
                      : message.includes("succeeded")
                      ? "#28a745"
                      : message.includes("failed")
                      ? "#dc3545"
                      : message.includes("Summary:")
                      ? "#6f42c1"
                      : "#495057",
                  }}
                >
                  {message}
                </div>
              ))}

              {/* Display diary entry if it exists */}
              {turn.diaryEntry && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    backgroundColor: "#e8f4f8",
                    borderLeft: "3px solid #17a2b8",
                    borderRadius: "3px",
                    fontStyle: "italic",
                    color: "#0c5460",
                  }}
                >
                  <strong>💭 Player Diary:</strong> {turn.diaryEntry}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
