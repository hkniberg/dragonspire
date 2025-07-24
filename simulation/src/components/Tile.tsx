import type { Champion, ResourceType, Tile } from "../lib/types";
import { ChampionComponent } from "./Champion";
import { ClaimFlag } from "./ClaimFlag";
import { MonsterCard } from "./MonsterCard";

const getTileColor = (tile: Tile): string => {
  if (!tile.explored) {
    return tile.backColor || "#8B4513"; // Use backColor or brown fallback for unexplored
  }

  // Color based on tile type
  if (tile.tileType === "resource") {
    return "#90EE90"; // Light green for resource tiles
  } else if (tile.tileType === "adventure") {
    // Tier-based colors for adventure tiles
    switch (tile.tier) {
      case 1:
        return "#90EE90"; // Light green for tier 1
      case 2:
        return "#FFB366"; // Light orange for tier 2
      case 3:
        return "#FFB3B3"; // Light red for tier 3
      default:
        return "#DDD";
    }
  } else if (tile.tileType === "doomspire") {
    return "#8B0000"; // Dark red for doomspire
  } else if (tile.tileType === "home") {
    return "#F5F5DC"; // Beige for home tiles
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
    return "";
  }

  // Special locations
  if (tile.tileType) {
    switch (tile.tileType) {
      case "doomspire":
        return ""; // No icon needed, uses background image
      case "adventure":
        return ""; // No symbol needed, uses centered question mark circle
      case "resource":
        return getResourceSymbol(tile);
      case "chapel":
        return "⛪";
      case "trader":
        return "🏪";
      case "mercenary":
        return "⚔️";
      case "home":
        return "🏰"; // Castle symbol for home tiles (fallback)
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

const getResourceSymbols = (tile: Tile): string[] => {
  if (!tile.resources || !tile.explored) return [];

  const resourceSymbols = {
    food: "🌾",
    wood: "🪵",
    ore: "🪨",
    gold: "💰",
  };

  // Get all resources with positive amounts
  const activeResources = Object.entries(tile.resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, _]) => resourceSymbols[type as ResourceType]);

  return activeResources;
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
    case "home":
      return "Home";
    default:
      return "";
  }
};

