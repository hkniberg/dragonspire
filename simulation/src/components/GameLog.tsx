import { GameLogEntry, GameLogEntryType, Player } from "@/lib/types";
import React, { useState } from "react";
import { LuCopy, LuDownload, LuMaximize2, LuMinimize2 } from "react-icons/lu";
import { PlayerFilter } from "./PlayerFilter";

interface GameLogProps {
  gameLog: GameLogEntry[];
  isVisible: boolean;
  players?: Player[];
}

interface GroupedLogEntry {
  round: number;
  entries: GameLogEntry[];
}

interface PlayerGroupedEntry {
  round: number;
  playerGroups: {
    playerName: string;
    entries: GameLogEntry[];
  }[];
}

// Helper function to group log entries by round and then by player
function groupGameLogEntriesByRoundAndPlayer(entries: GameLogEntry[]): PlayerGroupedEntry[] {
  const roundGroups = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.round]) {
        acc[entry.round] = [];
      }
      acc[entry.round].push(entry);
      return acc;
    },
    {} as Record<number, GameLogEntry[]>,
  );

  return Object.entries(roundGroups)
    .map(([round, roundEntries]) => {
      // Group entries within the round by player
      const playerGroups = roundEntries.reduce(
        (acc, entry) => {
          if (!acc[entry.playerName]) {
            acc[entry.playerName] = [];
          }
          acc[entry.playerName].push(entry);
          return acc;
        },
        {} as Record<string, GameLogEntry[]>,
      );

      return {
        round: parseInt(round),
        playerGroups: Object.entries(playerGroups).map(([playerName, entries]) => ({
          playerName,
          entries,
        })),
      };
    })
    .sort((a, b) => a.round - b.round);
}

// Helper function to group log entries by round (for markdown export)
function groupGameLogEntriesByRound(entries: GameLogEntry[]): GroupedLogEntry[] {
  const grouped = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.round]) {
        acc[entry.round] = [];
      }
      acc[entry.round].push(entry);
      return acc;
    },
    {} as Record<number, GameLogEntry[]>,
  );

  return Object.entries(grouped)
    .map(([round, entries]) => ({ round: parseInt(round), entries }))
    .sort((a, b) => a.round - b.round);
}

// Helper function to format a single log entry without player name
function formatGameLogEntryContent(entry: GameLogEntry): string {
  const typeEmoji = getEntryEmoji(entry.type);
  return `${typeEmoji} ${entry.content}`;
}

// Helper function to get preview text for thinking entries
function getThinkingPreview(content: string, maxWords: number = 8): string {
  const words = content.split(" ");
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(" ") + "...";
}

// Helper function to format a single log entry with player name (for markdown)
function formatGameLogEntry(entry: GameLogEntry): string {
  const typeEmoji = getEntryEmoji(entry.type);
  return `${typeEmoji} ${entry.playerName}: ${entry.content}`;
}

// Helper function to get emoji for entry type
function getEntryEmoji(type: GameLogEntryType): string {
  switch (type) {
    case "dice":
      return "🎲";
    case "movement":
      return "🚶";
    case "boat":
      return "⛵";
    case "exploration":
      return "🔍";
    case "combat":
      return "⚔️";
    case "harvest":
      return "🌾";
    case "assessment":
      return "🤔";
    case "event":
      return "📜";
    case "system":
      return "⚙️";
    case "victory":
      return "👑";
    case "thinking":
      return "💭";
    default:
      return "📝";
  }
}

// Helper function to get color for entry type
function getEntryColor(type: GameLogEntryType): string {
  switch (type) {
    case "system":
      return "#2c3e50";
    case "assessment":
      return "#0c5460";
    case "movement":
    case "boat":
      return "#28a745";
    case "combat":
      return "#dc3545";
    case "harvest":
      return "#6f42c1";
    case "event":
      return "#fd7e14";
    case "exploration":
      return "#17a2b8";
    case "dice":
      return "#ffc107";
    case "victory":
      return "#e83e8c";
    case "thinking":
      return "#6c757d";
    default:
      return "#495057";
  }
}

