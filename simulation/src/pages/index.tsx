import Head from "next/head";
import { useState } from "react";

// Define tile types and tiers
type TileType =
  | "plains"
  | "mountains"
  | "woodlands"
  | "water"
  | "special"
  | "unexplored";
type TileTier = 1 | 2 | 3;

interface Tile {
  type: TileType;
  tier: TileTier;
  explored: boolean;
  special?: string; // For special locations like Dragon's Den, Chapel, etc.
}

interface OceanTile {
  type: "ocean";
  position: "northwest" | "northeast" | "southwest" | "southeast";
  label: string;
}

// Simple seeded random number generator for deterministic results
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Create initial board state
const createInitialBoard = (): Tile[][] => {
  const board: Tile[][] = [];

  for (let row = 0; row < 8; row++) {
    board[row] = [];
    for (let col = 0; col < 8; col++) {
      // Determine tier based on position (distance from center)
      const distanceFromCenter = Math.max(
        Math.abs(row - 3.5),
        Math.abs(col - 3.5)
      );
      let tier: TileTier;
      let type: TileType;

      if (distanceFromCenter >= 2.5) {
        // Tier 1 - outer tiles
        tier = 1;
        // Mix of terrain types for Tier 1 (no water on main board now)
        const terrainTypes: TileType[] = ["plains", "mountains", "woodlands"];
        // Use deterministic seeded random based on position with hardcoded seed
        const seed = 12345 + row * 8 + col;
        const randomValue = seededRandom(seed);
        type = terrainTypes[Math.floor(randomValue * terrainTypes.length)];
      } else if (distanceFromCenter >= 1.5) {
        // Tier 2 - middle tiles
        tier = 2;
        type = "unexplored";
      } else {
        // Tier 3 - center tiles
        tier = 3;
        type = "unexplored";
        // One of the center tiles is the Dragon's Den
        if (row === 3 && col === 3) {
          type = "special";
        }
      }

      board[row][col] = {
        type,
        tier,
        explored: tier === 1, // Tier 1 tiles start revealed
        special: type === "special" ? "Dragon's Den" : undefined,
      };
    }
  }

  return board;
};

// Create ocean tiles
const createOceanTiles = (): OceanTile[] => {
  return [
    { type: "ocean", position: "northwest", label: "A" },
    { type: "ocean", position: "northeast", label: "B" },
    { type: "ocean", position: "southwest", label: "C" },
    { type: "ocean", position: "southeast", label: "D" },
  ];
};

const getTileColor = (tile: Tile): string => {
  if (!tile.explored) {
    return "#8B4513"; // Brown for unexplored
  }

  switch (tile.type) {
    case "plains":
      return "#90EE90"; // Light green
    case "mountains":
      return "#A0A0A0"; // Gray
    case "woodlands":
      return "#228B22"; // Forest green
    case "water":
      return "#4169E1"; // Royal blue
    case "special":
      return "#DC143C"; // Crimson for special locations
    default:
      return "#DDD";
  }
};

const getTileSymbol = (tile: Tile): string => {
  if (!tile.explored) {
    return "?";
  }

  switch (tile.type) {
    case "plains":
      return "🌾";
    case "mountains":
      return "⛰️";
    case "woodlands":
      return "🌲";
    case "water":
      return "💧";
    case "special":
      return "🐉";
    default:
      return "";
  }
};

const OceanTileComponent = ({ oceanTile }: { oceanTile: OceanTile }) => {
  const getOceanStyle = () => {
    const baseStyle = {
      backgroundColor: "#1E90FF", // Deep sky blue
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "bold",
      border: "3px solid #0066CC",
      borderRadius: "8px",
      position: "relative" as const,
    };

    // All corner ocean tiles are larger to extend beyond the island
    return {
      ...baseStyle,
      width: "320px",
      height: "320px",
    };
  };

  const getSeaName = () => {
    switch (oceanTile.position) {
      case "northwest":
        return "Northwest sea";
      case "northeast":
        return "Northeast sea";
      case "southwest":
        return "Southwest sea";
      case "southeast":
        return "Southeast sea";
    }
  };

  return (
    <div style={getOceanStyle()}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>
          {oceanTile.label}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.8 }}>{getSeaName()}</div>
      </div>
    </div>
  );
};

