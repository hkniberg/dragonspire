import Head from "next/head";
import React from "react";

type SpecialTileInfo = {
  title: string;
  effect: string;
  note?: string;
  position: React.CSSProperties;
  backgroundColor?: string;
};

export default function SpecialTileLabels() {
  const specialTileInfo: Record<string, SpecialTileInfo> = {
    trader: {
      title: "TRADER",
      effect: "Trade resources 2:1 (any to any) • Buy items for Gold",
      note: "Non-combat zone",
      position: { top: "20%", left: "50%", transform: "translateX(-50%)" },
      backgroundColor: "rgba(255, 215, 0, 0.9)",
    },
    mercenary: {
      title: "MERCENARY CAMP",
      effect: "Pay 3 Gold → 1 Might",
      note: "Once per turn • Non-combat zone",
      position: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      backgroundColor: "rgba(220, 20, 60, 0.9)",
    },
    temple: {
      title: "TEMPLE",
      effect: "Sacrifice 2 Fame → 1 Might",
      note: "Once per turn • Non-combat zone",
      position: { top: "80%", left: "50%", transform: "translateX(-50%)" },
      backgroundColor: "rgba(138, 43, 226, 0.9)",
    },
  };

  const renderSpecialTile = (tile: SpecialTileInfo, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        ...tile.position,
        backgroundColor: tile.backgroundColor || "rgba(255, 255, 255, 0.9)",
        border: "3px solid #2c1810",
        borderRadius: "12px",
        padding: "16px 20px",
        fontSize: "14px",
        fontFamily: "Georgia, serif",
        color: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        textAlign: "center",
        minWidth: "200px",
        maxWidth: "250px",
        textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "18px",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {tile.title}
      </div>
      <div
        style={{
          fontSize: "13px",
          marginBottom: tile.note ? "6px" : "0",
          lineHeight: "1.4",
          fontWeight: "500",
        }}
      >
        {tile.effect}
      </div>
      {tile.note && (
        <div
          style={{
            fontSize: "11px",
            fontStyle: "italic",
            opacity: 0.9,
            marginTop: "4px",
          }}
        >
          {tile.note}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Lords of Doomspire - Special Tile Labels</title>
        <meta name="description" content="Printable labels for special tiles in Lords of Doomspire" />
      </Head>

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          padding: "2rem",
        }}
      >
        {/* Container for labels */}
        <div
          style={{
            position: "relative",
            width: "8.5in",
            height: "11in",
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: "1px solid #ddd",
          }}
        >
          {/* Title */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "24px",
              fontFamily: "Georgia, serif",
              fontWeight: "bold",
              color: "#2c1810",
              textAlign: "center",
            }}
          >
            SPECIAL TILE LABELS
          </div>

          {/* Subtitle */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "14px",
              fontFamily: "Georgia, serif",
              color: "#666",
              textAlign: "center",
            }}
          >
            Cut out and paste on special tiles
          </div>

          {/* Special Tile Labels */}
          {renderSpecialTile(specialTileInfo.trader, "trader")}
          {renderSpecialTile(specialTileInfo.mercenary, "mercenary")}
          {renderSpecialTile(specialTileInfo.temple, "temple")}

          {/* Cut lines indicators */}
          <div
            style={{
              position: "absolute",
              bottom: "5%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "12px",
              fontFamily: "Georgia, serif",
              color: "#999",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Cut along label borders
          </div>
        </div>
      </div>
    </>
  );
}
