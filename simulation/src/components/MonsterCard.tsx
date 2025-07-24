import type { Monster } from "../lib/types";

interface MonsterCardProps {
  monster: Monster;
  showStats?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

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
  showStats = false,
  className,
  style,
}: MonsterCardProps) => {
  const tier = "tier" in monster ? monster.tier : undefined;
  const backgroundColor = getTierBackgroundColor(tier);

  return (
    <div
      className={className}
      style={{
        width: "160px",
        height: "190px",
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
          width: "152px",
          height: `${showStats ? "100px" : "155px"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <img
          src={`/monsters/${monster.id}.png`}
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
          fontSize: "17px",
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
            fontSize: "15px",
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
