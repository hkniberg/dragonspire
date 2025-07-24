import type { Monster } from "../lib/content/monsterCards";

interface MonsterCardProps {
  monster:
    | Monster
    | {
        name: string;
        might: number;
        fame?: number;
        resources?: Record<string, number>;
      };
  size?: "s" | "m" | "l";
  showStats?: boolean;
  backside?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const getSizeConfig = (size: "s" | "m" | "l" = "m") => {
  const configs = {
    s: { width: 60, height: 70, imageHeight: 52, fontSize: 8 },
    m: { width: 75, height: 85, imageHeight: 68, fontSize: 9 },
    l: { width: 160, height: 190, imageHeight: 155, fontSize: 16 },
  };
  return configs[size];
};

const getTierBackgroundColor = (tier: number | undefined) => {
  switch (tier) {
    case 1:
      return "#E8F5E8"; // Light green
    case 2:
      return "#FFF3CD"; // Light yellow
    case 3:
      return "#F8D7DA"; // Light red
    default:
      return "white"; // Default white
  }
};

const formatResources = (
  resources: Record<string, number> | undefined
): string => {
  if (!resources) return "None";

  const resourceSymbols = {
    food: "🌾",
    wood: "🪵",
    ore: "🪨",
    gold: "💰",
  };

  const formatted = Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => {
      const symbol = resourceSymbols[type as keyof typeof resourceSymbols];
      return amount > 1 ? `${amount}${symbol}` : symbol;
    })
    .join(" ");

  return formatted || "None";
};

const getBiomeDisplayName = (biome: string): string => {
  switch (biome) {
    case "plains":
      return "Plains";
    case "mountains":
      return "Mountains";
    case "woodlands":
      return "Woodlands";
    default:
      return biome;
  }
};

export const MonsterCard = ({
  monster,
  size = "m",
  showStats = false,
  backside = false,
  className,
  style,
}: MonsterCardProps) => {
  const sizeConfig = getSizeConfig(size);
  const tier = "tier" in monster ? monster.tier : undefined;
  const biome = "biome" in monster ? monster.biome : undefined;
  const backgroundColor = getTierBackgroundColor(tier);

  // If showing backside, render simplified back view
  if (backside) {
    return (
      <div
        className={className}
        style={{
          width: `${sizeConfig.width}px`,
          height: `${sizeConfig.height}px`,
          backgroundImage: biome ? `url(/biomes/${biome}.png)` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: biome ? "transparent" : backgroundColor,
          borderRadius: "6px",
          border: "2px solid #8B0000",
          boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          position: "relative",
          ...style,
        }}
        title={`Monster Card Back - ${
          biome ? getBiomeDisplayName(biome) : "Unknown"
        } (Tier ${tier || "?"})`}
      >
        {/* Semi-transparent overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            borderRadius: "4px",
          }}
        />
        <div
          style={{
            fontSize: `${sizeConfig.fontSize + 4}px`,
            fontWeight: "bold",
            color: "#333",
            textAlign: "center",
            lineHeight: "1.2",
            textTransform: "uppercase",
            letterSpacing: "1px",
            position: "relative",
            zIndex: 1,
            textShadow: "1px 1px 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          ADVENTURE
        </div>
        {tier && (
          <div
            style={{
              width: `${sizeConfig.fontSize * 2.5}px`,
              height: `${sizeConfig.fontSize * 2.5}px`,
              borderRadius: "50%",
              backgroundColor:
                tier === 1 ? "#4CAF50" : tier === 2 ? "#FF9800" : "#F44336",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
              position: "relative",
              zIndex: 1,
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontSize: `${sizeConfig.fontSize + 2}px`,
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              {tier === 1 ? "I" : tier === 2 ? "II" : "III"}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${sizeConfig.width}px`,
        height: `${sizeConfig.height}px`,
        backgroundColor: "white",
        borderRadius: "6px",
        border: "2px solid #8B0000",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px",
        gap: "0px",
        ...style,
      }}
      title={`Monster: ${monster.name} (Might: ${monster.might})`}
    >
      <div
        style={{
          width: `${sizeConfig.width - 8}px`,
          height: `${
            showStats ? sizeConfig.imageHeight * 0.65 : sizeConfig.imageHeight
          }px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <img
          src={`/monsters/${monster.name
            .toLowerCase()
            .replace(/\s+/g, "-")}.png`}
          alt={monster.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
      </div>

      <div
        style={{
          fontSize: `${sizeConfig.fontSize + 1}px`,
          fontWeight: "bold",
          color: "#333",
          textAlign: "center",
          lineHeight: "1",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
          backgroundColor,
          borderRadius: "4px",
          padding: "2px 4px",
        }}
      >
        {monster.name}
      </div>

      {showStats && (
        <div
          style={{
            fontSize: `${sizeConfig.fontSize - 1}px`,
            textAlign: "center",
            lineHeight: "1.1",
            width: "100%",
            padding: "2px",
          }}
        >
          <div style={{ color: "#666", marginBottom: "1px" }}>
            Might: {monster.might}
          </div>
          <div style={{ color: "#666", marginBottom: "1px" }}>
            Fame: {monster.fame || 0}
          </div>
          <div style={{ color: "#666", marginBottom: "1px" }}>
            Loot: {formatResources(monster.resources)}
          </div>
        </div>
      )}
    </div>
  );
};
