import { useEffect, useState } from "react";
import { ENCOUNTERS } from "../content/encounterCards";
import { EVENT_CARDS } from "../content/eventCards";
import { MONSTER_CARDS } from "../content/monsterCards";
import { TREASURE_CARDS } from "../content/treasureCards";
import { GameMaster } from "../engine/GameMaster";
import { TileTier } from "../lib/types";
import {
  CardComponent,
  formatEncounterContent,
  formatEventContent,
  formatMonsterContent,
  formatTreasureContent,
  getBorderColor,
} from "./cards/Card";

interface CardDecksProps {
  gameSession: GameMaster | null;
}

interface ModalCardData {
  tier: TileTier;
  deckNumber: 1 | 2 | 3;
  cardData: any;
  originalData: any;
  imageUrl: string;
  content: string;
  bottomTag?: string;
  deckSize: number;
}

export const CardDecks = ({ gameSession }: CardDecksProps) => {
  const [modalCard, setModalCard] = useState<ModalCardData | null>(null);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalCard) {
        closeModal();
      }
    };

    if (modalCard) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalCard]);

  if (!gameSession) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
          padding: "20px",
        }}
      >
        Start a game to see the card decks
      </div>
    );
  }

  const handleCardClick = (tier: TileTier, deckNumber: 1 | 2 | 3) => {
    const gameDecks = gameSession.getGameDecks();
    const topCard = gameDecks.peekTopCard(tier, deckNumber);
    const deckSizes = gameDecks.getDeckSizes(tier);
    const deckSize = deckSizes[deckNumber - 1];

    if (!topCard) return;

    // Find the original card data
    let originalData;
    let imageUrl = "";
    let content = "";
    let bottomTag;

    switch (topCard.type) {
      case "monster":
        originalData = MONSTER_CARDS.find((m) => m.id === topCard.id);
        if (originalData) {
          imageUrl = `/monsters/${originalData.id}.png`;
          content = formatMonsterContent(originalData);
        }
        break;
      case "event":
        originalData = EVENT_CARDS.find((e) => e.id === topCard.id);
        if (originalData) {
          imageUrl = `/events/${originalData.id}.png`;
          content = formatEventContent(originalData);
        }
        break;
      case "treasure":
        originalData = TREASURE_CARDS.find((t) => t.id === topCard.id);
        if (originalData) {
          imageUrl = `/treasures/${originalData.id}.png`;
          content = formatTreasureContent(originalData);
          bottomTag = "Item";
        }
        break;
      case "encounter":
        originalData = ENCOUNTERS.find((e) => e.id === topCard.id);
        if (originalData) {
          imageUrl = `/encounters/${originalData.id}.png`;
          content = formatEncounterContent(originalData);
          bottomTag = originalData.follower ? "Follower" : undefined;
        }
        break;
    }

    setModalCard({
      tier,
      deckNumber,
      cardData: topCard,
      originalData,
      imageUrl,
      content,
      bottomTag,
      deckSize,
    });
  };

  const closeModal = () => {
    setModalCard(null);
  };

  const renderCard = (tier: TileTier, deckNumber: 1 | 2 | 3) => {
    const cardKey = `tier-${tier}-deck-${deckNumber}`;
    const gameDecks = gameSession.getGameDecks();
    const topCard = gameDecks.peekTopCard(tier, deckNumber);
    const biomes = gameDecks.getTopCardBiomes(tier);
    const deckSizes = gameDecks.getDeckSizes(tier);
    const deckSize = deckSizes[deckNumber - 1];
    const biome = biomes[deckNumber - 1];

    // Always show card back
    return (
      <div
        key={cardKey}
        style={{
          position: "relative",
          cursor: topCard ? "pointer" : "default",
          transition: "transform 0.2s ease",
        }}
        onClick={topCard ? () => handleCardClick(tier, deckNumber) : undefined}
        onMouseEnter={(e) => {
          if (topCard) e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          if (topCard) e.currentTarget.style.transform = "scale(1)";
        }}
        title={topCard ? `Click to view the top card (${deckSize} cards remaining)` : "Empty deck"}
      >
        <CardComponent
          showBackside={true}
          tier={tier}
          backsideImageUrl={`/cardBacksides/${biome}.png`}
          borderColor="#666666"
          title={`Deck ${deckNumber} - ${deckSize} cards remaining`}
        />
        {/* Deck counter */}
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            right: "4px",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            color: "white",
            fontSize: "20px",
            padding: "6px 12px",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
        >
          {deckSize}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "140px", // Scaled down height (280px * 0.5)
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            transform: "scale(0.5)",
            transformOrigin: "center",
          }}
        >
          {[1, 2, 3].map((tier) => {
            const gameDecks = gameSession.getGameDecks();
            const deckSizes = gameDecks.getDeckSizes(tier as TileTier);

            return (
              <div
                key={tier}
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {[1, 2, 3].map((deckNumber) => {
                  const deckSize = deckSizes[deckNumber - 1];
                  // Only render deck if it has cards
                  if (deckSize === 0) return null;

                  return <div key={deckNumber}>{renderCard(tier as TileTier, deckNumber as 1 | 2 | 3)}</div>;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modalCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardComponent
              tier={modalCard.tier}
              borderColor={getBorderColor(modalCard.cardData.type)}
              name={modalCard.originalData?.name || modalCard.cardData.id}
              imageUrl={modalCard.imageUrl}
              content={modalCard.content}
              contentFontSize={modalCard.cardData.type === "monster" ? "14px" : undefined}
              bottomTag={modalCard.bottomTag}
              title={`${modalCard.cardData.type}: ${modalCard.originalData?.name || modalCard.cardData.id} (Tier ${modalCard.tier})`}
            />

            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close"
            >
              ×
            </button>

            {/* Deck info */}
            <div
              style={{
                position: "absolute",
                bottom: "-40px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              Tier {modalCard.tier} - Deck {modalCard.deckNumber} - {modalCard.deckSize} cards remaining
            </div>
          </div>
        </div>
      )}
    </>
  );
};
