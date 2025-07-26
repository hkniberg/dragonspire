import type { Player } from "../lib/types";
import { ResourceDisplay } from "./ResourceDisplay";

// Function to get boat image path based on player index
const getBoatImagePath = (playerIndex: number): string => {
  const boatColors = ["red", "blue", "green", "orange"];
  const colorIndex = playerIndex % boatColors.length;
  return `/boats/boat-${boatColors[colorIndex]}.png`;
};

interface PlayerInfoBoxProps {
  player: Player;
  playerIndex: number; // Add playerIndex to replace the non-existent player.id
  isCurrentPlayer: boolean;
  claimedTiles: number;
  playerType?: string; // Added to identify if this is a Claude player
  onExtraInstructionsChange?: (playerName: string, instructions: string) => void; // Callback for updating extra instructions
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
}

export const PlayerInfoBox = ({
  player,
  playerIndex,
  isCurrentPlayer,
  claimedTiles,
  playerType,
  onExtraInstructionsChange,
  getPlayerColor,
}: PlayerInfoBoxProps) => {
  const colors = getPlayerColor(player.name);

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: isCurrentPlayer ? colors.light : "#f8f9fa",
        border: `2px solid ${isCurrentPlayer ? colors.main : "#e9ecef"}`,
        borderRadius: "8px",
        boxShadow: isCurrentPlayer ? `0 0 8px ${colors.main}40` : "none",
      }}
    >
      {/* Player Name and Fame/Might */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div>
          <h4
            style={{
              margin: "0 0 2px 0",
              fontSize: "14px",
              fontWeight: "bold",
              color: isCurrentPlayer ? colors.main : "#2c3e50",
            }}
          >
            {player.name}
            {isCurrentPlayer && " ⭐"}
          </h4>
          <div style={{ fontSize: "11px", color: "#6c757d" }}>
            Fame: {player.fame} | Might: {player.might}
          </div>
        </div>

        {/* Player Type Badge */}
        {playerType && (
          <div
            style={{
              fontSize: "10px",
              backgroundColor: playerType === "claude" ? "#007bff" : "#6c757d",
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
            }}
          >
            {playerType}
          </div>
        )}
      </div>

      {/* Resources */}
      <div style={{ marginBottom: "8px" }}>
        <ResourceDisplay resources={player.resources} />
      </div>

      {/* Champions */}
      <div style={{ marginBottom: "8px" }}>
        {player.champions.map((champion) => (
          <div
            key={champion.id}
            style={{
              marginBottom: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "4px", fontSize: "12px" }}>⚔️</span>
            <span style={{ color: colors.main, fontWeight: "bold", fontSize: "12px" }}>Champion {champion.id}</span>
            <span style={{ marginLeft: "4px", color: "#6c757d", fontSize: "12px" }}>
              ({champion.position.row},{champion.position.col})
            </span>
          </div>
        ))}
      </div>

      {/* Boats */}
      <div style={{ marginBottom: "8px" }}>
        {player.boats.map((boat) => (
          <div
            key={boat.id}
            style={{
              marginBottom: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={getBoatImagePath(playerIndex)}
              alt={`Boat ${boat.id}`}
              style={{
                width: "16px",
                height: "16px",
                objectFit: "contain",
                marginRight: "4px",
              }}
            />
            <span style={{ color: colors.main, fontWeight: "bold", fontSize: "12px" }}>Boat {boat.id}</span>
            <span style={{ marginLeft: "4px", color: "#6c757d", fontSize: "12px" }}>{boat.position.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Extra Instructions for Claude Players */}
      {playerType === "claude" && onExtraInstructionsChange && (
        <div style={{ marginTop: "12px", fontSize: "12px" }}>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "6px",
              color: "#495057",
            }}
          >
            Extra Instructions:
          </div>
          <textarea
            defaultValue={player.extraInstructions || ""}
            onBlur={(e) => onExtraInstructionsChange(player.name, e.target.value)}
            placeholder="Enter additional instructions for this AI player..."
            style={{
              width: "100%",
              height: "60px",
              padding: "6px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "Arial, sans-serif",
              resize: "vertical",
              backgroundColor: "#f8f9fa",
            }}
          />
        </div>
      )}
    </div>
  );
};
