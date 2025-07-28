import React, { useMemo, useState } from "react";
import { PlayerTurnStats, TurnStatistics } from "../lib/types";

interface CountersProps {
  statistics: readonly TurnStatistics[];
}

export const Counters: React.FC<CountersProps> = ({ statistics }) => {
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(-1); // -1 means last turn

  // Get the actual turn index and data
  const { turnIndex, turnData } = useMemo(() => {
    if (!statistics || statistics.length === 0) {
      return { turnIndex: 0, turnData: null };
    }

    const actualIndex = selectedTurnIndex === -1 ? statistics.length - 1 : selectedTurnIndex;
    return {
      turnIndex: actualIndex,
      turnData: statistics[actualIndex] || null,
    };
  }, [statistics, selectedTurnIndex]);

  const goToPreviousTurn = () => {
    if (turnIndex > 0) {
      setSelectedTurnIndex(turnIndex - 1);
    }
  };

  const goToNextTurn = () => {
    if (statistics && turnIndex < statistics.length - 1) {
      setSelectedTurnIndex(turnIndex + 1);
    }
  };

  const goToLastTurn = () => {
    setSelectedTurnIndex(-1);
  };

  // Get all stat field names from PlayerTurnStats (excluding playerName)
  const statFields: (keyof Omit<PlayerTurnStats, "playerName">)[] = [
    "fame",
    "might",
    "food",
    "wood",
    "ore",
    "gold",
    "championCount",
    "boatCount",
    "totalItems",
    "totalFollowers",
    "championVsChampionWins",
    "championVsChampionLosses",
    "championVsMonsterWins",
    "championVsMonsterLosses",
    "dragonEncounters",
    "marketInteractions",
    "blacksmithInteractions",
    "traderInteractions",
    "templeInteractions",
    "mercenaryInteractions",
    "championActions",
    "boatActions",
    "harvestActions",
    "buildActions",
    "adventureCards",
    "claimedTiles",
    "starredTiles",
    "totalResourcesFromTiles",
    "hasBlacksmith",
    "hasMarket",
    "hasChapel",
    "hasMonastery",
    "hasWarshipUpgrade",
  ];

  // Format field name for display
  const formatFieldName = (field: string): string => {
    // Convert camelCase to readable format
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return String(value);
  };

  if (!statistics || statistics.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Statistics Available</h3>
        <p>Statistics will be displayed once the game has started.</p>
      </div>
    );
  }

  if (!turnData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Data for Selected Turn</h3>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>Player Statistics Table</h3>

      {/* Turn Navigation */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          backgroundColor: "#f8f9fa",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <button
          onClick={goToPreviousTurn}
          disabled={turnIndex === 0}
          style={{
            padding: "6px 12px",
            backgroundColor: turnIndex === 0 ? "#e9ecef" : "#3498db",
            color: turnIndex === 0 ? "#6c757d" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: turnIndex === 0 ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          Previous Turn
        </button>

        <span
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            color: "#2c3e50",
            minWidth: "120px",
            textAlign: "center",
          }}
        >
          Round {turnData.round}
        </span>

        <button
          onClick={goToNextTurn}
          disabled={turnIndex === statistics.length - 1}
          style={{
            padding: "6px 12px",
            backgroundColor: turnIndex === statistics.length - 1 ? "#e9ecef" : "#3498db",
            color: turnIndex === statistics.length - 1 ? "#6c757d" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: turnIndex === statistics.length - 1 ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          Next Turn
        </button>

        <button
          onClick={goToLastTurn}
          style={{
            padding: "6px 12px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Latest Turn
        </button>

        <span style={{ color: "#6c757d", fontSize: "14px" }}>
          Turn {turnIndex + 1} of {statistics.length}
        </span>
      </div>

      {/* Statistics Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "white",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  borderBottom: "2px solid #ddd",
                  fontWeight: "bold",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#f8f9fa",
                  zIndex: 1,
                }}
              >
                Statistic
              </th>
              {turnData.playerStats.map((player) => (
                <th
                  key={player.playerName}
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    borderBottom: "2px solid #ddd",
                    borderLeft: "1px solid #ddd",
                    fontWeight: "bold",
                    minWidth: "100px",
                  }}
                >
                  {player.playerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statFields.map((field, index) => (
              <tr
                key={field}
                style={{
                  backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
                }}
              >
                <td
                  style={{
                    padding: "8px 10px",
                    fontWeight: "500",
                    borderRight: "2px solid #ddd",
                    position: "sticky",
                    left: 0,
                    backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
                    zIndex: 1,
                  }}
                >
                  {formatFieldName(field)}
                </td>
                {turnData.playerStats.map((player) => (
                  <td
                    key={player.playerName}
                    style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      borderLeft: "1px solid #ddd",
                    }}
                  >
                    {formatValue(player[field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
