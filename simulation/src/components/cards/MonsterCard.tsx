import type { Monster } from "../../lib/types";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  getTierBackgroundColor,
} from "../../lib/uiConstants";

interface MonsterCardProps {
  monster: Monster;
  showStats?: boolean;
}

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
}: MonsterCardProps) => {
  const tier = "tier" in monster ? monster.tier : undefined;
  const backgroundColor = getTierBackgroundColor(tier);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
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
          flexShrink: 0,
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
          flexShrink: 0,
        }}
      >
        {monster.name}
      </div>

      {showStats && (
        <div
          style={{
            fontSize: "12px",
            textAlign: "center",
            lineHeight: "1.3",
            width: "100%",
            padding: "4px 2px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: "2px",
          }}
        >
          <div style={{ color: "#666", flexShrink: 0 }}>
            Might: {monster.might}
          </div>
          <div style={{ color: "#666", flexShrink: 0 }}>
            Fame: {monster.fame || 0}
          </div>
          <div style={{ color: "#666", flexShrink: 0 }}>
            Loot: {formatResources(monster.resources)}
          </div>
        </div>
      )}
    </div>
  );
};
