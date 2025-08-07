// Lords of Doomspire Trader Decision Modal

import React, { useState } from "react";
import { TraderAction, TraderContext, TraderDecision } from "@/lib/traderTypes";
import { getTraderItemById, TRADER_ITEMS } from "@/content/traderItems";
import { ResourceType } from "@/lib/types";
import { ResourceIcon } from "./ResourceIcon";
import { CardComponent, formatTraderContent } from "./cards/Card";

interface TraderModalProps {
  isOpen: boolean;
  traderContext: TraderContext;
  onConfirm: (decision: TraderDecision) => void;
  onCancel: () => void;
  onExecuteTrade?: (decision: TraderDecision) => void;
}

type TabType = "exchange" | "buy";

export const TraderModal: React.FC<TraderModalProps> = ({ isOpen, traderContext, onConfirm, onCancel }) => {
  const [activeTab, setActiveTab] = useState<TabType>("exchange");
  const [selectedActions, setSelectedActions] = useState<TraderAction[]>([]);

  // Exchange state
  const [exchangeFrom, setExchangeFrom] = useState<ResourceType | null>(null);
  const [exchangeTo, setExchangeTo] = useState<ResourceType | null>(null);

  if (!isOpen) return null;

  const handleBuyItem = (itemId: string) => {
    const existingActionIndex = selectedActions.findIndex(
      (action) => action.type === "buyItem" && action.itemId === itemId,
    );

    if (existingActionIndex !== -1) {
      // Remove the action (deselect)
      setSelectedActions((prev) => prev.filter((_, index) => index !== existingActionIndex));
    } else {
      // Add the action (select)
      setSelectedActions((prev) => [
        ...prev,
        {
          type: "buyItem",
          itemId: itemId,
        },
      ]);
    }
  };

  const handleExchange = () => {
    if (!exchangeFrom || !exchangeTo) return;

    const newAction: TraderAction = {
      type: "sellResources",
      resourcesSold: { [exchangeFrom]: 2 } as Record<ResourceType, number>,
      resourceRequested: exchangeTo,
    };

    // Replace any existing sell action
    setSelectedActions((prev) => [...prev.filter((action) => action.type !== "sellResources"), newAction]);
  };

  const isItemSelected = (itemId: string) => {
    return selectedActions.some((action) => action.type === "buyItem" && action.itemId === itemId);
  };

  const canAffordItem = (itemId: string) => {
    const traderItem = getTraderItemById(itemId);
    return traderItem && traderContext.playerResources.gold >= traderItem.cost;
  };

  const getTotalCost = () => {
    return selectedActions.reduce((total, action) => {
      if (action.type === "buyItem" && action.itemId) {
        const traderItem = getTraderItemById(action.itemId);
        return total + (traderItem?.cost || 0);
      }
      return total;
    }, 0);
  };

  const canAffordSelection = () => {
    return getTotalCost() <= traderContext.playerResources.gold;
  };

  const canExchange = () => {
    return (
      exchangeFrom && exchangeTo && exchangeFrom !== exchangeTo && traderContext.playerResources[exchangeFrom] >= 2
    );
  };

  const hasAnyActions = () => {
    return selectedActions.length > 0 || (canExchange() && activeTab === "exchange");
  };

  const [completedActions, setCompletedActions] = useState<TraderAction[]>([]);

  const handleAddToCart = () => {
    let currentActions: TraderAction[] = [];

    // Add exchange action if we're on exchange tab and have valid exchange
    if (activeTab === "exchange" && canExchange()) {
      const exchangeAction: TraderAction = {
        type: "sellResources",
        resourcesSold: { [exchangeFrom!]: 2 } as Record<ResourceType, number>,
        resourceRequested: exchangeTo!,
      };
      currentActions.push(exchangeAction);
    }

    // Add selected buy actions
    currentActions.push(...selectedActions);

    if (currentActions.length > 0) {
      // Add to completed actions for display
      setCompletedActions((prev) => [...prev, ...currentActions]);

      // Clear current selections but keep modal open
      setSelectedActions([]);
      setExchangeFrom(null);
      setExchangeTo(null);
    }
  };

  const handleFinishTrading = () => {
    // Add any pending actions to the cart first
    let pendingActions: TraderAction[] = [];

    if (activeTab === "exchange" && canExchange()) {
      const exchangeAction: TraderAction = {
        type: "sellResources",
        resourcesSold: { [exchangeFrom!]: 2 } as Record<ResourceType, number>,
        resourceRequested: exchangeTo!,
      };
      pendingActions.push(exchangeAction);
    }
    pendingActions.push(...selectedActions);

    // Combine completed actions with any pending actions
    const allActions = [...completedActions, ...pendingActions];

    // Submit all actions and close modal
    const decision: TraderDecision = {
      actions: allActions,
      reasoning: "Human player trader decision",
    };
    onConfirm(decision);
  };

  const handleCancel = () => {
    setSelectedActions([]);
    setExchangeFrom(null);
    setExchangeTo(null);
    setCompletedActions([]);
    onCancel();
  };

  const renderExchangeTab = () => (
    <div>
      {/* Exchange Interface */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "14px", color: "#6c757d", margin: "0 0 16px 0" }}>
          Trade 2 of any resource for 1 of another resource
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* From Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>Give 2</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["food", "wood", "ore", "gold"] as ResourceType[]).map((resourceType) => {
                const hasEnough = traderContext.playerResources[resourceType] >= 2;
                const isSelected = exchangeFrom === resourceType;

                return (
                  <button
                    key={resourceType}
                    onClick={() => setExchangeFrom(isSelected ? null : resourceType)}
                    disabled={!hasEnough}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      border: `2px solid ${isSelected ? "#007bff" : hasEnough ? "#dee2e6" : "#dc3545"}`,
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "#e3f2fd" : hasEnough ? "white" : "#f8d7da",
                      cursor: hasEnough ? "pointer" : "not-allowed",
                      fontSize: "14px",
                      opacity: hasEnough ? 1 : 0.6,
                    }}
                  >
                    <ResourceIcon resource={resourceType} size="m" />
                    <span style={{ fontWeight: "bold" }}>{resourceType}</span>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      ({traderContext.playerResources[resourceType]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arrow */}
          <div style={{ fontSize: "20px", color: "#666" }}>→</div>

          {/* To Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>Get 1</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["food", "wood", "ore", "gold"] as ResourceType[]).map((resourceType) => {
                const isSelected = exchangeTo === resourceType;
                const isDisabled = exchangeFrom === resourceType;

                return (
                  <button
                    key={resourceType}
                    onClick={() => setExchangeTo(isSelected ? null : resourceType)}
                    disabled={isDisabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      border: `2px solid ${isSelected ? "#28a745" : isDisabled ? "#dc3545" : "#dee2e6"}`,
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "#d4edda" : isDisabled ? "#f8d7da" : "white",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      opacity: isDisabled ? 0.6 : 1,
                    }}
                  >
                    <ResourceIcon resource={resourceType} size="m" />
                    <span style={{ fontWeight: "bold" }}>{resourceType}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Exchange Preview */}
        {exchangeFrom && exchangeTo && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#e8f5e8",
              borderRadius: "6px",
              border: "1px solid #28a745",
            }}
          >
            <div style={{ fontSize: "14px", color: "#155724", fontWeight: "bold" }}>
              ✓ Ready to exchange: 2 {exchangeFrom} → 1 {exchangeTo}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBuyTab = () => (
    <div>
      {/* Buy Items Interface */}
      {traderContext.availableItems.length === 0 ? (
        <p style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center", margin: "40px 0" }}>
          No items available for purchase.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            maxHeight: "400px",
            overflow: "auto",
            padding: "10px",
          }}
        >
          {traderContext.availableItems.map((item) => {
            const traderItem = getTraderItemById(item.id);
            if (!traderItem) return null;

            const isSelected = isItemSelected(item.id);
            const canAfford = canAffordItem(item.id);

            return (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  cursor: canAfford ? "pointer" : "not-allowed",
                  transform: "scale(0.8)",
                  transformOrigin: "center",
                  opacity: canAfford ? 1 : 0.6,
                }}
                onClick={() => canAfford && handleBuyItem(item.id)}
              >
                <CardComponent
                  borderColor={isSelected ? "#28a745" : canAfford ? "#FFD700" : "#dc3545"}
                  name={traderItem.name}
                  imageUrl={`/traderItems/${traderItem.id}.png`}
                  content={formatTraderContent(traderItem)}
                  bottomTag="Trader Item"
                  title={`${traderItem.name} - ${traderItem.cost} gold`}
                />

                {/* Selection indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "#28a745",
                      color: "white",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </div>
                )}

                {/* Cost indicator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "8px",
                    backgroundColor: canAfford ? "#28a745" : "#dc3545",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ResourceIcon resource="gold" size="s" />
                  {traderItem.cost}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Selection Summary */}
      {selectedActions.filter((a) => a.type === "buyItem").length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#e9ecef",
            borderRadius: "6px",
          }}
        >
          <h5 style={{ margin: "0 0 8px 0", color: "#495057" }}>Selected Items:</h5>
          {selectedActions
            .filter((a) => a.type === "buyItem")
            .map((action, index) => (
              <div key={index} style={{ fontSize: "14px", color: "#495057", marginBottom: "4px" }}>
                • {getTraderItemById(action.itemId!)?.name} ({getTraderItemById(action.itemId!)?.cost} gold)
              </div>
            ))}
          <div style={{ fontWeight: "bold", color: "#2c3e50", marginTop: "8px" }}>
            Total Cost: {getTotalCost()} gold
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "600px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 style={{ marginTop: 0, color: "#2c3e50", textAlign: "center", marginBottom: "16px" }}>🏪 Trader</h3>

        {/* Player Resources */}
        <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>Your Resources:</h4>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {(Object.entries(traderContext.playerResources) as [ResourceType, number][]).map(([resource, amount]) => (
              <div key={resource} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ResourceIcon resource={resource} size="m" />
                <span style={{ fontWeight: "bold", color: "#495057" }}>{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Actions Summary */}
        {completedActions.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              backgroundColor: "#d4edda",
              borderRadius: "6px",
              border: "1px solid #28a745",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#155724" }}>Completed This Visit:</h4>
            {completedActions.map((action, index) => (
              <div key={index} style={{ fontSize: "14px", color: "#155724", marginBottom: "4px" }}>
                {action.type === "buyItem" && action.itemId && (
                  <>
                    ✓ Bought {getTraderItemById(action.itemId)?.name} for {getTraderItemById(action.itemId)?.cost} gold
                  </>
                )}
                {action.type === "sellResources" && action.resourcesSold && action.resourceRequested && (
                  <>
                    ✓ Exchanged{" "}
                    {Object.entries(action.resourcesSold)
                      .map(([res, amt]) => `${amt} ${res}`)
                      .join(", ")}{" "}
                    for 1 {action.resourceRequested}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid #dee2e6" }}>
          <button
            onClick={() => setActiveTab("exchange")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: activeTab === "exchange" ? "#007bff" : "transparent",
              color: activeTab === "exchange" ? "white" : "#007bff",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: activeTab === "exchange" ? "2px solid #007bff" : "none",
            }}
          >
            Exchange Resources
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: activeTab === "buy" ? "#007bff" : "transparent",
              color: activeTab === "buy" ? "white" : "#007bff",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: activeTab === "buy" ? "2px solid #007bff" : "none",
            }}
          >
            Buy Items
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: "auto", minHeight: "200px" }}>
          {activeTab === "exchange" && renderExchangeTab()}
          {activeTab === "buy" && renderBuyTab()}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "space-between",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <button
            onClick={handleCancel}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: "12px" }}>
            {hasAnyActions() && (
              <button
                onClick={handleAddToCart}
                disabled={activeTab === "buy" && !canAffordSelection()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: activeTab === "exchange" || canAffordSelection() ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: activeTab === "exchange" || canAffordSelection() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  opacity: activeTab === "exchange" || canAffordSelection() ? 1 : 0.6,
                }}
              >
                Add to Cart
              </button>
            )}

            <button
              onClick={handleFinishTrading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {completedActions.length > 0 || hasAnyActions() ? "Finish Trading" : "Leave Trader"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
