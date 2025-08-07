// Lords of Doomspire Settings Menu

import React, { useState } from "react";

interface SettingsMenuProps {
  debugMode: boolean;
  onToggleDebugMode: () => void;
  allowDragging: boolean;
  onToggleAllowDragging: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  debugMode,
  onToggleDebugMode,
  allowDragging,
  onToggleAllowDragging,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 15px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#5a6268";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#6c757d";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        title="Game Settings"
      >
        ☰ Settings
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Settings Panel */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "8px",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              padding: "16px",
              minWidth: "250px",
              zIndex: 999,
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                color: "#2c3e50",
                fontSize: "16px",
                borderBottom: "1px solid #eee",
                paddingBottom: "8px",
              }}
            >
              Game Settings
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input type="checkbox" checked={debugMode} onChange={onToggleDebugMode} style={{ cursor: "pointer" }} />
                <span>Reveal All Tiles (Debug Mode)</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={allowDragging}
                  onChange={onToggleAllowDragging}
                  style={{ cursor: "pointer" }}
                />
                <span>Allow Dragging Champions</span>
              </label>
            </div>

            <div
              style={{
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: "1px solid #eee",
                fontSize: "12px",
                color: "#666",
              }}
            >
              Use WASD keys to move selected champions
            </div>
          </div>
        </>
      )}
    </div>
  );
};
