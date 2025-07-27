import type { GameState } from "../game/GameState";
import { OceanZoneComponent, oceanZones } from "./OceanZone";
import { PlayerInfoBox } from "./PlayerInfoBox";
import { TileComponent } from "./Tile";

interface GameBoardProps {
  gameState: GameState;
  debugMode?: boolean;
  playerConfigs?: { name: string; type: string }[]; // Player configurations to determine types
  onExtraInstructionsChange?: (playerName: string, instructions: string) => void; // Callback for updating extra instructions
}

// Player color scheme - uses the color stored in the player's profile
const getPlayerColor = (playerName: string, gameState: GameState): { main: string; light: string; dark: string } => {
  const player = gameState.players.find((p) => p.name === playerName);
  if (!player) {
    // Fallback to red if player not found
    return { main: "#e74c3c", light: "#fadbd8", dark: "#c0392b" };
  }

  // Create light and dark variants based on the player's assigned color
  const colorVariants: Record<string, { main: string; light: string; dark: string }> = {
    "#e74c3c": { main: "#e74c3c", light: "#fadbd8", dark: "#c0392b" }, // Red
    "#3498db": { main: "#3498db", light: "#d6eaf8", dark: "#2980b9" }, // Blue
    "#2ecc71": { main: "#2ecc71", light: "#d5f4e6", dark: "#27ae60" }, // Green
    "#f39c12": { main: "#f39c12", light: "#fdeaa7", dark: "#e67e22" }, // Orange
  };

  return colorVariants[player.color] || { main: player.color, light: player.color + "40", dark: player.color };
};

export const GameBoard = ({
  gameState,
  debugMode = false,
  playerConfigs,
  onExtraInstructionsChange,
}: GameBoardProps) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Create a getPlayerColor function that has gameState baked in
  const getPlayerColorWithState = (playerName: string) => getPlayerColor(playerName, gameState);

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        minWidth: "1480px", // 240px left panel + 20px gap + 1200px board + 20px padding
        width: "fit-content",
      }}
    >
      {/* Left Panel - All Players Info */}
      <div
        style={{
          width: "240px",
          flexShrink: 0, // Prevent the left panel from shrinking
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#2c3e50" }}>Players</h3>

        {gameState.players.map((player, playerIndex) => {
          const isCurrentPlayer = player.name == currentPlayer.name;
          const claimedTiles = gameState.board.getAllTiles().filter((tile) => tile.claimedBy === player.name).length;

          // Find the player type from configuration using the player index
          const playerConfig = playerConfigs?.[playerIndex];
          const playerType = playerConfig?.type;

          return (
            <PlayerInfoBox
              key={player.name}
              player={player}
              playerIndex={playerIndex}
              isCurrentPlayer={isCurrentPlayer}
              claimedTiles={claimedTiles}
              playerType={playerType}
              onExtraInstructionsChange={onExtraInstructionsChange}
              getPlayerColor={getPlayerColorWithState}
            />
          );
        })}
      </div>

      {/* Game Board */}
      <div
        style={{
          position: "relative",
          width: "1200px",
          height: "1200px",
          flexShrink: 0, // Prevent the game board from shrinking
        }}
      >
        {/* Ocean layer - 2x2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 600px)",
            gridTemplateRows: "repeat(2, 600px)",
            gap: "0px",
            width: "1200px",
            height: "1200px",
          }}
        >
          {oceanZones.map((zone) => (
            <OceanZoneComponent
              key={zone.id}
              zone={zone}
              players={gameState.players}
              getPlayerColor={getPlayerColorWithState}
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
          {gameState.board
            .getTilesGrid()
            .map((row, rowIndex) =>
              row.map((tile, colIndex) => (
                <TileComponent
                  key={`${rowIndex}-${colIndex}`}
                  tile={tile}
                  champions={gameState.players.flatMap((player) => player.champions)}
                  debugMode={debugMode}
                  getPlayerColor={getPlayerColorWithState}
                />
              )),
            )}
        </div>
      </div>
    </div>
  );
};
