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
    s: { width: 60, height: 70, imageHeight: 48, fontSize: 8 },
    m: { width: 75, height: 85, imageHeight: 60, fontSize: 9 },
    l: { width: 160, height: 190, imageHeight: 140, fontSize: 14 },
  };
  return configs[size];
};

export const MonsterCard = ({
  monster,
  size = "m",
  showStats = false,
  className,
  style,
}: MonsterCardProps) => {
  const sizeConfig = getSizeConfig(size);

  const cardContent = (
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
        justifyContent: "space-between",
        padding: "4px",
        ...style,
      }}
      title={`Monster: ${monster.name} (Might: ${monster.might})`}
    >
      <div
        style={{
          width: `${sizeConfig.width - 12}px`,
          height: `${sizeConfig.imageHeight}px`,
          backgroundImage: `url(/monsters/${monster.name
            .toLowerCase()
            .replace(/\s+/g, "-")}.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />
      <div
        style={{
          fontSize: `${sizeConfig.fontSize}px`,
          fontWeight: "bold",
          color: "#333",
          textAlign: "center",
          lineHeight: "1",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {monster.name}
      </div>
    </div>
  );

  if (showStats) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {cardContent}
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "11px",
            textAlign: "center",
            minWidth: `${sizeConfig.width}px`,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            Tier {"tier" in monster ? monster.tier : "?"} •{" "}
            {"biome" in monster ? monster.biome : "Unknown"}
          </div>
          <div style={{ color: "#666", marginBottom: "4px" }}>
            Might: {monster.might} • Fame: {monster.fame || 0}
          </div>
          <div style={{ color: "#555", marginBottom: "4px" }}>
            Resources:{" "}
            {(monster.resources &&
              Object.entries(monster.resources)
                .filter(([_, amount]) => amount > 0)
                .map(([type, amount]) => `${type}: ${amount}`)
                .join(", ")) ||
              "None"}
          </div>
          {"count" in monster && (
            <div style={{ color: "#777", fontSize: "10px" }}>
              Deck count: {monster.count}
            </div>
          )}
        </div>
      </div>
    );
  }

  return cardContent;
};
