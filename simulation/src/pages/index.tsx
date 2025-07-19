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
        // Mix of terrain types for Tier 1
        const terrainTypes: TileType[] = [
          "plains",
          "mountains",
          "woodlands",
          "water",
        ];
        type = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
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

export default function Home() {
  const [board] = useState<Tile[][]>(createInitialBoard());

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
            <span>💧 Water</span>
            <span>🐉 Dragon's Den</span>
            <span style={{ color: "#8B4513" }}>? Unexplored</span>
          </div>
        </div>

        <div
          style={{
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
            <strong style={{ color: "#4CAF50" }}>Tier 1 (T1)</strong>: Outer
            layer - explored terrain (Plains, Mountains, Woodlands, Water)
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
