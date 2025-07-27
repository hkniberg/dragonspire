import { useEffect, useState } from "react";
import { TRADER_ITEMS } from "../content/traderItems";
import type { Player } from "../lib/types";
import { ResourceDisplay } from "./ResourceDisplay";
import { CardComponent, formatTraderContent } from "./cards/Card";

// Function to get boat image path based on player index
const getBoatImagePath = (playerIndex: number): string => {
  const boatColors = ["red", "blue", "green", "orange"];
  const colorIndex = playerIndex % boatColors.length;
  return `/boats/boat-${boatColors[colorIndex]}.png`;
};

interface ModalItemData {
  itemId: string;
  championId: number;
  itemData: any;
}

interface PlayerInfoBoxProps {
  player: Player;
  playerIndex: number; // Add playerIndex to replace the non-existent player.id
  isCurrentPlayer: boolean;
  claimedTiles: number;
  playerType?: string; // Added to identify if this is a Claude player
  onExtraInstructionsChange?: (playerName: string, instructions: string) => void; // Callback for updating extra instructions
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
}

export const PlayerInfoBox = ({
  player,
  playerIndex,
  isCurrentPlayer,
  claimedTiles,
  playerType,
  onExtraInstructionsChange,
  getPlayerColor,
}: PlayerInfoBoxProps) => {
  const colors = getPlayerColor(player.name);
  const [modalItem, setModalItem] = useState<ModalItemData | null>(null);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalItem) {
        closeModal();
      }
    };

    if (modalItem) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalItem]);

  const handleItemClick = (itemId: string, championId: number) => {
    const itemData = TRADER_ITEMS.find((item) => item.id === itemId);
    if (!itemData) return;

    setModalItem({
      itemId,
      championId,
      itemData,
    });
  };

  const closeModal = () => {
    setModalItem(null);
  };

  const renderItemCard = (itemId: string, championId: number, index: number) => {
    const itemData = TRADER_ITEMS.find((item) => item.id === itemId);
    if (!itemData) return null;

    return (
      <div
        key={`${championId}-${itemId}-${index}`}
        style={{
          height: "140px", // Scaled down height (280px * 0.5)
          width: "100px", // Scaled down width (200px * 0.5)
          overflow: "visible",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            cursor: "pointer",
            transition: "transform 0.2s ease",
            transform: "scale(0.5)",
            transformOrigin: "center",
          }}
          onClick={() => handleItemClick(itemId, championId)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(0.5)";
          }}
          title={`${itemData.name} - Click to view details`}
        >
          <CardComponent
            borderColor="#FFD700"
            name={itemData.name}
            imageUrl={`/traderItems/${itemData.id}.png`}
            content={formatTraderContent(itemData)}
            bottomTag="Item"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          padding: "12px",
          backgroundColor: isCurrentPlayer ? colors.light : "#f8f9fa",
          border: `2px solid ${isCurrentPlayer ? colors.main : "#e9ecef"}`,
          borderRadius: "8px",
          boxShadow: isCurrentPlayer ? `0 0 8px ${colors.main}40` : "none",
        }}
      >
        {/* Player Name and Fame/Might */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 2px 0",
                fontSize: "14px",
                fontWeight: "bold",
                color: isCurrentPlayer ? colors.main : "#2c3e50",
              }}
            >
              {player.name}
              {isCurrentPlayer && " ⭐"}
            </h4>
            <div style={{ fontSize: "11px", color: "#6c757d" }}>
              Fame: {player.fame} | Might: {player.might}
            </div>
          </div>

          {/* Player Type Badge */}
          {playerType && (
            <div
              style={{
                fontSize: "10px",
                backgroundColor: playerType === "claude" ? "#007bff" : "#6c757d",
                color: "white",
                padding: "2px 6px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              {playerType}
            </div>
          )}
        </div>

        {/* Resources */}
        <div style={{ marginBottom: "8px" }}>
          <ResourceDisplay resources={player.resources} />
        </div>

        {/* Champions */}
        <div style={{ marginBottom: "8px" }}>
          {player.champions.map((champion) => (
            <div
              key={champion.id}
              style={{
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span style={{ marginRight: "4px", fontSize: "12px" }}>⚔️</span>
                <span style={{ color: colors.main, fontWeight: "bold", fontSize: "12px" }}>Champion {champion.id}</span>
                <span style={{ marginLeft: "4px", color: "#6c757d", fontSize: "12px" }}>
                  ({champion.position.row},{champion.position.col})
                </span>
              </div>
              {champion.items.length > 0 && (
                <div
                  style={{
                    marginLeft: "20px",
                    display: "flex",
                    flexDirection: "row",
                    gap: "4px",
                    alignItems: "center",
                    overflow: "visible",
                  }}
                >
                  {champion.items.map((itemId, index) => renderItemCard(itemId, champion.id, index))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boats */}
        <div style={{ marginBottom: "8px" }}>
          {player.boats.map((boat) => (
            <div
              key={boat.id}
              style={{
                marginBottom: "2px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={getBoatImagePath(playerIndex)}
                alt={`Boat ${boat.id}`}
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "contain",
                  marginRight: "4px",
                }}
              />
              <span style={{ color: colors.main, fontWeight: "bold", fontSize: "12px" }}>Boat {boat.id}</span>
              <span style={{ marginLeft: "4px", color: "#6c757d", fontSize: "12px" }}>
                {boat.position.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Extra Instructions for Claude Players */}
        {playerType === "claude" && onExtraInstructionsChange && (
          <div style={{ marginTop: "12px", fontSize: "12px" }}>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "6px",
                color: "#495057",
              }}
            >
              Extra Instructions:
            </div>
            <textarea
              defaultValue={player.extraInstructions || ""}
              onBlur={(e) => onExtraInstructionsChange(player.name, e.target.value)}
              placeholder="Enter additional instructions for this AI player..."
              style={{
                width: "100%",
                height: "60px",
                padding: "6px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "11px",
                fontFamily: "Arial, sans-serif",
                resize: "vertical",
                backgroundColor: "#f8f9fa",
              }}
            />
          </div>
        )}
      </div>

      {/* Item modal */}
      {modalItem && (
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
              borderColor="#FFD700"
              name={modalItem.itemData.name}
              imageUrl={`/traderItems/${modalItem.itemData.id}.png`}
              content={formatTraderContent(modalItem.itemData)}
              bottomTag="Item"
              title={`${modalItem.itemData.name} - ${modalItem.itemData.cost} gold`}
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

            {/* Item info */}
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
              Champion {modalItem.championId} - {modalItem.itemData.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
