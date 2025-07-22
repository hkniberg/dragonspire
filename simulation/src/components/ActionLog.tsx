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
          const messages = GameLogger.formatTurnUnified(turn);

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
                      : message.includes("Player Diary:")
                      ? "#0c5460"
                      : message.includes("Dice rolled:")
                      ? "#495057"
                      : message.includes("Total harvested:")
                      ? "#6f42c1"
                      : "#28a745", // Default green for action results
                    fontStyle: message.includes("Player Diary:")
                      ? "italic"
                      : "normal",
                    fontWeight: message.includes("---") ? "bold" : "normal",
                  }}
                >
                  {message}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
