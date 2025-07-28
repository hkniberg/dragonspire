import { Player } from "@/lib/types";
import React from "react";

interface PlayerFilterProps {
  players: Player[];
  selectedPlayer: string | null;
  onPlayerFilterChange: (playerName: string | null) => void;
}

export const PlayerFilter: React.FC<PlayerFilterProps> = ({ players, selectedPlayer, onPlayerFilterChange }) => {
  const handlePlayerClick = (playerName: string) => {
    if (selectedPlayer === playerName) {
      // If clicking the same player, show all players
      onPlayerFilterChange(null);
    } else {
      // Otherwise, filter to show only this player
      onPlayerFilterChange(playerName);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {players.map((player) => {
        const isSelected = selectedPlayer === player.name;
        const isVisible = selectedPlayer === null || selectedPlayer === player.name;

        return (
          <button
            key={player.name}
            onClick={() => handlePlayerClick(player.name)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "bold",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: isVisible ? player.color : "#6c757d",
              color: isVisible ? "white" : "#adb5bd",
              transition: "all 0.2s ease",
              minWidth: "60px",
              textAlign: "center" as const,
            }}
            title={`${isSelected ? "Show all players" : `Show only ${player.name}`}`}
            onMouseEnter={(e) => {
              if (!isVisible) {
                e.currentTarget.style.backgroundColor = player.color;
                e.currentTarget.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (!isVisible) {
                e.currentTarget.style.backgroundColor = "#6c757d";
                e.currentTarget.style.color = "#adb5bd";
              }
            }}
          >
            {player.name}
          </button>
        );
      })}
    </div>
  );
};
