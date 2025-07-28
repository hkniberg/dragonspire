import React, { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TurnStatistics } from "../lib/types";

interface PlayerComparisonOverTimeProps {
  statistics: readonly TurnStatistics[];
}

type MetricType = "food" | "wood" | "ore" | "gold" | "might" | "fame" | "claimedTiles" | "starredTiles";

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

export const PlayerComparisonOverTime: React.FC<PlayerComparisonOverTimeProps> = ({ statistics }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("food");
  const [enabledPlayers, setEnabledPlayers] = useState<Set<string>>(new Set());

  // Initialize enabled players when statistics change
  const playerNames = useMemo(() => {
    if (!statistics || statistics.length === 0) return [];
    const names = statistics[0].playerStats.map((p) => p.playerName);
    if (enabledPlayers.size === 0) {
      setEnabledPlayers(new Set(names));
    }
    return names;
  }, [statistics, enabledPlayers.size]);

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
        if (enabledPlayers.has(playerName)) {
          dataPoint[playerName] = playerStats[selectedMetric];
        }
      });

      return dataPoint;
    });
  }, [statistics, selectedMetric, enabledPlayers]);

  const togglePlayer = (playerName: string) => {
    const newEnabledPlayers = new Set(enabledPlayers);
    if (newEnabledPlayers.has(playerName)) {
      newEnabledPlayers.delete(playerName);
    } else {
      newEnabledPlayers.add(playerName);
    }
    setEnabledPlayers(newEnabledPlayers);
  };

  const getLines = () => {
    return playerNames
      .filter((playerName) => enabledPlayers.has(playerName))
      .map((playerName) => (
        <Line
          key={playerName}
          type="monotone"
          dataKey={playerName}
          stroke={getPlayerColor(playerName)}
          strokeWidth={3}
          name={playerName}
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
      <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>Player Comparison Over Time</h3>

      {/* Metric Selection */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Metric:</label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
              onClick={() => setSelectedMetric(key as MetricType)}
              style={{
                padding: "6px 12px",
                backgroundColor: selectedMetric === key ? "#3498db" : "#f8f9fa",
                color: selectedMetric === key ? "white" : "#495057",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedMetric === key ? "bold" : "normal",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Player Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Players:</label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {playerNames.map((playerName) => (
            <button
              key={playerName}
              onClick={() => togglePlayer(playerName)}
              style={{
                padding: "6px 12px",
                backgroundColor: enabledPlayers.has(playerName) ? getPlayerColor(playerName) : "#f8f9fa",
                color: enabledPlayers.has(playerName) ? "white" : "#495057",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: enabledPlayers.has(playerName) ? "bold" : "normal",
              }}
            >
              {playerName}
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
