import React from "react";
import { createPortal } from "react-dom";
import { getTraderItemById } from "../content/traderItems";
import { Monster } from "../lib/types";
import { getTierSolidColor } from "../lib/uiConstants";
import { CardComponent, formatMonsterContent } from "./cards/Card";

interface TileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster?: Monster;
  items?: string[];
  tileTier?: number;
  tilePosition?: { row: number; col: number };
}

export const TileCardModal: React.FC<TileCardModalProps> = ({
  isOpen,
  onClose,
  monster,
  items = [],
  tileTier = 1,
  tilePosition,
}) => {
  if (!isOpen) return null;

  const hasContent = monster || items.length > 0;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>

        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
          Cards on Tile {tilePosition ? `(${tilePosition.row + 1}, ${tilePosition.col + 1})` : ""}
        </h2>

        {!hasContent && <p style={{ color: "#666", textAlign: "center", margin: "40px 0" }}>No cards on this tile</p>}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          {/* Show monster card */}
          {monster && (
            <div>
              <h3 style={{ textAlign: "center", marginBottom: "8px", color: "#555" }}>Monster</h3>
              <CardComponent
                tier={monster.tier || tileTier}
                borderColor={getTierSolidColor(tileTier)}
                name={monster.name}
                imageUrl={`/monsters/${monster.id}.png`}
                compactMode={false}
                title={`Monster: ${monster.name} (Might: ${monster.might})`}
                content={formatMonsterContent(monster)}
                contentFontSize="14px"
              />
            </div>
          )}

          {/* Show item cards */}
          {items.map((itemId) => {
            const traderItem = getTraderItemById(itemId);
            if (!traderItem) return null;

            return (
              <div key={itemId}>
                <h3 style={{ textAlign: "center", marginBottom: "8px", color: "#555" }}>Item</h3>
                <CardComponent
                  tier={1} // Items are generally tier 1
                  borderColor={getTierSolidColor(1)}
                  name={traderItem.name}
                  imageUrl={`/traderItems/${traderItem.id}.png`}
                  compactMode={false}
                  title={`Item: ${traderItem.name} (Cost: ${traderItem.cost} gold)`}
                  content={traderItem.description}
                  contentFontSize="14px"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal outside the current DOM hierarchy
  return createPortal(modalContent, document.body);
};
