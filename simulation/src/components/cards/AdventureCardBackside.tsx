import {
  getBiomeDisplayName,
  getTierBackgroundColor,
  getTierDisplayText,
  getTierSolidColor,
} from "../../lib/uiConstants";

interface AdventureCardBacksideProps {
  monster: {
    tier?: number;
    biome?: string;
  };
}

export const AdventureCardBackside = ({
  monster,
}: AdventureCardBacksideProps) => {
  const tier = monster.tier;
  const biome = monster.biome;
  const backgroundColor = getTierBackgroundColor(tier);

  return (
    <div
      style={{
        width: "160px",
        height: "190px",
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
          fontSize: "20px",
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
            width: "40px",
            height: "40px",
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
              fontSize: "18px",
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
