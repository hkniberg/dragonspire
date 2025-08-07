// Lords of Doomspire Human Player Decision Modal

import React from "react";
import { DecisionContext, DecisionOption } from "@/lib/types";

interface HumanPlayerModalProps {
  isOpen: boolean;
  decisionContext: DecisionContext;
  onDecision: (choice: string) => void;
  onCancel?: () => void;
}

export const HumanPlayerModal: React.FC<HumanPlayerModalProps> = ({
  isOpen,
  decisionContext,
  onDecision,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "500px",
          minWidth: "400px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#2c3e50",
            fontSize: "18px",
          }}
        >
          Player Decision Required
        </h3>

        <p
          style={{
            marginBottom: "20px",
            color: "#34495e",
            lineHeight: "1.5",
          }}
        >
          {decisionContext.description}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {decisionContext.options.map((option: DecisionOption) => (
            <button
              key={option.id}
              onClick={() => onDecision(option.id)}
              style={{
                padding: "12px 16px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                textAlign: "left",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#2980b9";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#3498db";
              }}
            >
              {option.description}
            </button>
          ))}
        </div>

        {onCancel && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                backgroundColor: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
