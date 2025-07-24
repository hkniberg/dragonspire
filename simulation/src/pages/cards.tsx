import { useState } from "react";
import { AdventureCardBackside } from "../components/cards/AdventureCardBackside";
import { EncounterCard } from "../components/cards/EncounterCard";
import { EventCard } from "../components/cards/EventCard";
import { MonsterCard } from "../components/cards/MonsterCard";
import { TreasureCard } from "../components/cards/TreasureCard";
import { ENCOUNTERS } from "../content/encounterCards";
import { EVENT_CARDS } from "../content/eventCards";
import { MONSTER_CARDS } from "../content/monsterCards";
import { TREASURE_CARDS } from "../content/treasureCards";

// Union type for all card types
type CardType = "monster" | "event" | "treasure" | "encounter";
type UnifiedCard =
  | { type: "monster"; data: (typeof MONSTER_CARDS)[0]; id: string }
  | { type: "event"; data: (typeof EVENT_CARDS)[0]; id: string }
  | { type: "treasure"; data: (typeof TREASURE_CARDS)[0]; id: string }
  | { type: "encounter"; data: (typeof ENCOUNTERS)[0]; id: string };

export default function CardsPage() {
  const [allFlipped, setAllFlipped] = useState(false);
  const [individualFlips, setIndividualFlips] = useState<
    Record<string, boolean>
  >({});
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | "all">("all");
  const [tierFilter, setTierFilter] = useState<number | "all">("all");

  // Create unified card array
  const allCards: UnifiedCard[] = [
    ...MONSTER_CARDS.map((monster, index) => ({
      type: "monster" as const,
      data: monster,
      id: `monster-${index}`,
    })),
    ...EVENT_CARDS.map((event, index) => ({
      type: "event" as const,
      data: event,
      id: `event-${index}`,
    })),
    ...TREASURE_CARDS.map((treasure, index) => ({
      type: "treasure" as const,
      data: treasure,
      id: `treasure-${index}`,
    })),
    ...ENCOUNTERS.map((encounter, index) => ({
      type: "encounter" as const,
      data: encounter,
      id: `encounter-${index}`,
    })),
  ];

  // Filter cards based on selected filters
  const filteredCards = allCards.filter((card) => {
    const matchesType =
      cardTypeFilter === "all" || card.type === cardTypeFilter;
    const matchesTier = tierFilter === "all" || card.data.tier === tierFilter;
    return matchesType && matchesTier;
  });

  const handleFlipAll = () => {
    setAllFlipped(!allFlipped);
    setIndividualFlips({}); // Reset individual flips when doing global flip
  };

  const handleCardClick = (cardId: string) => {
    setIndividualFlips((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const isCardFlipped = (cardId: string) => {
    // If there's an individual flip state, use that, otherwise use global state
    return individualFlips[cardId] !== undefined
      ? individualFlips[cardId]
      : allFlipped;
  };

  const renderCard = (card: UnifiedCard) => {
    if (isCardFlipped(card.id)) {
      return (
        <AdventureCardBackside
          monster={{
            tier: card.data.tier,
            biome:
              card.type === "monster" ? (card.data as any).biome : undefined,
          }}
        />
      );
    }

    switch (card.type) {
      case "monster":
        return <MonsterCard monster={card.data as any} showStats={true} />;
      case "event":
        return <EventCard event={card.data as any} showDescription={true} />;
      case "treasure":
        return (
          <TreasureCard treasure={card.data as any} showDescription={true} />
        );
      case "encounter":
        return (
          <EncounterCard encounter={card.data as any} showDescription={true} />
        );
      default:
        return null;
    }
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
        Lords of Doomspire - Card Gallery
      </h1>

      {/* Filter Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        {/* Card Type Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>
            Card Type:
          </label>
          <select
            value={cardTypeFilter}
            onChange={(e) =>
              setCardTypeFilter(e.target.value as CardType | "all")
            }
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            <option value="all">All Types</option>
            <option value="monster">Monsters</option>
            <option value="event">Events</option>
            <option value="treasure">Treasures</option>
            <option value="encounter">Encounters</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) =>
              setTierFilter(
                e.target.value === "all" ? "all" : parseInt(e.target.value)
              )
            }
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            <option value="all">All Tiers</option>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
          </select>
        </div>

        {/* Flip All Button */}
        <button
          onClick={handleFlipAll}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
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

      {/* Results Count */}
      <div style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
        Showing {filteredCards.length} of {allCards.length} cards
      </div>

      {/* Cards Grid */}
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
        {filteredCards.map((card) => (
          <div
            key={card.id}
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
            onClick={() => handleCardClick(card.id)}
            title="Click to flip card"
          >
            {renderCard(card)}
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
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Card Statistics</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Type</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>Monsters: {MONSTER_CARDS.length} types</div>
              <div>Events: {EVENT_CARDS.length} types</div>
              <div>Treasures: {TREASURE_CARDS.length} types</div>
              <div>Encounters: {ENCOUNTERS.length} types</div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Tier</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Tier 1: {allCards.filter((c) => c.data.tier === 1).length} types
              </div>
              <div>
                Tier 2: {allCards.filter((c) => c.data.tier === 2).length} types
              </div>
              <div>
                Tier 3: {allCards.filter((c) => c.data.tier === 3).length} types
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>Total Cards</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Total deck: {allCards.reduce((sum, c) => sum + c.data.count, 0)}{" "}
                cards
              </div>
              <div>Unique types: {allCards.length} types</div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>
              Monsters by Biome
            </h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                Plains:{" "}
                {MONSTER_CARDS.filter((m) => m.biome === "plains").length} types
              </div>
              <div>
                Mountains:{" "}
                {MONSTER_CARDS.filter((m) => m.biome === "mountains").length}{" "}
                types
              </div>
              <div>
                Woodlands:{" "}
                {MONSTER_CARDS.filter((m) => m.biome === "woodlands").length}{" "}
                types
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
