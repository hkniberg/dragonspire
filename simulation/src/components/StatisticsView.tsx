import React, { useState } from "react";
import { TurnStatistics } from "../lib/types";
import { Counters } from "./Counters";
import { PlayerComparisonOverTime } from "./PlayerComparisonOverTime";
import { PlayerResources } from "./PlayerResources";

interface StatisticsViewProps {
  statistics: readonly TurnStatistics[];
}

type ViewType = "comparison" | "resources" | "counters";

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics }) => {
  const [activeView, setActiveView] = useState<ViewType>("comparison");

  const renderContent = () => {
    switch (activeView) {
      case "comparison":
        return <PlayerComparisonOverTime statistics={statistics} />;
      case "resources":
        return <PlayerResources statistics={statistics} />;
      case "counters":
        return <Counters statistics={statistics} />;
      default:
        return <PlayerComparisonOverTime statistics={statistics} />;
    }
  };

  if (!statistics || statistics.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ color: "#6c757d", marginBottom: "20px" }}>No Statistics Available</h2>
        <p style={{ color: "#6c757d", fontSize: "16px" }}>
          Statistics will be displayed here once the game has started and turns have been executed.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#2c3e50", marginBottom: "15px" }}>Game Statistics</h2>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "20px" }}>
          {[
            { key: "comparison", label: "Player Comparison" },
            { key: "resources", label: "Player Resources" },
            { key: "counters", label: "Statistics Table" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as ViewType)}
              style={{
                padding: "10px 20px",
                backgroundColor: activeView === key ? "#3498db" : "#f8f9fa",
                color: activeView === key ? "white" : "#495057",
                border: "1px solid #ddd",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeView === key ? "bold" : "normal",
                transition: "all 0.2s ease",
                borderBottom: activeView === key ? "none" : "1px solid #ddd",
                marginBottom: activeView === key ? "1px" : "0",
              }}
              onMouseOver={(e) => {
                if (activeView !== key) {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                }
              }}
              onMouseOut={(e) => {
                if (activeView !== key) {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "0 8px 8px 8px",
          padding: "20px",
          backgroundColor: "white",
          minHeight: "500px",
        }}
      >
        {renderContent()}
      </div>

      {/* Summary */}
      <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
        <p>
          <strong>Total Rounds:</strong> {statistics.length} | <strong>Players:</strong>{" "}
          {statistics[0]?.playerStats.map((p) => p.playerName).join(", ")}
        </p>
      </div>
    </div>
  );
};
