import type { GameState } from "../lib/gameState";
import type { Champion, Player, Tile } from "../lib/types";

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

  switch (tile.type) {
    case "plains":
      return "#90EE90"; // Light green
    case "mountains":
      return "#A0A0A0"; // Gray
    case "woodlands":
      return "#228B22"; // Forest green
    case "water":
      return "#4169E1"; // Royal blue
    case "special":
      return "#DC143C"; // Crimson for special locations
    default:
      return "#DDD";
  }
};

const getTileSymbol = (tile: Tile): string => {
  if (!tile.explored) {
    return "?";
  }

  // Special locations
  if (tile.specialLocation) {
    switch (tile.specialLocation) {
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

  // Regular terrain
  switch (tile.type) {
    case "plains":
      return "🌾";
    case "mountains":
      return "⛰️";
    case "woodlands":
      return "🌲";
    case "water":
      return "💧";
    default:
      return "";
  }
};

const getResourceSymbol = (tile: Tile): string => {
  if (!tile.resourceType || !tile.explored) return "";

  const resourceSymbols = {
    food: "🥖",
    wood: "🪵",
    ore: "⛏️",
    gold: "🪙",
  };

  return resourceSymbols[tile.resourceType];
};

const OceanZoneComponent = ({
  zone,
  players,
}: {
  zone: (typeof oceanZones)[0];
  players: Player[];
}) => {
  const boatsInZone = players.filter(
    (player) => player.boatPosition === zone.id
  );

  return (
    <div
      style={{
        backgroundColor: "#1E90FF", // Deep sky blue
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "bold",
        border: "3px solid #0066CC",
        borderRadius: "8px",
        width: "320px",
        height: "320px",
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>
          {zone.label}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "10px" }}>
          {zone.name}
        </div>
        {boatsInZone.length > 0 && (
          <div style={{ fontSize: "16px" }}>
            {boatsInZone.map((player) => (
              <div
                key={player.id}
                style={{ color: `hsl(${(player.id - 1) * 90}, 70%, 80%)` }}
              >
                🚢 P{player.id}
              </div>
            ))}
          </div>
        )}
      </div>
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
      title={`${tile.specialLocation || tile.type} (Tier ${
        tile.tier
      }) - Position: ${tile.position.row + 1}, ${tile.position.col + 1}
${
  tile.resourceType
    ? `Resource: ${tile.resourceType} (${tile.resourceAmount})${
        tile.isStarred ? " ⭐" : ""
      }`
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
      {tile.resourceType && tile.explored && (
        <div style={{ fontSize: "8px", marginTop: "2px" }}>
          {getResourceSymbol(tile)}
          {tile.resourceAmount}
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
  const allChampions = gameState.players.flatMap((player) => player.champions);
  const currentPlayer = gameState.getCurrentPlayer();

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Lords of Doomspire - Round {gameState.currentRound}
      </h2>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {/* Game Board */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Ocean layer - 2x2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 320px)",
              gridTemplateRows: "repeat(2, 320px)",
              gap: "0px",
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
              padding: "10px",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {gameState.board.map((row, rowIndex) =>
              row.map((tile, colIndex) => (
                <TileComponent
                  key={`${rowIndex}-${colIndex}`}
                  tile={tile}
                  champions={allChampions}
                  currentPlayer={currentPlayer}
                />
              ))
            )}
          </div>
        </div>

        {/* Game Status */}
        <div style={{ minWidth: "300px" }}>
          <h3>Current Player: {currentPlayer.name}</h3>
          <div style={{ marginBottom: "20px" }}>
            <div>Fame: {currentPlayer.fame}</div>
            <div>Might: {currentPlayer.might}</div>
            <div>
              Flags: {currentPlayer.flagsPlaced}/{currentPlayer.maxFlags}
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
      </div>
    </div>
  );
};