export default function Home() {
  const [board] = useState<Tile[][]>(createInitialBoard());
  const [oceanTiles] = useState<OceanTile[]>(createOceanTiles());

  return (
    <>
      <Head>
        <title>TALIS Board Game Simulator</title>
        <meta name="description" content="TALIS Board Game AI Simulation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0f8ff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "20px",
            color: "#2c3e50",
            fontFamily: "serif",
          }}
        >
          TALIS Board Game Simulator
        </h1>

        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p>
            <strong>Legend:</strong>
          </p>
          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span>🌾 Plains</span>
            <span>⛰️ Mountains</span>
            <span>🌲 Woodlands</span>
            <span>🌊 Ocean</span>
            <span>🐉 Dragon's Den</span>
            <span style={{ color: "#8B4513" }}>? Unexplored</span>
          </div>
        </div>

        {/* Board layout with ocean tiles in 2x2 grid behind island */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Ocean layer - 2x2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 320px)",
              gridTemplateRows: "repeat(2, 320px)",
              gap: "0px",
            }}
          >
            {/* Northwest Ocean */}
            <OceanTileComponent
              oceanTile={
                oceanTiles.find((tile) => tile.position === "northwest")!
              }
            />
            {/* Northeast Ocean */}
            <OceanTileComponent
              oceanTile={
                oceanTiles.find((tile) => tile.position === "northeast")!
              }
            />
            {/* Southwest Ocean */}
            <OceanTileComponent
              oceanTile={
                oceanTiles.find((tile) => tile.position === "southwest")!
              }
            />
            {/* Southeast Ocean */}
            <OceanTileComponent
              oceanTile={
                oceanTiles.find((tile) => tile.position === "southeast")!
              }
            />
          </div>

          {/* Island layer - positioned on top of ocean */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: "2px",
              backgroundColor: "#333",
              padding: "10px",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((tile, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: getTileColor(tile),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: tile.explored ? "#000" : "#fff",
                    border: `2px solid ${
                      tile.tier === 1
                        ? "#4CAF50"
                        : tile.tier === 2
                        ? "#FF9800"
                        : "#F44336"
                    }`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    position: "relative",
                  }}
                  title={`${tile.special || tile.type} (Tier ${
                    tile.tier
                  }) - Position: ${rowIndex + 1}, ${colIndex + 1}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {getTileSymbol(tile)}
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      fontSize: "8px",
                      color:
                        tile.tier === 1
                          ? "#4CAF50"
                          : tile.tier === 2
                          ? "#FF9800"
                          : "#F44336",
                      fontWeight: "bold",
                    }}
                  >
                    T{tile.tier}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          <h3>Board Layout</h3>
          <p>
            <strong style={{ color: "#1E90FF" }}>
              Ocean Tiles (A, B, C, D)
            </strong>
            : Large ocean areas surrounding the main island
          </p>
          <p>
            <strong style={{ color: "#4CAF50" }}>Tier 1 (T1)</strong>: Outer
            layer - explored terrain (Plains, Mountains, Woodlands)
          </p>
          <p>
            <strong style={{ color: "#FF9800" }}>Tier 2 (T2)</strong>: Middle
            layer - unexplored tiles with higher risk/reward
          </p>
          <p>
            <strong style={{ color: "#F44336" }}>Tier 3 (T3)</strong>: Center -
            most dangerous areas including Dragon's Den
          </p>
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            This is a placeholder visualization. Champions, resources, and game
            state will be added in future steps.
          </p>
        </div>
      </div>
    </>
  );
}