export const TileComponent = ({
  tile,
  champions,
  debugMode = false,
  getPlayerColor,
}: {
  tile: Tile;
  champions: Champion[];
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

  // Helper function for resource symbol styling - use div with explicit dimensions
  const getResourceSymbolStyle = () => {
    return {
      backgroundColor: "#ffffff",
      border: "1px solid black",
      borderRadius: "4px",
      width: "32px",
      height: "32px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      margin: "1px",
    };
  };

  const specialLabel = getSpecialLocationLabel(effectiveTile);

  // Determine border color - use tile's borderColor only (no fallback)
  const borderColor = effectiveTile.borderColor;

  return (
    <div
      style={{
        width: "120px",
        height: "120px",
        backgroundColor:
          effectiveTile.explored &&
          (effectiveTile.tileType === "chapel" ||
            effectiveTile.tileType === "trader" ||
            effectiveTile.tileType === "mercenary" ||
            effectiveTile.tileType === "doomspire" ||
            effectiveTile.tileType === "adventure" ||
            effectiveTile.tileType === "oasis")
            ? "transparent"
            : getTileColor(effectiveTile),
        backgroundImage: effectiveTile.explored
          ? effectiveTile.tileType === "chapel"
            ? "url(/tiles/chapel.png)"
            : effectiveTile.tileType === "trader"
            ? "url(/tiles/trader.png)"
            : effectiveTile.tileType === "mercenary"
            ? "url(/tiles/mercenary.png)"
            : effectiveTile.tileType === "doomspire"
            ? "url(/tiles/dragon.png)"
            : effectiveTile.tileType === "home"
            ? "url(/tiles/home.png)"
            : effectiveTile.tileType === "adventure"
            ? effectiveTile.tier === 1
              ? "url(/tiles/adventure-tier1.png)"
              : effectiveTile.tier === 2
              ? "url(/tiles/adventure-tier2.png)"
              : effectiveTile.tier === 3
              ? "url(/tiles/adventure-tier3.png)"
              : "none"
            : effectiveTile.tileType === "oasis"
            ? effectiveTile.tier === 1
              ? "url(/tiles/oasis-tier1.png)"
              : effectiveTile.tier === 2
              ? "url(/tiles/oasis-tier2.png)"
              : "none"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.food > 0 &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0) &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/food.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.wood > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/wood.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.gold > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0) &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0)
            ? "url(/tiles/gold.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.ore > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/ore.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.food > 0 &&
              effectiveTile.resources.gold > 0 &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0) &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0)
            ? "url(/tiles/food-gold.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.food > 0 &&
              effectiveTile.resources.ore > 0 &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/food-ore.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.food > 0 &&
              effectiveTile.resources.wood > 0 &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/food-wood.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.gold > 0 &&
              effectiveTile.resources.ore > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.wood ||
                effectiveTile.resources.wood === 0)
            ? "url(/tiles/gold-ore.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.gold > 0 &&
              effectiveTile.resources.wood > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.ore ||
                effectiveTile.resources.ore === 0)
            ? "url(/tiles/gold-wood.png)"
            : effectiveTile.tileType === "resource" &&
              effectiveTile.resources &&
              effectiveTile.resources.ore > 0 &&
              effectiveTile.resources.wood > 0 &&
              (!effectiveTile.resources.food ||
                effectiveTile.resources.food === 0) &&
              (!effectiveTile.resources.gold ||
                effectiveTile.resources.gold === 0)
            ? "url(/tiles/ore-wood.png)"
            : "none"
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "bold",
        color: effectiveTile.explored ? "#000" : "#fff",
        border: `2px solid ${borderColor}`,
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
}${
        effectiveTile.monster && effectiveTile.explored
          ? `\nMonster: ${effectiveTile.monster.name} (Might: ${effectiveTile.monster.might})`
          : ""
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
        {effectiveTile.tileType === "home" && effectiveTile.explored ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "16px",
            }}
          >
            <div style={getResourceSymbolStyle()}>🌾</div>
            <div style={getResourceSymbolStyle()}>🪵</div>
          </div>
        ) : specialLabel &&
          !(effectiveTile.tileType === "home" && !tile.explored) ? (
          <>
            {effectiveTile.tileType !== "chapel" &&
              effectiveTile.tileType !== "trader" &&
              effectiveTile.tileType !== "mercenary" &&
              effectiveTile.tileType !== "doomspire" && (
                <div style={{ fontSize: "24px" }}>
                  {getTileSymbol(effectiveTile)}
                </div>
              )}
            {effectiveTile.tileType !== "chapel" &&
              effectiveTile.tileType !== "trader" &&
              effectiveTile.tileType !== "mercenary" &&
              effectiveTile.tileType !== "doomspire" && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginTop: "2px",
                  }}
                >
                  {specialLabel}
                </div>
              )}
          </>
        ) : effectiveTile.tileType === "resource" && effectiveTile.explored ? (
          <div
            style={{
              display: "flex",
              gap: "2px",
              alignItems: "center",
              fontSize: "16px",
              justifyContent: "center",
            }}
          >
            {effectiveTile.resources &&
              Object.entries(effectiveTile.resources)
                .filter(([_, amount]) => amount > 0)
                .map(([type, amount]) => {
                  const resourceSymbols = {
                    food: "🌾",
                    wood: "🪵",
                    ore: "🪨",
                    gold: "💰",
                  };
                  const symbol = resourceSymbols[type as ResourceType];
                  return Array.from({ length: amount }, (_, index) => (
                    <div
                      key={`${type}-${index}`}
                      style={getResourceSymbolStyle()}
                    >
                      {symbol}
                    </div>
                  ));
                })
                .flat()}
          </div>
        ) : (
          <div style={{ fontSize: "24px" }}>{getTileSymbol(effectiveTile)}</div>
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

      {/* Star indicator for starred tiles */}
      {effectiveTile.isStarred && effectiveTile.explored && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "16px",
          }}
        >
          ⭐
        </div>
      )}

      {/* Adventure tokens as question mark circles */}
      {(effectiveTile.tileType === "adventure" ||
        effectiveTile.tileType === "oasis") &&
        effectiveTile.explored &&
        !!effectiveTile.adventureTokens &&
        effectiveTile.adventureTokens > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "row",
              gap: "4px",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            {Array.from(
              { length: effectiveTile.adventureTokens },
              (_, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                    border: "2px solid rgba(0, 0, 0, 0.3)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    color:
                      effectiveTile.tier === 1
                        ? "#4CAF50" // Green for tier 1
                        : effectiveTile.tier === 2
                        ? "#FF9800" // Orange for tier 2
                        : "#F44336", // Red for tier 3
                  }}
                >
                  ?
                </div>
              )
            )}
          </div>
        )}

      {/* Monster card */}
      {effectiveTile.monster && effectiveTile.explored && (
        <MonsterCard
          monster={effectiveTile.monster}
          size="m"
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 8,
          }}
        />
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
          {championsOnTile.map((champion) => (
            <ChampionComponent
              key={champion.id}
              champion={champion}
              getPlayerColor={getPlayerColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};
