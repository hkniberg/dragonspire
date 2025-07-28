import React from "react";
import type { Champion } from "../lib/types";

export const ChampionComponent = ({
  champion,
  getPlayerColor,
  onDragStart,
  onDragEnd,
}: {
  champion: Champion;
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
  onDragStart?: (champion: Champion, event: React.DragEvent) => void;
  onDragEnd?: (champion: Champion, event: React.DragEvent) => void;
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
        border: "3px solid white",
        boxShadow: "0 3px 6px rgba(0,0,0,0.4)",
        position: "relative",
        cursor: "grab",
      }}
      title={`Champion ${champion.id} (${champion.playerName}) - Drag to move`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
