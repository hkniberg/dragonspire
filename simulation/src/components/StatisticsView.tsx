import React, { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TurnStatistics } from "../lib/types";

interface StatisticsViewProps {
  statistics: readonly TurnStatistics[];
}

type MetricType = "resources" | "fame" | "might" | "economic" | "military";

const getPlayerColor = (playerName: string): string => {
  const colors = {
    Alice: "#3498db",
    Bob: "#e74c3c",
    Charlie: "#2ecc71",
    Diana: "#f39c12",
  };

  // Fallback colors for other names
  const fallbackColors = ["#9b59b6", "#1abc9c", "#34495e", "#e67e22"];
  const index = playerName.charCodeAt(0) % fallbackColors.length;

  return colors[playerName as keyof typeof colors] || fallbackColors[index];
};

const formatTooltipValue = (value: any, name: string) => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return [value, name];
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("resources");

  const chartData = useMemo(() => {
    if (!statistics || statistics.length === 0) {
      return [];
    }

    return statistics.map((turnStats) => {
      const dataPoint: any = {
        round: turnStats.round,
      };

      turnStats.playerStats.forEach((playerStats) => {
        const playerName = playerStats.playerName;

        switch (selectedMetric) {
          case "resources":
            dataPoint[`${playerName}_Food`] = playerStats.food;
            dataPoint[`${playerName}_Wood`] = playerStats.wood;
            dataPoint[`${playerName}_Ore`] = playerStats.ore;
            dataPoint[`${playerName}_Gold`] = playerStats.gold;
            break;
          case "fame":
            dataPoint[`${playerName}_Fame`] = playerStats.fame;
            break;
          case "might":
            dataPoint[`${playerName}_Might`] = playerStats.might;
            break;
          case "economic":
            dataPoint[`${playerName}_TotalResources`] =
              playerStats.food + playerStats.wood + playerStats.ore + playerStats.gold;
            dataPoint[`${playerName}_ClaimedTiles`] = playerStats.claimedTiles;
            dataPoint[`${playerName}_StarredTiles`] = playerStats.starredTiles;
            break;
          case "military":
            dataPoint[`${playerName}_Champions`] = playerStats.championCount;
            dataPoint[`${playerName}_Boats`] = playerStats.boatCount;
            dataPoint[`${playerName}_TotalItems`] = playerStats.totalItems;
            break;
        }
      });

      return dataPoint;
    });
  }, [statistics, selectedMetric]);

  const getLines = () => {
    if (!statistics || statistics.length === 0) {
      return [];
    }

    const playerNames = statistics[0].playerStats.map((p) => p.playerName);
    const lines: React.JSX.Element[] = [];

    playerNames.forEach((playerName) => {
      const color = getPlayerColor(playerName);

      switch (selectedMetric) {
        case "resources":
          lines.push(
            <Line
              key={`${playerName}_Food`}
              type="monotone"
              dataKey={`${playerName}_Food`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="0"
              name={`${playerName} Food`}
            />,
            <Line
              key={`${playerName}_Wood`}
              type="monotone"
              dataKey={`${playerName}_Wood`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 5"
              name={`${playerName} Wood`}
            />,
            <Line
              key={`${playerName}_Ore`}
              type="monotone"
              dataKey={`${playerName}_Ore`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="10 5"
              name={`${playerName} Ore`}
            />,
            <Line
              key={`${playerName}_Gold`}
              type="monotone"
              dataKey={`${playerName}_Gold`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="15 5"
              name={`${playerName} Gold`}
            />,
          );
          break;
        case "fame":
          lines.push(
            <Line
              key={`${playerName}_Fame`}
              type="monotone"
              dataKey={`${playerName}_Fame`}
              stroke={color}
              strokeWidth={3}
              name={`${playerName} Fame`}
            />,
          );
          break;
        case "might":
          lines.push(
            <Line
              key={`${playerName}_Might`}
              type="monotone"
              dataKey={`${playerName}_Might`}
              stroke={color}
              strokeWidth={3}
              name={`${playerName} Might`}
            />,
          );
          break;
        case "economic":
          lines.push(
            <Line
              key={`${playerName}_TotalResources`}
              type="monotone"
              dataKey={`${playerName}_TotalResources`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="0"
              name={`${playerName} Total Resources`}
            />,
            <Line
              key={`${playerName}_ClaimedTiles`}
              type="monotone"
              dataKey={`${playerName}_ClaimedTiles`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 5"
              name={`${playerName} Claimed Tiles`}
            />,
            <Line
              key={`${playerName}_StarredTiles`}
              type="monotone"
              dataKey={`${playerName}_StarredTiles`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="10 5"
              name={`${playerName} Starred Tiles`}
            />,
          );
          break;
        case "military":
          lines.push(
            <Line
              key={`${playerName}_Champions`}
              type="monotone"
              dataKey={`${playerName}_Champions`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="0"
              name={`${playerName} Champions`}
            />,
            <Line
              key={`${playerName}_Boats`}
              type="monotone"
              dataKey={`${playerName}_Boats`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 5"
              name={`${playerName} Boats`}
            />,
            <Line
              key={`${playerName}_TotalItems`}
              type="monotone"
              dataKey={`${playerName}_TotalItems`}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="10 5"
              name={`${playerName} Total Items`}
            />,
          );
          break;
      }
    });

    return lines;
  };

  const getChartTitle = () => {
    switch (selectedMetric) {
      case "resources":
        return "Resources Over Time";
      case "fame":
        return "Fame Over Time";
      case "might":
        return "Might Over Time";
      case "economic":
        return "Economic Metrics Over Time";
      case "military":
        return "Military Metrics Over Time";
      default:
        return "Statistics Over Time";
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

        {/* Metric Filter Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { key: "resources", label: "Resources" },
            { key: "fame", label: "Fame" },
            { key: "might", label: "Might" },
            { key: "economic", label: "Economic" },
            { key: "military", label: "Military" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as MetricType)}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedMetric === key ? "#3498db" : "#f8f9fa",
                color: selectedMetric === key ? "white" : "#495057",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedMetric === key ? "bold" : "normal",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (selectedMetric !== key) {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                }
              }}
              onMouseOut={(e) => {
                if (selectedMetric !== key) {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "500px" }}>
        <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "20px" }}>{getChartTitle()}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="round"
              stroke="#666"
              tick={{ fontSize: 12 }}
              label={{ value: "Round", position: "insideBottom", offset: -10 }}
            />
            <YAxis stroke="#666" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
              }}
              formatter={formatTooltipValue}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {getLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        <p>
          <strong>Total Rounds:</strong> {statistics.length} |<strong> Players:</strong>{" "}
          {statistics[0]?.playerStats.map((p) => p.playerName).join(", ")}
        </p>
      </div>
    </div>
  );
};