export const GameLog: React.FC<GameLogProps> = ({ gameLog, isVisible, players = [] }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  if (!isVisible || gameLog.length === 0) {
    return null;
  }

  // Filter game log entries based on selected player
  const filteredGameLog = selectedPlayer ? gameLog.filter((entry) => entry.playerName === selectedPlayer) : gameLog;

  const convertToMarkdown = (): string => {
    let markdown = "# Game Log\n\n";
    // Filter out thinking entries from markdown export
    const filteredGameLogForExport = filteredGameLog.filter((entry) => entry.type !== "thinking");
    const groupedEntries = groupGameLogEntriesByRound(filteredGameLogForExport);

    groupedEntries.forEach(({ round, entries }) => {
      markdown += `## Round ${round}\n\n`;
      entries.forEach((entry) => {
        const formattedEntry = formatGameLogEntry(entry);
        markdown += `- ${formattedEntry}\n`;
      });
      markdown += "\n";
    });

    return markdown;
  };

  const handleCopy = async () => {
    try {
      const markdown = convertToMarkdown();
      await navigator.clipboard.writeText(markdown);
      alert("Game log copied to clipboard as markdown!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const markdown = convertToMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `game-log-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buttonStyle = {
    padding: "6px 8px",
    margin: "0 2px",
    backgroundColor: "transparent",
    color: "#6c757d",
    border: "1px solid #dee2e6",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  };

  const containerStyle = {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "8px",
    border: "1px solid #ddd",
    maxHeight: isMaximized ? "80vh" : "400px",
    maxWidth: isMaximized ? undefined : "1000px",
    overflowY: "auto" as const,
    position: isMaximized ? ("fixed" as const) : ("relative" as const),
    top: isMaximized ? "10vh" : "auto",
    left: isMaximized ? "10vw" : "auto",
    width: isMaximized ? "80vw" : "auto",
    zIndex: isMaximized ? 1000 : "auto",
  };

  const groupedEntries = groupGameLogEntriesByRoundAndPlayer(filteredGameLog);

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{ margin: 0, color: "#2c3e50" }}>📋 Game Log</h3>
          {players.length > 0 && (
            <PlayerFilter players={players} selectedPlayer={selectedPlayer} onPlayerFilterChange={setSelectedPlayer} />
          )}
        </div>
        <div>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: isMaximized ? "#f8f9fa" : "transparent",
            }}
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isMaximized ? "#f8f9fa" : "transparent")}
          >
            {isMaximized ? <LuMinimize2 size={16} /> : <LuMaximize2 size={16} />}
          </button>
          <button
            style={buttonStyle}
            onClick={handleCopy}
            title="Copy as Markdown"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LuCopy size={16} />
          </button>
          <button
            style={buttonStyle}
            onClick={handleDownload}
            title="Download as Markdown"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LuDownload size={16} />
          </button>
        </div>
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.4",
        }}
      >
        {groupedEntries.map(({ round, playerGroups }) => (
          <div
            key={round}
            style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                color: "#2c3e50",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              🎲 Round {round}
            </div>
            {playerGroups.map(({ playerName, entries }) => (
              <div key={playerName} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#495057",
                    marginBottom: "4px",
                    fontSize: "13px",
                  }}
                >
                  {playerName}:
                </div>
                {entries.map((entry, entryIndex) => {
                  const entryKey = round * 10000 + entryIndex; // Create unique key for each entry
                  const isThinking = entry.type === "thinking";
                  const isExpanded = expandedThinking.has(entryKey);

                  const toggleExpanded = () => {
                    const newExpanded = new Set(expandedThinking);
                    if (isExpanded) {
                      newExpanded.delete(entryKey);
                    } else {
                      newExpanded.add(entryKey);
                    }
                    setExpandedThinking(newExpanded);
                  };

                  if (isThinking) {
                    const preview = getThinkingPreview(entry.content);
                    const typeEmoji = getEntryEmoji(entry.type);
                    return (
                      <div
                        key={entryIndex}
                        style={{
                          marginBottom: "2px",
                          marginLeft: "16px",
                          color: getEntryColor(entry.type),
                          fontStyle: "italic",
                          whiteSpace: isExpanded ? "pre-wrap" : "normal",
                        }}
                      >
                        <span>
                          {typeEmoji} {isExpanded ? entry.content : preview}
                        </span>
                        {entry.content.split(" ").length > 8 && (
                          <button
                            onClick={toggleExpanded}
                            style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              fontSize: "10px",
                              backgroundColor: "transparent",
                              color: "#6c757d",
                              border: "1px solid #6c757d",
                              borderRadius: "3px",
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "less" : "more"}
                          </button>
                        )}
                      </div>
                    );
                  } else {
                    const formattedEntry = formatGameLogEntryContent(entry);
                    return (
                      <div
                        key={entryIndex}
                        style={{
                          marginBottom: "2px",
                          marginLeft: "16px",
                          color: getEntryColor(entry.type),
                          fontStyle: entry.type === "assessment" ? "italic" : "normal",
                          fontWeight: entry.type === "system" ? "bold" : "normal",
                        }}
                      >
                        {formattedEntry}
                      </div>
                    );
                  }
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
