import Head from "next/head";
import React from "react";

type SpecialTileInfo = {
  title: string;
  effect: string;
  position: React.CSSProperties;
};

export default function SpecialTileLabels() {
  const specialTileInfo: Record<string, SpecialTileInfo> = {
    trader: {
      title: "TRADER",
      effect: "Trade resources 2:1\nBuy items for Gold",
      position: {},
    },
    mercenary: {
      title: "MERCENARY CAMP",
      effect: "Pay 3 Gold → 1 Might",
      position: {},
    },
    temple: {
      title: "TEMPLE",
      effect: "Sacrifice 2 Fame → 1 Might",
      position: {},
    },
  };

  const renderSpecialTile = (tile: SpecialTileInfo, key: string) => (
    <div
      key={key}
      style={{
        backgroundColor: "white",
        border: "4px solid #654321",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "11px",
        fontFamily: "Georgia, serif",
        color: "#2c1810",
        textAlign: "center",
        minWidth: "120px",
        maxWidth: "160px",
        flex: "1",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "12px",
          marginBottom: "4px",
          color: "#654321",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {tile.title}
      </div>
      <div
        style={{
          fontSize: "10px",
          marginBottom: "0",
          color: "#2c1810",
          whiteSpace: "pre-line",
        }}
      >
        {tile.effect}
      </div>
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
          minHeight: "100vh",
          backgroundColor: "white",
          padding: "2rem",
        }}
      >
        {/* Special Tile Labels */}
        <div
          style={{
            display: "flex",
            gap: "0",
            width: "fit-content",
          }}
        >
          {renderSpecialTile(specialTileInfo.trader, "trader")}
          {renderSpecialTile(specialTileInfo.mercenary, "mercenary")}
          {renderSpecialTile(specialTileInfo.temple, "temple")}
        </div>
      </div>
    </>
  );
}
