import { useEffect, useState } from "react";
import type { GameState } from "../game/GameState";
import type { CarriableItem, Champion, Player, Tile } from "../lib/types";
import { ResourceDisplay } from "./ResourceDisplay";
import { CardComponent, formatTraderContent } from "./cards/Card";

// Function to get boat image path based on player index
const getBoatImagePath = (playerIndex: number): string => {
  const boatColors = ["red", "blue", "green", "orange"];
  const colorIndex = playerIndex % boatColors.length;
  return `/boats/boat-${boatColors[colorIndex]}.png`;
};

interface ModalItemData {
  item: CarriableItem;
  championId: number;
}

interface PlayerInfoBoxProps {
  player: Player;
  playerIndex: number; // Add playerIndex to replace the non-existent player.id
  isCurrentPlayer: boolean;
  claimedTiles: number;
  playerType?: string; // Added to identify if this is a Claude player
  onExtraInstructionsChange?: (playerName: string, instructions: string) => void; // Callback for updating extra instructions
  gameState: GameState; // Add gameState to access board and champions for blockade detection
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
  gameState,
  getPlayerColor,
}: PlayerInfoBoxProps) => {
  const colors = getPlayerColor(player.name);
  const [modalItem, setModalItem] = useState<ModalItemData | null>(null);

  // Helper function to get champions on a specific tile
  const getChampionsOnTile = (position: { row: number; col: number }): Champion[] => {
    const champions: Champion[] = [];
    for (const gamePlayer of gameState.players) {
      for (const champion of gamePlayer.champions) {
        if (champion.position.row === position.row && champion.position.col === position.col) {
          champions.push(champion);
        }
      }
    }
    return champions;
  };

  // Helper function to check if a tile is blockaded
  const isBlockaded = (tile: Tile): boolean => {
    const blockadingChampions = getChampionsOnTile(tile.position).filter(
      (champ) => champ.playerName !== tile.claimedBy,
    );
    return blockadingChampions.length > 0;
  };

  // Get claimed tiles for this player
  const playerClaimedTiles = gameState.board.getAllTiles().filter((tile) => tile.claimedBy === player.name);

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

  const handleItemClick = (item: CarriableItem, championId: number) => {
    setModalItem({
      item,
      championId,
    });
  };

  const closeModal = () => {
    setModalItem(null);
  };

  const renderItemCard = (item: CarriableItem, championId: number, index: number) => {
    // Determine item properties based on whether it's a treasure or trader item
    let name: string;
    let imageUrl: string;
    let content: string;
    let borderColor: string;
    let bottomTag: string;

    if (item.treasureCard) {
      name = item.treasureCard.name;
      imageUrl = `/treasures/${item.treasureCard.id}.png`;
      content = item.treasureCard.description;
      borderColor = "#8B4513"; // Brown for treasures
      bottomTag = "Treasure";
    } else if (item.traderItem) {
      name = item.traderItem.name;
      imageUrl = `/traderItems/${item.traderItem.id}.png`;
      content = formatTraderContent(item.traderItem);
      borderColor = "#FFD700"; // Gold for trader items
      bottomTag = "Item";
    } else {
      return null; // Invalid item
    }

    return (
      <div
        key={`${championId}-${name}-${index}`}
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
          onClick={() => handleItemClick(item, championId)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(0.5)";
          }}
          title={`${name} - Click to view details`}
        >
          <CardComponent
            borderColor={borderColor}
            name={name}
            imageUrl={imageUrl}
            content={content}
            bottomTag={bottomTag}
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
                  {champion.items.map((item, index) => renderItemCard(item, champion.id, index))}
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

        {/* Claims */}
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px", color: "#495057" }}>
            Claims ({playerClaimedTiles.length})
          </div>
          {playerClaimedTiles.length > 0 ? (
            <div style={{ fontSize: "11px" }}>
              {playerClaimedTiles.map((tile: Tile, index: number) => {
                const isBlockadedTile = isBlockaded(tile);
                const resourceEntries = tile.resources
                  ? Object.entries(tile.resources).filter(([_, amount]) => (amount as number) > 0)
                  : [];

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ color: colors.main, fontWeight: "bold", marginRight: "4px" }}>
                        ({tile.position.row},{tile.position.col})
                      </span>
                      {resourceEntries.length > 0 && (
                        <span style={{ color: "#6c757d" }}>
                          {resourceEntries.map(([resource, amount]) => `${amount as number} ${resource}`).join(", ")}
                        </span>
                      )}
                    </div>
                    {isBlockadedTile && (
                      <span
                        style={{
                          fontSize: "9px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          padding: "1px 4px",
                          borderRadius: "2px",
                          marginLeft: "4px",
                        }}
                      >
                        BLOCKADED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: "#6c757d", fontStyle: "italic" }}>No claimed tiles</div>
          )}
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
            {(() => {
              const item = modalItem.item;
              let name: string;
              let imageUrl: string;
              let content: string;
              let borderColor: string;
              let bottomTag: string;
              let title: string;

              if (item.treasureCard) {
                name = item.treasureCard.name;
                imageUrl = `/treasures/${item.treasureCard.id}.png`;
                content = item.treasureCard.description;
                borderColor = "#8B4513";
                bottomTag = "Treasure";
                title = `${item.treasureCard.name} - Tier ${item.treasureCard.tier}`;
              } else if (item.traderItem) {
                name = item.traderItem.name;
                imageUrl = `/traderItems/${item.traderItem.id}.png`;
                content = formatTraderContent(item.traderItem);
                borderColor = "#FFD700";
                bottomTag = "Item";
                title = `${item.traderItem.name} - ${item.traderItem.cost} gold`;
              } else {
                return null;
              }

              return (
                <CardComponent
                  borderColor={borderColor}
                  name={name}
                  imageUrl={imageUrl}
                  content={content}
                  bottomTag={bottomTag}
                  title={title}
                />
              );
            })()}

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
              Champion {modalItem.championId} - {modalItem.item.treasureCard?.name || modalItem.item.traderItem?.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
