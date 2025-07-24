import { useState } from "react";
import { AdventureCardBackside } from "../components/AdventureCardBackside";
import { MonsterCard } from "../components/MonsterCard";
import { MONSTERS } from "../content/monsterCards";

export default function MonstersPage() {
  const [allFlipped, setAllFlipped] = useState(false);
  const [individualFlips, setIndividualFlips] = useState<
    Record<number, boolean>
  >({});

  const handleFlipAll = () => {
    setAllFlipped(!allFlipped);
    setIndividualFlips({}); // Reset individual flips when doing global flip
  };

  const handleCardClick = (index: number) => {
    setIndividualFlips((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isCardFlipped = (index: number) => {
    // If there's an individual flip state, use that, otherwise use global state
    return individualFlips[index] !== undefined
      ? individualFlips[index]
      : allFlipped;
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#333",
          fontSize: "2.5rem",
          fontWeight: "bold",
        }}
      >
        Lords of Doomspire - Bestiary
      </h1>

      {/* Flip All Button */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <button
          onClick={handleFlipAll}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: allFlipped ? "#dc3545" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = allFlipped
              ? "#c82333"
              : "#0056b3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = allFlipped
              ? "#dc3545"
              : "#007bff";
          }}
        >
          {allFlipped ? "Show Fronts" : "Show Backs"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "30px",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          justifyItems: "center",
        }}
      >
        {MONSTERS.map((monster, index) => (
          <div
            key={`${monster.name}-${index}`}
            style={{
              transition: "transform 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => handleCardClick(index)}
            title="Click to flip card"
          >
            {isCardFlipped(index) ? (
              <AdventureCardBackside monster={monster} size="l" />
            ) : (
              <MonsterCard monster={monster} size="l" showStats={true} />
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "40px auto 0",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>
          Monster Statistics
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Tier</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Tier 1: {MONSTERS.filter((m) => m.tier === 1).length} types
              </div>
              <div>
                Tier 2: {MONSTERS.filter((m) => m.tier === 2).length} types
              </div>
              <div>
                Tier 3: {MONSTERS.filter((m) => m.tier === 3).length} types
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Biome</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Plains: {MONSTERS.filter((m) => m.biome === "plains").length}{" "}
                types
              </div>
              <div>
                Mountains:{" "}
                {MONSTERS.filter((m) => m.biome === "mountains").length} types
              </div>
              <div>
                Woodlands:{" "}
                {MONSTERS.filter((m) => m.biome === "woodlands").length} types
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>Total Cards</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Total deck: {MONSTERS.reduce((sum, m) => sum + m.count, 0)}{" "}
                cards
              </div>
              <div>Unique monsters: {MONSTERS.length} types</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
