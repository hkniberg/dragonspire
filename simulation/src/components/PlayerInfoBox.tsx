import type { Player } from "../lib/types";

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
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#495057" }}>Resources:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", fontSize: "10px" }}>
          <span style={{ backgroundColor: "#4caf50", color: "white", padding: "1px 4px", borderRadius: "3px" }}>
            F: {player.resources.food}
          </span>
          <span style={{ backgroundColor: "#8d6e63", color: "white", padding: "1px 4px", borderRadius: "3px" }}>
            W: {player.resources.wood}
          </span>
          <span style={{ backgroundColor: "#757575", color: "white", padding: "1px 4px", borderRadius: "3px" }}>
            O: {player.resources.ore}
          </span>
          <span style={{ backgroundColor: "#ffc107", color: "black", padding: "1px 4px", borderRadius: "3px" }}>
            G: {player.resources.gold}
          </span>
        </div>
      </div>

      {/* Champions */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#495057" }}>
          Champions: ({player.champions.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", fontSize: "10px" }}>
          {player.champions.map((champion) => (
            <span
              key={champion.id}
              style={{
                backgroundColor: colors.main,
                color: "white",
                padding: "1px 4px",
                borderRadius: "3px",
              }}
            >
              C{champion.id} ({champion.position.row},{champion.position.col})
            </span>
          ))}
        </div>
      </div>

      {/* Boats */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#495057" }}>
          Boats: ({player.boats.length})
        </div>
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
            <span style={{ color: colors.main, fontWeight: "bold" }}>B{boat.id}</span>
            <span style={{ marginLeft: "4px", color: "#6c757d" }}>{boat.position.toUpperCase()}</span>
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
            value={player.extraInstructions || ""}
            onChange={(e) => onExtraInstructionsChange(player.name, e.target.value)}
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
