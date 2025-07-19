import type { GameState } from "../lib/gameState";
import type { Champion, Player, ResourceType, Tile } from "../lib/types";

interface BoardComponentProps {
  gameState: GameState;
}

// Ocean zones around the island
const oceanZones = [
  { id: 0, label: "A", name: "Northwest Sea", position: "northwest" },
  { id: 1, label: "B", name: "Northeast Sea", position: "northeast" },
  { id: 2, label: "C", name: "Southwest Sea", position: "southwest" },
  { id: 3, label: "D", name: "Southeast Sea", position: "southeast" },
];

const getTileColor = (tile: Tile): string => {
  if (!tile.explored) {
    return "#8B4513"; // Brown for unexplored
  }

  // Since we no longer have tile.type, use tier for basic coloring
  switch (tile.tier) {
    case 1:
      return "#90EE90"; // Light green for tier 1
    case 2:
      return "#A0A0A0"; // Gray for tier 2
    case 3:
      return "#DC143C"; // Crimson for tier 3
    default:
      return "#DDD";
  }
};

const getTileSymbol = (tile: Tile): string => {
  if (!tile.explored) {
    return "?";
  }

  // Special locations
  if (tile.tileType) {
    switch (tile.tileType) {
      case "doomspire":
        return "🐉";
      case "chapel":
        return "⛪";
      case "trader":
        return "🏪";
      case "mercenary":
        return "⚔️";
    }
  }

  // Default terrain based on tier
  switch (tile.tier) {
    case 1:
      return "🌾"; // Plains for tier 1
    case 2:
      return "⛰️"; // Mountains for tier 2
    case 3:
      return "🌲"; // Forest for tier 3
    default:
      return "";
  }
};

const getResourceSymbol = (tile: Tile): string => {
  if (!tile.resources || !tile.explored) return "";

  // Find the first resource with a positive amount
  const resourceEntries = Object.entries(tile.resources);
  const activeResource = resourceEntries.find(([_, amount]) => amount > 0);

  if (!activeResource) return "";

  const [resourceType] = activeResource;
  const resourceSymbols = {
    food: "🥖",
    wood: "🪵",
    ore: "⛏️",
    gold: "🪙",
  };

  return resourceSymbols[resourceType as ResourceType];
};

const OceanZoneComponent = ({
  zone,
  players,
}: {
  zone: (typeof oceanZones)[0];
  players: Player[];
}) => {
  // For now, since boats don't have zone mapping, show empty boats
  const boatsInZone: Player[] = [];

  return (
    <div
      style={{
        backgroundColor: "#87CEEB", // Sky blue for ocean
        color: "#000080", // Dark blue text
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "320px",
        width: "320px",
        fontSize: "16px",
        fontWeight: "bold",
        border: "2px solid #4682B4",
        position: "relative",
      }}
    >
      {/* Zone label in corner */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#000080",
        }}
      >
        {zone.label}
      </div>

      {boatsInZone.length > 0 && (
        <div style={{ fontSize: "16px", marginTop: "10px" }}>
          🛥️ {boatsInZone.length}
        </div>
      )}
    </div>
  );
};

const TileComponent = ({
  tile,
  champions,
  currentPlayer,
}: {
  tile: Tile;
  champions: Champion[];
  currentPlayer: Player;
}) => {
  const championsOnTile = champions.filter(
    (champion) =>
      champion.position.row === tile.position.row &&
      champion.position.col === tile.position.col
  );

  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        backgroundColor: getTileColor(tile),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        color: tile.explored ? "#000" : "#fff",
        border: `2px solid ${
          tile.tier === 1 ? "#4CAF50" : tile.tier === 2 ? "#FF9800" : "#F44336"
        }`,
        borderRadius: "4px",
        cursor: "pointer",
        transition: "transform 0.1s",
        position: "relative",
      }}
      title={`${tile.tileType || "Terrain"} (Tier ${tile.tier}) - Position: ${
        tile.position.row + 1
      }, ${tile.position.col + 1}
${
  tile.resources && Object.keys(tile.resources).length > 0
    ? `Resources: ${Object.entries(tile.resources)
        .filter(([_, amount]) => amount > 0)
        .map(([type, amount]) => `${type}: ${amount}`)
        .join(", ")}${tile.isStarred ? " ⭐" : ""}`
    : ""
}
${tile.claimedBy ? `Claimed by Player ${tile.claimedBy}` : ""}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Main tile symbol */}
      <div style={{ fontSize: "16px" }}>{getTileSymbol(tile)}</div>

      {/* Resource symbol */}
      {tile.resources &&
        Object.keys(tile.resources).length > 0 &&
        tile.explored && (
          <div style={{ fontSize: "8px", marginTop: "2px" }}>
            {getResourceSymbol(tile)}
            {Object.entries(tile.resources)
              .filter(([_, amount]) => amount > 0)
              .map(([type, amount]) => `${type}: ${amount}`)
              .join(", ")}
            {tile.isStarred && "⭐"}
          </div>
        )}

      {/* Flag indicator */}
      {tile.claimedBy && (
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: "2px",
            fontSize: "8px",
            color: `hsl(${(tile.claimedBy - 1) * 90}, 70%, 50%)`,
          }}
        >
          🚩
        </div>
      )}

      {/* Champions on tile */}
      {championsOnTile.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            right: "2px",
            fontSize: "8px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {championsOnTile.map((champion) => (
            <span
              key={champion.id}
              style={{
                color: `hsl(${(champion.playerId - 1) * 90}, 70%, 50%)`,
              }}
            >
              C{champion.id}
            </span>
          ))}
        </div>
      )}

      {/* Tier indicator */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          right: "2px",
          fontSize: "8px",
          color:
            tile.tier === 1
              ? "#4CAF50"
              : tile.tier === 2
              ? "#FF9800"
              : "#F44336",
          fontWeight: "bold",
        }}
      >
        T{tile.tier}
      </div>
    </div>
  );
};

export const BoardComponent = ({ gameState }: BoardComponentProps) => {
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
          width: "640px",
          height: "640px",
        }}
      >
        {/* Ocean layer - 2x2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 320px)",
            gridTemplateRows: "repeat(2, 320px)",
            gap: "0px",
            width: "640px",
            height: "640px",
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
            gap: "1px",
            backgroundColor: "#333",
            padding: "8px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            width: "520px",
            height: "520px",
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
