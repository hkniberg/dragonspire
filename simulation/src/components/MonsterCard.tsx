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

export const MonsterCard = ({
  monster,
  size = "m",
  showStats = false,
  className,
  style,
}: MonsterCardProps) => {
  const sizeConfig = getSizeConfig(size);
  const tier = "tier" in monster ? monster.tier : undefined;
  const backgroundColor = getTierBackgroundColor(tier);

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
