// Lords of Doomspire Trader Decision Modal

import React, { useState } from "react";
import { TraderAction, TraderContext, TraderDecision } from "@/lib/traderTypes";
import { getTraderItemById } from "@/content/traderItems";
import { ResourceType } from "@/lib/types";
import { ResourceIcon } from "./ResourceIcon";

interface TraderModalProps {
  isOpen: boolean;
  traderContext: TraderContext;
  onConfirm: (decision: TraderDecision) => void;
  onCancel: () => void;
}

export const TraderModal: React.FC<TraderModalProps> = ({ isOpen, traderContext, onConfirm, onCancel }) => {
  const [selectedActions, setSelectedActions] = useState<TraderAction[]>([]);

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

  const handleSellResources = (resourceType: ResourceType, amount: number, requestedResource: ResourceType) => {
    const newAction: TraderAction = {
      type: "sellResources",
      resourcesSold: { [resourceType]: amount } as Record<ResourceType, number>,
      resourceRequested: requestedResource,
    };

    // For simplicity, replace any existing sell action
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

  const handleConfirm = () => {
    const decision: TraderDecision = {
      actions: selectedActions,
      reasoning: "Human player trader decision",
    };
    onConfirm(decision);
    setSelectedActions([]); // Reset for next time
  };

  const handleCancel = () => {
    setSelectedActions([]); // Reset selections
    onCancel();
  };

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
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "500px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: "#2c3e50", textAlign: "center" }}>🏪 Trader</h3>

        {/* Player Resources */}
        <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>Your Resources:</h4>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {(Object.entries(traderContext.playerResources) as [ResourceType, number][]).map(([resource, amount]) => (
              <div key={resource} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ResourceIcon resourceType={resource} size={20} />
                <span style={{ fontWeight: "bold", color: "#495057" }}>{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Available Items */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ marginTop: 0, color: "#495057" }}>Available Items:</h4>
          {traderContext.availableItems.length === 0 ? (
            <p style={{ color: "#6c757d", fontStyle: "italic" }}>No items available for purchase.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {traderContext.availableItems.map((item) => {
                const traderItem = getTraderItemById(item.id);
                if (!traderItem) return null;

                const isSelected = isItemSelected(item.id);
                const canAfford = canAffordItem(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      border: `2px solid ${isSelected ? "#28a745" : canAfford ? "#dee2e6" : "#dc3545"}`,
                      borderRadius: "6px",
                      padding: "12px",
                      cursor: canAfford ? "pointer" : "not-allowed",
                      backgroundColor: isSelected ? "#d4edda" : canAfford ? "white" : "#f8d7da",
                      opacity: canAfford ? 1 : 0.6,
                    }}
                    onClick={() => canAfford && handleBuyItem(item.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", color: "#2c3e50", marginBottom: "4px" }}>
                          {traderItem.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>
                          {traderItem.description}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "12px" }}>
                        <ResourceIcon resourceType="gold" size={18} />
                        <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{traderItem.cost}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#155724",
                          fontWeight: "bold",
                          marginTop: "8px",
                        }}
                      >
                        ✓ Selected for purchase
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resource Trading Section */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#495057" }}>Resource Trading:</h4>
          <p style={{ fontSize: "14px", color: "#6c757d", margin: "0 0 12px 0" }}>
            Trade 2 of any resource for 1 of another resource
          </p>
          <div style={{ display: "grid", gap: "8px" }}>
            {(["food", "wood", "ore"] as ResourceType[]).map((resourceType) => {
              const hasEnough = traderContext.playerResources[resourceType] >= 2;
              const otherResources = (["food", "wood", "ore", "gold"] as ResourceType[]).filter(
                (r) => r !== resourceType,
              );

              return hasEnough ? (
                <div key={resourceType} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", minWidth: "80px" }}>Trade 2</span>
                  <ResourceIcon resourceType={resourceType} size={16} />
                  <span style={{ fontSize: "14px" }}>for 1</span>
                  {otherResources.map((targetResource) => (
                    <button
                      key={targetResource}
                      onClick={() => handleSellResources(resourceType, 2, targetResource)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <ResourceIcon resourceType={targetResource} size={14} />
                      {targetResource}
                    </button>
                  ))}
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedActions.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              backgroundColor: "#e9ecef",
              borderRadius: "6px",
            }}
          >
            <h5 style={{ margin: "0 0 8px 0", color: "#495057" }}>Selected Actions:</h5>
            {selectedActions.map((action, index) => (
              <div key={index} style={{ fontSize: "14px", color: "#495057", marginBottom: "4px" }}>
                {action.type === "buyItem" && action.itemId && (
                  <>
                    • Buy {getTraderItemById(action.itemId)?.name} for {getTraderItemById(action.itemId)?.cost} gold
                  </>
                )}
                {action.type === "sellResources" && action.resourcesSold && action.resourceRequested && (
                  <>
                    • Trade{" "}
                    {Object.entries(action.resourcesSold)
                      .map(([res, amt]) => `${amt} ${res}`)
                      .join(", ")}{" "}
                    for 1 {action.resourceRequested}
                  </>
                )}
              </div>
            ))}
            <div style={{ fontWeight: "bold", color: "#2c3e50", marginTop: "8px" }}>
              Total Cost: {getTotalCost()} gold
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
          <button
            onClick={handleConfirm}
            disabled={!canAffordSelection()}
            style={{
              padding: "10px 20px",
              backgroundColor: canAffordSelection() ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: canAffordSelection() ? "pointer" : "not-allowed",
              fontSize: "14px",
              opacity: canAffordSelection() ? 1 : 0.6,
            }}
          >
            {selectedActions.length === 0 ? "Leave Trader" : "Confirm Trade"}
          </button>
        </div>
      </div>
    </div>
  );
};
