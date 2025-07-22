import type { Player } from "../lib/types";

// Function to get boat image path based on player ID
const getBoatImagePath = (playerId: number): string => {
  const boatColors = ["red", "blue", "green", "orange"];
  const colorIndex = (playerId - 1) % boatColors.length;
  return `/boats/boat-${boatColors[colorIndex]}.png`;
};

interface PlayerInfoBoxProps {
  player: Player;
  isCurrentPlayer: boolean;
  claimedTiles: number;
  playerType?: string; // Added to identify if this is a Claude player
  onExtraInstructionsChange?: (playerId: number, instructions: string) => void; // Callback for updating extra instructions
  getPlayerColor: (playerId: number) => {
    main: string;
    light: string;
    dark: string;
  };
}

export const PlayerInfoBox = ({
  player,
  isCurrentPlayer,
  claimedTiles,
  playerType,
  onExtraInstructionsChange,
  getPlayerColor,
}: PlayerInfoBoxProps) => {
  const colors = getPlayerColor(player.id);

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
      {/* Player Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            backgroundColor: colors.main,
            borderRadius: "50%",
            marginRight: "8px",
            border: "2px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
        <strong style={{ fontSize: "16px", color: colors.dark }}>
          {player.name}
        </strong>
        {isCurrentPlayer && (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "14px",
              color: colors.main,
              fontWeight: "bold",
            }}
          >
            ◀ Current
          </span>
        )}
      </div>

      {/* Player Stats */}
      <div
        style={{
          fontSize: "13px",
          color: "#495057",
          lineHeight: "1.4",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Fame:</span>
          <strong>{player.fame}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Might:</span>
          <strong>{player.might}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Claims:</span>
          <strong>
            {claimedTiles}/{player.maxClaims}
          </strong>
        </div>
      </div>

      {/* Resources */}
      <div style={{ marginTop: "8px", fontSize: "12px" }}>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "4px",
            color: "#495057",
          }}
        >
          Resources:
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <span>🌾 {player.resources.food}</span>
          <span>🪵 {player.resources.wood}</span>
          <span>🪨 {player.resources.ore}</span>
          <span>💰 {player.resources.gold}</span>
        </div>
      </div>

      {/* Champions */}
      <div style={{ marginTop: "8px", fontSize: "12px" }}>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "4px",
            color: "#495057",
          }}
        >
          Champions:
        </div>
        {player.champions.map((champion) => (
          <div key={champion.id} style={{ marginBottom: "2px" }}>
            <span style={{ color: colors.main, fontWeight: "bold" }}>
              ⚔️ C{champion.id}
            </span>
            <span style={{ marginLeft: "4px", color: "#6c757d" }}>
              ({champion.position.row + 1},{champion.position.col + 1})
            </span>
          </div>
        ))}
      </div>

      {/* Boats */}
      <div style={{ marginTop: "8px", fontSize: "12px" }}>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "4px",
            color: "#495057",
          }}
        >
          Boats:
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
              src={getBoatImagePath(player.id)}
              alt={`Boat ${boat.id}`}
              style={{
                width: "16px",
                height: "16px",
                objectFit: "contain",
                marginRight: "4px",
              }}
            />
            <span style={{ color: colors.main, fontWeight: "bold" }}>
              B{boat.id}
            </span>
            <span style={{ marginLeft: "4px", color: "#6c757d" }}>
              {boat.position.toUpperCase()}
            </span>
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
            onChange={(e) =>
              onExtraInstructionsChange(player.id, e.target.value)
            }
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
