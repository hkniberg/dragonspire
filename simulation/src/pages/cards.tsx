import { useState } from "react";
import {
  CardComponent,
  formatEncounterContent,
  formatEventContent,
  formatMonsterContent,
  formatTraderContent,
  formatTreasureContent,
  getBorderColor,
} from "../components/cards/Card";
import { ENCOUNTERS } from "../content/encounterCards";
import { EVENT_CARDS } from "../content/eventCards";
import { MONSTER_CARDS } from "../content/monsterCards";
import { TRADER_ITEMS } from "../content/traderItems";
import { TREASURE_CARDS } from "../content/treasureCards";
import { ALL_CARDS, ALL_TRADER_CARDS, Card, CardType } from "../lib/cards";

// Extended card type that includes trader cards and the original card data for rendering
type ExtendedCardType = CardType | "trader";
type ExtendedCard = (
  | Card
  | {
      type: "trader";
      tier: number;
      theme: "trader";
      id: string;
    }
) & {
  originalData: any;
};

export default function CardsPage() {
  const [allFlipped, setAllFlipped] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [individualFlips, setIndividualFlips] = useState<Record<string, boolean>>({});
  const [cardTypeFilter, setCardTypeFilter] = useState<ExtendedCardType | "all">("all");
  const [tierFilter, setTierFilter] = useState<number | "all">("all");
  const [themeFilter, setThemeFilter] = useState<string | "all">("all");

  // Create extended card array by looking up original data
  const allCards: ExtendedCard[] = [
    // Regular cards from ALL_CARDS array (includes disabled cards)
    ...ALL_CARDS.map((card, index) => {
      let originalData;

      switch (card.type) {
        case "monster":
          originalData = MONSTER_CARDS.find((m) => m.id === card.id);
          break;
        case "event":
          originalData = EVENT_CARDS.find((e) => e.id === card.id);
          break;
        case "treasure":
          originalData = TREASURE_CARDS.find((t) => t.id === card.id);
          break;
        case "encounter":
          originalData = ENCOUNTERS.find((e) => e.id === card.id);
          break;
        default:
          originalData = null;
      }

      return {
        ...card,
        originalData,
        id: `${card.type}-${index}`,
      };
    }),
    // Add trader cards from ALL_TRADER_CARDS array (includes disabled cards)
    ...ALL_TRADER_CARDS.map((card, index) => {
      const originalData = TRADER_ITEMS.find((t) => t.id === card.id);
      return {
        ...card,
        tier: 1, // Traders are always tier 1
        theme: "trader" as const, // Special theme for traders
        originalData,
        id: `${card.type}-${index}`,
      };
    }),
  ];

  // Apply hide duplicates filter first, then other filters
  let cardsToShow = allCards;
  if (hideDuplicates) {
    const seenCards = new Set<string>();
    cardsToShow = allCards.filter((card) => {
      // Use the original card ID for duplicate detection, not the synthetic React key ID
      const key = `${card.type}-${card.originalData?.id || "unknown"}`;
      if (seenCards.has(key)) {
        return false;
      }
      seenCards.add(key);
      return true;
    });
  }

  // Filter cards based on selected filters
  const filteredCards = cardsToShow.filter((card) => {
    const matchesType = cardTypeFilter === "all" || card.type === cardTypeFilter;
    const matchesTier = tierFilter === "all" || card.tier === tierFilter;
    const matchesTheme = themeFilter === "all" || card.theme === themeFilter;
    return matchesType && matchesTier && matchesTheme;
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
    return individualFlips[cardId] !== undefined ? individualFlips[cardId] : allFlipped;
  };

  const renderCard = (card: ExtendedCard) => {
    if (!card.originalData) {
      return null; // Skip cards without original data
    }

    const commonProps = {
      tier: card.tier,
      borderColor: getBorderColor(card.type),
      name: card.originalData.name,
      compactMode,
      disabled: card.originalData.disabled,
      title: `${card.type.charAt(0).toUpperCase() + card.type.slice(1)}: ${
        card.originalData.name
      } (Tier ${card.tier}, ${card.theme})${card.originalData.disabled ? " [DISABLED]" : ""}`,
    };

    if (isCardFlipped(card.id)) {
      return (
        <CardComponent
          {...commonProps}
          showBackside={true}
          backsideImageUrl={`/cardBacksides/${card.type === "trader" ? "trader" : card.theme}.png`}
          backsideLabel={card.type === "trader" ? "TRADER" : "ADVENTURE"}
          showTier={card.type !== "trader"}
          disabled={card.originalData.disabled}
        />
      );
    }

    switch (card.type) {
      case "monster":
        return (
          <CardComponent
            {...commonProps}
            imageUrl={`/monsters/${card.originalData.id}.png`}
            content={formatMonsterContent(card.originalData)}
            contentFontSize="14px"
          />
        );
      case "event":
        return (
          <CardComponent
            {...commonProps}
            imageUrl={`/events/${card.originalData.id}.png`}
            content={formatEventContent(card.originalData)}
          />
        );
      case "treasure":
        return (
          <CardComponent
            {...commonProps}
            imageUrl={`/treasures/${card.originalData.id}.png`}
            content={formatTreasureContent(card.originalData)}
            bottomTag="Item"
          />
        );
      case "encounter":
        return (
          <CardComponent
            {...commonProps}
            imageUrl={`/encounters/${card.originalData.id}.png`}
            content={formatEncounterContent(card.originalData)}
            bottomTag={card.originalData.follower ? "Follower" : undefined}
          />
        );
      case "trader":
        return (
          <CardComponent
            {...commonProps}
            imageUrl={`/traderItems/${card.originalData.id}.png`}
            content={formatTraderContent(card.originalData)}
            contentFontSize="10px"
            bottomTag="Item"
          />
        );
      default:
        return null;
    }
  };

  // Get unique themes from the deck
  const uniqueThemes = Array.from(new Set(allCards.map((card) => card.theme))).sort();

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
        Lords of Doomspire - Complete Deck
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
          <label style={{ fontWeight: "bold", color: "#333" }}>Card Type:</label>
          <select
            value={cardTypeFilter}
            onChange={(e) => setCardTypeFilter(e.target.value as ExtendedCardType | "all")}
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
            <option value="trader">Traders</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
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

        {/* Theme Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontWeight: "bold", color: "#333" }}>Theme:</label>
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            <option value="all">All Themes</option>
            {uniqueThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Hide Duplicates Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="hideDuplicates"
            checked={hideDuplicates}
            onChange={(e) => setHideDuplicates(e.target.checked)}
            style={{
              width: "20px",
              height: "20px",
              accentColor: "#007bff",
            }}
          />
          <label htmlFor="hideDuplicates" style={{ fontSize: "14px", color: "#333", cursor: "pointer" }}>
            Hide Duplicates
          </label>
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
            e.currentTarget.style.backgroundColor = allFlipped ? "#c82333" : "#0056b3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = allFlipped ? "#dc3545" : "#007bff";
          }}
        >
          {allFlipped ? "Show Fronts" : "Show Backs"}
        </button>

        {/* Compact Mode Toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "bold",
            backgroundColor: compactMode ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = compactMode ? "#218838" : "#5a6268";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = compactMode ? "#28a745" : "#6c757d";
          }}
        >
          {compactMode ? "Full Cards" : "Compact Mode"}
        </button>
      </div>

      {/* Results Count */}
      <div style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
        Showing {filteredCards.length} of {cardsToShow.length} cards
        {hideDuplicates && (
          <span style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
            ({allCards.length - cardsToShow.length} duplicates hidden)
          </span>
        )}
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
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Complete Deck Statistics</h2>
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
              <div>
                Monsters: {allCards.filter((c) => c.type === "monster").length} cards (
                {allCards.filter((c) => c.type === "monster" && !c.originalData.disabled).length} enabled,{" "}
                {allCards.filter((c) => c.type === "monster" && c.originalData.disabled).length} disabled)
              </div>
              <div>
                Events: {allCards.filter((c) => c.type === "event").length} cards (
                {allCards.filter((c) => c.type === "event" && !c.originalData.disabled).length} enabled,{" "}
                {allCards.filter((c) => c.type === "event" && c.originalData.disabled).length} disabled)
              </div>
              <div>
                Treasures: {allCards.filter((c) => c.type === "treasure").length} cards (
                {allCards.filter((c) => c.type === "treasure" && !c.originalData.disabled).length} enabled,{" "}
                {allCards.filter((c) => c.type === "treasure" && c.originalData.disabled).length} disabled)
              </div>
              <div>
                Encounters: {allCards.filter((c) => c.type === "encounter").length} cards (
                {allCards.filter((c) => c.type === "encounter" && !c.originalData.disabled).length} enabled,{" "}
                {allCards.filter((c) => c.type === "encounter" && c.originalData.disabled).length} disabled)
              </div>
              <div>
                Traders: {allCards.filter((c) => c.type === "trader").length} cards (
                {allCards.filter((c) => c.type === "trader" && !c.originalData.disabled).length} enabled,{" "}
                {allCards.filter((c) => c.type === "trader" && c.originalData.disabled).length} disabled)
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Tier</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>Tier 1: {allCards.filter((c) => c.tier === 1).length} cards</div>
              <div>Tier 2: {allCards.filter((c) => c.tier === 2).length} cards</div>
              <div>Tier 3: {allCards.filter((c) => c.tier === 3).length} cards</div>
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>By Theme</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              {uniqueThemes.map((theme) => (
                <div key={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}: {allCards.filter((c) => c.theme === theme).length}{" "}
                  cards
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ color: "#555", fontSize: "16px" }}>Deck Summary</h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>Total cards: {allCards.length}</div>
              <div>Enabled cards: {allCards.filter((c) => !c.originalData.disabled).length}</div>
              <div>Disabled cards: {allCards.filter((c) => c.originalData.disabled).length}</div>
              <div>Unique cards: {new Set(allCards.map((c) => c.id)).size}</div>
              {hideDuplicates && (
                <div
                  style={{
                    fontSize: "12px",
                    fontStyle: "italic",
                    marginTop: "4px",
                  }}
                >
                  Currently showing unique cards only
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
