import React, { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TurnStatistics } from "../lib/types";

interface PlayerResourcesProps {
  statistics: readonly TurnStatistics[];
}

type PlayerMetricType = "food" | "wood" | "ore" | "gold" | "might" | "fame" | "claimedTiles" | "starredTiles";

const metricColors: Record<PlayerMetricType, string> = {
  food: "#2ecc71",
  wood: "#8b4513",
  ore: "#95a5a6",
  gold: "#f39c12",
  might: "#e74c3c",
  fame: "#9b59b6",
  claimedTiles: "#3498db",
  starredTiles: "#f1c40f",
};

export const PlayerResources: React.FC<PlayerResourcesProps> = ({ statistics }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [enabledMetrics, setEnabledMetrics] = useState<Set<PlayerMetricType>>(
    new Set(["food", "wood", "ore", "gold", "might", "fame"]),
  );

  // Get available players
  const playerNames = useMemo(() => {
    if (!statistics || statistics.length === 0) return [];
    const names = statistics[0].playerStats.map((p) => p.playerName);
    if (selectedPlayer === "" && names.length > 0) {
      setSelectedPlayer(names[0]);
    }
    return names;
  }, [statistics, selectedPlayer]);

  const chartData = useMemo(() => {
    if (!statistics || statistics.length === 0 || selectedPlayer === "") {
      return [];
    }

    return statistics.map((turnStats) => {
      const playerStats = turnStats.playerStats.find((p) => p.playerName === selectedPlayer);
      if (!playerStats) return { round: turnStats.round };

      const dataPoint: any = {
        round: turnStats.round,
      };

      // Add enabled metrics to data point
      if (enabledMetrics.has("food")) dataPoint.food = playerStats.food;
      if (enabledMetrics.has("wood")) dataPoint.wood = playerStats.wood;
      if (enabledMetrics.has("ore")) dataPoint.ore = playerStats.ore;
      if (enabledMetrics.has("gold")) dataPoint.gold = playerStats.gold;
      if (enabledMetrics.has("might")) dataPoint.might = playerStats.might;
      if (enabledMetrics.has("fame")) dataPoint.fame = playerStats.fame;
      if (enabledMetrics.has("claimedTiles")) dataPoint.claimedTiles = playerStats.claimedTiles;
      if (enabledMetrics.has("starredTiles")) dataPoint.starredTiles = playerStats.starredTiles;

      return dataPoint;
    });
  }, [statistics, selectedPlayer, enabledMetrics]);

  const toggleMetric = (metric: PlayerMetricType) => {
    const newEnabledMetrics = new Set(enabledMetrics);
    if (newEnabledMetrics.has(metric)) {
      newEnabledMetrics.delete(metric);
    } else {
      newEnabledMetrics.add(metric);
    }
    setEnabledMetrics(newEnabledMetrics);
  };

  const getLines = () => {
    return Array.from(enabledMetrics).map((metric) => (
      <Line
        key={metric}
        type="monotone"
        dataKey={metric}
        stroke={metricColors[metric]}
        strokeWidth={2}
        name={metric.charAt(0).toUpperCase() + metric.slice(1)}
      />
    ));
  };

  if (!statistics || statistics.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Statistics Available</h3>
        <p>Statistics will be displayed once the game has started.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>Player Resources Over Time</h3>

      {/* Player Selection */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Player:</label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          style={{
            padding: "6px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {playerNames.map((playerName) => (
            <option key={playerName} value={playerName}>
              {playerName}
            </option>
          ))}
        </select>
      </div>

      {/* Metric Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Metrics:</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "food", label: "Food" },
            { key: "wood", label: "Wood" },
            { key: "ore", label: "Ore" },
            { key: "gold", label: "Gold" },
            { key: "might", label: "Might" },
            { key: "fame", label: "Fame" },
            { key: "claimedTiles", label: "Claimed Tiles" },
            { key: "starredTiles", label: "Starred Tiles" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleMetric(key as PlayerMetricType)}
              style={{
                padding: "4px 8px",
                backgroundColor: enabledMetrics.has(key as PlayerMetricType)
                  ? metricColors[key as PlayerMetricType]
                  : "#f8f9fa",
                color: enabledMetrics.has(key as PlayerMetricType) ? "white" : "#495057",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: enabledMetrics.has(key as PlayerMetricType) ? "bold" : "normal",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "400px" }}>
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
            <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(value) => Math.floor(value).toString()} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {getLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
