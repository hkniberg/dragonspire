import type { Player } from "../lib/types";

interface PlayerInfoBoxProps {
  player: Player;
  isCurrentPlayer: boolean;
  claimedTiles: number;
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
          <div key={boat.id} style={{ marginBottom: "2px" }}>
            <span style={{ color: colors.main, fontWeight: "bold" }}>
              🚢 B{boat.id}
            </span>
            <span style={{ marginLeft: "4px", color: "#6c757d" }}>
              {boat.position.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
