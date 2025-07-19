import type { GameState } from "../lib/gameState";
import { OceanZoneComponent, oceanZones } from "./OceanZone";
import { TileComponent } from "./Tile";

interface GameBoardProps {
  gameState: GameState;
  debugMode?: boolean;
}

export const GameBoard = ({ gameState, debugMode = false }: GameBoardProps) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Calculate claimed tiles for current player
  const claimedTiles = gameState.board
    .flat()
    .filter((tile) => tile.claimedBy === currentPlayer.id).length;

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* Left Panel - Player Info */}
      <div style={{ width: "200px" }}>
        <h3>Current Player: {currentPlayer.name}</h3>
        <div style={{ marginBottom: "20px" }}>
          <div>Fame: {currentPlayer.fame}</div>
          <div>Might: {currentPlayer.might}</div>
          <div>
            Claims: {claimedTiles}/{currentPlayer.maxClaims}
          </div>
        </div>

        <h4>Resources:</h4>
        <div style={{ marginBottom: "20px" }}>
          <div>Food: {currentPlayer.resources.food} 🥖</div>
          <div>Wood: {currentPlayer.resources.wood} 🪵</div>
          <div>Ore: {currentPlayer.resources.ore} ⛏️</div>
          <div>Gold: {currentPlayer.resources.gold} 🪙</div>
        </div>

        <h4>All Players:</h4>
        {gameState.players.map((player) => (
          <div
            key={player.id}
            style={{
              padding: "5px",
              backgroundColor:
                player.id === currentPlayer.id ? "#e6f3ff" : "transparent",
              borderRadius: "4px",
              marginBottom: "5px",
            }}
          >
            <strong>{player.name}</strong> - Fame: {player.fame}, Might:{" "}
            {player.might}
          </div>
        ))}
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
