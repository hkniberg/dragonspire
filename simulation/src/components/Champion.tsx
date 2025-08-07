import React from "react";
import type { Champion } from "../lib/types";

// Add CSS for blinking animation
const championStyles = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
  }
`;

// Inject styles into the document
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = championStyles;
  document.head.appendChild(styleElement);
}

export const ChampionComponent = ({
  champion,
  getPlayerColor,
  onDragStart,
  onDragEnd,
  isSelected,
  onSelect,
  allowDragging = false,
}: {
  champion: Champion;
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
  onDragStart?: (champion: Champion, event: React.DragEvent) => void;
  onDragEnd?: (champion: Champion, event: React.DragEvent) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  allowDragging?: boolean;
}) => {
  const playerColors = getPlayerColor(champion.playerName);

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(champion, e);
    }
    e.dataTransfer.setData("text/plain", JSON.stringify(champion));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(champion, e);
    }
  };

  return (
    <div
      style={{
        backgroundColor: playerColors.main,
        color: "white",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "bold",
        border: isSelected ? "3px solid #FFD700" : "3px solid white",
        boxShadow: isSelected ? "0 0 10px #FFD700, 0 3px 6px rgba(0,0,0,0.4)" : "0 3px 6px rgba(0,0,0,0.4)",
        position: "relative",
        cursor: onSelect ? "pointer" : allowDragging ? "grab" : "default",
        animation: isSelected ? "blink 1s infinite" : "none",
      }}
      title={`Champion ${champion.id} (${champion.playerName}) - ${onSelect ? "Click to select/move" : allowDragging ? "Drag to move" : "Champion"}`}
      draggable={allowDragging && !onSelect}
      onDragStart={allowDragging ? handleDragStart : undefined}
      onDragEnd={allowDragging ? handleDragEnd : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) {
          onSelect();
        }
      }}
    >
      <img
        src="/knights/knight.png"
        alt="Knight"
        style={{
          width: "48px",
          height: "48px",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {champion.id}
      </div>
    </div>
  );
};
