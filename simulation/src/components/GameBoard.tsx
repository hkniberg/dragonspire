import type { GameState } from "../game/GameState";
import { OceanZoneComponent, oceanZones } from "./OceanZone";
import { TileComponent } from "./Tile";

interface GameBoardProps {
  gameState: GameState;
  debugMode?: boolean;
}

// Player color scheme - distinct colors for each player
const getPlayerColor = (
  playerId: number
): { main: string; light: string; dark: string } => {
  const colors = [
    { main: "#e74c3c", light: "#fadbd8", dark: "#c0392b" }, // Red
    { main: "#3498db", light: "#d6eaf8", dark: "#2980b9" }, // Blue
    { main: "#2ecc71", light: "#d5f4e6", dark: "#27ae60" }, // Green
    { main: "#f39c12", light: "#fdeaa7", dark: "#e67e22" }, // Orange
  ];
  return colors[(playerId - 1) % colors.length];
};

export const GameBoard = ({ gameState, debugMode = false }: GameBoardProps) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* Left Panel - All Players Info */}
      <div
        style={{
          width: "240px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h3
          style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#2c3e50" }}
        >
          Players
        </h3>

        {gameState.players.map((player) => {
          const colors = getPlayerColor(player.id);
          const isCurrentPlayer = player.id === currentPlayer.id;
          const claimedTiles = gameState.board
            .flat()
            .filter((tile) => tile.claimedBy === player.id).length;

          return (
            <div
              key={player.id}
              style={{
                padding: "12px",
                backgroundColor: isCurrentPlayer ? colors.light : "#f8f9fa",
                border: `2px solid ${
                  isCurrentPlayer ? colors.main : "#e9ecef"
                }`,
                borderRadius: "8px",
                boxShadow: isCurrentPlayer
                  ? `0 0 8px ${colors.main}40`
                  : "none",
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
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Fame:</span>
                  <strong>{player.fame}</strong>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Might:</span>
                  <strong>{player.might}</strong>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2px",
                  }}
                >
                  <div>🥖 {player.resources.food}</div>
                  <div>🪵 {player.resources.wood}</div>
                  <div>⛏️ {player.resources.ore}</div>
                  <div>🪙 {player.resources.gold}</div>
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
        })}
      </div>

      {/* Game Board */}
      <div
        style={{
          position: "relative",
          width: "1280px",
          height: "1280px",
        }}
      >
        {/* Ocean layer - 2x2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 640px)",
            gridTemplateRows: "repeat(2, 640px)",
            gap: "0px",
            width: "1280px",
            height: "1280px",
          }}
        >
          {oceanZones.map((zone) => (
            <OceanZoneComponent
              key={zone.id}
              zone={zone}
              players={gameState.players}
              getPlayerColor={getPlayerColor}
            />
          ))}
        </div>

        {/* Island layer - positioned on top of ocean */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "2px",
            backgroundColor: "#333",
            padding: "16px",
            borderRadius: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            width: "1040px",
            height: "1040px",
          }}
        >
          {gameState.board.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <TileComponent
                key={`${rowIndex}-${colIndex}`}
                tile={tile}
                champions={gameState.players.flatMap(
                  (player) => player.champions
                )}
                currentPlayer={currentPlayer}
                debugMode={debugMode}
                getPlayerColor={getPlayerColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
