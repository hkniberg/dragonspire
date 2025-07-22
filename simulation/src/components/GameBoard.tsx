import type { GameState } from "../game/GameState";
import { OceanZoneComponent, oceanZones } from "./OceanZone";
import { PlayerInfoBox } from "./PlayerInfoBox";
import { TileComponent } from "./Tile";

interface GameBoardProps {
  gameState: GameState;
  debugMode?: boolean;
  playerConfigs?: { name: string; type: string }[]; // Player configurations to determine types
  onExtraInstructionsChange?: (playerId: number, instructions: string) => void; // Callback for updating extra instructions
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

export const GameBoard = ({
  gameState,
  debugMode = false,
  playerConfigs,
  onExtraInstructionsChange,
}: GameBoardProps) => {
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
          const isCurrentPlayer = player.id === currentPlayer.id;
          const claimedTiles = gameState.board
            .flat()
            .filter((tile) => tile.claimedBy === player.id).length;

          // Find the player type from configuration
          const playerConfig = playerConfigs?.find(
            (config, index) => index + 1 === player.id
          );
          const playerType = playerConfig?.type;

          return (
            <PlayerInfoBox
              key={player.id}
              player={player}
              isCurrentPlayer={isCurrentPlayer}
              claimedTiles={claimedTiles}
              playerType={playerType}
              onExtraInstructionsChange={onExtraInstructionsChange}
              getPlayerColor={getPlayerColor}
            />
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
