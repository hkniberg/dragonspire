import type { Champion, Player, ResourceType, Tile } from "../lib/types";
import { ClaimFlag } from "./ClaimFlag";

const getTileColor = (tile: Tile): string => {
  if (!tile.explored) {
    return "#8B4513"; // Brown for unexplored
  }

  // Color based on tile type
  if (tile.tileType === "resource") {
    return "#90EE90"; // Light green for resource tiles
  } else if (tile.tileType === "adventure") {
    return "#DDD"; // Light gray for adventure tiles
  } else if (tile.tileType === "doomspire") {
    return "#8B0000"; // Dark red for doomspire
  } else if (["chapel", "trader", "mercenary"].includes(tile.tileType || "")) {
    return "#F0F8FF"; // Alice blue for special locations
  }

  // Default based on tier
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
      case "adventure":
        return "❓"; // Big question mark for adventure tiles
      case "resource":
        return getResourceSymbol(tile);
      case "chapel":
        return "⛪";
      case "trader":
        return "🏪";
      case "mercenary":
        return "⚔️";
    }
  }

  return "";
};

const getResourceSymbol = (tile: Tile): string => {
  if (!tile.resources || !tile.explored) return "";

  // Find the first resource with a positive amount
  const resourceEntries = Object.entries(tile.resources);
  const activeResource = resourceEntries.find(([_, amount]) => amount > 0);

  if (!activeResource) return "";

  const [resourceType] = activeResource;
  const resourceSymbols = {
    food: "🌾",
    wood: "🪵",
    ore: "🪨",
    gold: "💰",
  };

  return resourceSymbols[resourceType as ResourceType];
};

const getSpecialLocationLabel = (tile: Tile): string => {
  if (!tile.tileType) return "";

  switch (tile.tileType) {
    case "chapel":
      return "Chapel";
    case "trader":
      return "Trader";
    case "mercenary":
      return "Mercenary";
    default:
      return "";
  }
};

export const TileComponent = ({
  tile,
  champions,
  currentPlayer,
  debugMode = false,
  getPlayerColor,
}: {
  tile: Tile;
  champions: Champion[];
  currentPlayer: Player;
  debugMode?: boolean;
  getPlayerColor: (playerId: number) => {
    main: string;
    light: string;
    dark: string;
  };
}) => {
  const championsOnTile = champions.filter(
    (champion) =>
      champion.position.row === tile.position.row &&
      champion.position.col === tile.position.col
  );

  // Create an effective tile state that considers debug mode
  const effectiveTile = {
    ...tile,
    explored: tile.explored || debugMode,
  };

  const specialLabel = getSpecialLocationLabel(effectiveTile);

  return (
    <div
      style={{
        width: "120px",
        height: "120px",
        backgroundColor: getTileColor(effectiveTile),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "bold",
        color: effectiveTile.explored ? "#000" : "#fff",
        border: `2px solid ${
          effectiveTile.tier === 1
            ? "#4CAF50"
            : effectiveTile.tier === 2
            ? "#FF9800"
            : "#F44336"
        }`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "transform 0.1s",
        position: "relative",
      }}
      title={`${effectiveTile.tileType || "Terrain"} (Tier ${
        effectiveTile.tier
      }) - Position: ${effectiveTile.position.row + 1}, ${
        effectiveTile.position.col + 1
      }
${
  effectiveTile.resources && Object.keys(effectiveTile.resources).length > 0
    ? `Resources: ${Object.entries(effectiveTile.resources)
        .filter(([_, amount]) => amount > 0)
        .map(([type, amount]) => `${type}: ${amount}`)
        .join(", ")}${effectiveTile.isStarred ? " ⭐" : ""}`
    : ""
}
${
  effectiveTile.claimedBy ? `Claimed by Player ${effectiveTile.claimedBy}` : ""
}${debugMode && !tile.explored ? " (DEBUG REVEALED)" : ""}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Main tile symbol - moved to bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {specialLabel ? (
          <>
            <div style={{ fontSize: "24px" }}>
              {getTileSymbol(effectiveTile)}
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: "bold",
                marginTop: "2px",
              }}
            >
              {specialLabel}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "24px" }}>{getTileSymbol(effectiveTile)}</div>
        )}

        {/* Resource details for resource tiles */}
        {effectiveTile.tileType === "resource" &&
          effectiveTile.resources &&
          Object.keys(effectiveTile.resources).length > 0 &&
          effectiveTile.explored && (
            <div style={{ fontSize: "10px", marginTop: "2px" }}>
              {Object.entries(effectiveTile.resources)
                .filter(([_, amount]) => amount > 0)
                .map(([type, amount]) => `${type}: ${amount}`)
                .join(", ")}
              {effectiveTile.isStarred && " ⭐"}
            </div>
          )}
      </div>

      {/* Flag indicator */}
      {effectiveTile.claimedBy && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "4px",
          }}
        >
          <ClaimFlag
            playerId={effectiveTile.claimedBy}
            getPlayerColor={getPlayerColor}
          />
        </div>
      )}

      {/* Champions on tile */}
      {championsOnTile.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            zIndex: 10,
          }}
        >
          {championsOnTile.map((champion) => {
            const playerColors = getPlayerColor(champion.playerId);
            return (
              <div
                key={champion.id}
                style={{
                  backgroundColor: playerColors.main,
                  color: "white",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "3px solid white",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.4)",
                }}
                title={`Champion ${champion.id} (Player ${champion.playerId})`}
              >
                ⚔️
              </div>
            );
          })}
        </div>
      )}

      {/* Tier indicator */}
      <div
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          fontSize: "16px",
          color:
            effectiveTile.tier === 1
              ? "#4CAF50"
              : effectiveTile.tier === 2
              ? "#FF9800"
              : "#F44336",
          fontWeight: "bold",
        }}
      >
        T{effectiveTile.tier}
      </div>
    </div>
  );
};
