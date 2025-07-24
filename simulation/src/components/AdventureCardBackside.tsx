import {
  getBiomeDisplayName,
  getTierBackgroundColor,
  getTierDisplayText,
  getTierSolidColor,
} from "../lib/uiConstants";

interface AdventureCardBacksideProps {
  monster: {
    tier?: number;
    biome?: string;
  };
  size?: "s" | "m" | "l";
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

export const AdventureCardBackside = ({
  monster,
  size = "m",
  className,
  style,
}: AdventureCardBacksideProps) => {
  const sizeConfig = getSizeConfig(size);
  const tier = monster.tier;
  const biome = monster.biome;
  const backgroundColor = getTierBackgroundColor(tier);

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
            backgroundColor: getTierSolidColor(tier),
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
            {getTierDisplayText(tier)}
          </span>
        </div>
      )}
    </div>
  );
};
