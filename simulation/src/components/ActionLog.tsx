import React, { useState } from "react";
import { LuCopy, LuDownload, LuMaximize2, LuMinimize2 } from "react-icons/lu";
import {
  formatActionLogEntry,
  formatGameLogEntry,
  groupGameLogEntriesByRound,
} from "../lib/actionLogFormatter";
import { GameLogEntry } from "../players/Player";

interface ActionLogProps {
  actionLog: any[] | GameLogEntry[]; // Support both old and new formats
  isVisible: boolean;
}

// Type guard to check if we have new GameLogEntry format
function isGameLogEntry(entry: any): entry is GameLogEntry {
  return (
    entry &&
    typeof entry === "object" &&
    "round" in entry &&
    "playerId" in entry &&
    "playerName" in entry &&
    "type" in entry &&
    "content" in entry
  );
}

export const ActionLog: React.FC<ActionLogProps> = ({
  actionLog,
  isVisible,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isVisible || actionLog.length === 0) {
    return null;
  }

  // Check if we have the new GameLogEntry format
  const isNewFormat = actionLog.length > 0 && isGameLogEntry(actionLog[0]);

  const convertToMarkdown = (): string => {
    let markdown = "# Action Log\n\n";

    if (isNewFormat) {
      // Handle new GameLogEntry format
      const gameLog = actionLog as GameLogEntry[];
      const groupedEntries = groupGameLogEntriesByRound(gameLog);

      groupedEntries.forEach(({ round, entries }) => {
        markdown += `## Round ${round}\n\n`;
        entries.forEach((entry) => {
          const formattedEntry = formatGameLogEntry(entry);
          markdown += `- ${formattedEntry}\n`;
        });
        markdown += "\n";
      });
    } else {
      // Handle old ActionLogEntry format
      actionLog.forEach((turn, index) => {
        const messages = formatActionLogEntry(turn);
        markdown += `## Turn ${index + 1}\n\n`;

        messages.forEach((message) => {
          if (message.includes("---")) {
            markdown += `### ${message.replace(/---/g, "").trim()}\n\n`;
          } else if (message.includes("Player Diary:")) {
            markdown += `> ${message}\n\n`;
          } else {
            markdown += `- ${message}\n`;
          }
        });

        markdown += "\n";
      });
    }

    return markdown;
  };

  const handleCopy = async () => {
    try {
      const markdown = convertToMarkdown();
      await navigator.clipboard.writeText(markdown);
      alert("Action log copied to clipboard as markdown!");
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
    link.download = `action-log-${new Date().toISOString().split("T")[0]}.md`;
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
    overflowY: "auto" as const,
    position: isMaximized ? ("fixed" as const) : ("relative" as const),
    top: isMaximized ? "10vh" : "auto",
    left: isMaximized ? "10vw" : "auto",
    width: isMaximized ? "80vw" : "auto",
    zIndex: isMaximized ? 1000 : "auto",
  };

  const renderNewFormatLog = () => {
    const gameLog = actionLog as GameLogEntry[];
    const groupedEntries = groupGameLogEntriesByRound(gameLog);

    return groupedEntries.map(({ round, entries }) => (
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
        {entries.map((entry, entryIndex) => {
          const formattedEntry = formatGameLogEntry(entry);

          return (
            <div
              key={entryIndex}
              style={{
                marginBottom: "2px",
                color: getEntryColor(entry.type),
                fontStyle: entry.type === "assessment" ? "italic" : "normal",
                fontWeight: entry.type === "system" ? "bold" : "normal",
              }}
            >
              {formattedEntry}
            </div>
          );
        })}
      </div>
    ));
  };

  const getEntryColor = (type: string): string => {
    switch (type) {
      case "system":
        return "#2c3e50";
      case "assessment":
        return "#0c5460";
      case "movement":
        return "#28a745";
      case "combat":
        return "#dc3545";
      case "harvest":
        return "#6f42c1";
      case "event":
        return "#fd7e14";
      default:
        return "#495057";
    }
  };

  const renderOldFormatLog = () => {
    return actionLog.map((turn, index) => {
      const messages = formatActionLogEntry(turn);

      return (
        <div
          key={index}
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px solid #e9ecef",
          }}
        >
          {messages.map((message, msgIndex) => (
            <div
              key={msgIndex}
              style={{
                marginBottom: "2px",
                color: message.includes("---")
                  ? "#2c3e50"
                  : message.includes("Player Diary:")
                  ? "#0c5460"
                  : message.includes("Dice rolled:")
                  ? "#495057"
                  : message.includes("Total harvested:")
                  ? "#6f42c1"
                  : "#28a745", // Default green for action results
                fontStyle: message.includes("Player Diary:")
                  ? "italic"
                  : "normal",
                fontWeight: message.includes("---") ? "bold" : "normal",
              }}
            >
              {message}
            </div>
          ))}
        </div>
      );
    });
  };

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
        <h3 style={{ margin: 0, color: "#2c3e50" }}>📋 Game Log</h3>
        <div>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: isMaximized ? "#f8f9fa" : "transparent",
            }}
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8f9fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = isMaximized
                ? "#f8f9fa"
                : "transparent")
            }
          >
            {isMaximized ? (
              <LuMinimize2 size={16} />
            ) : (
              <LuMaximize2 size={16} />
            )}
          </button>
          <button
            style={buttonStyle}
            onClick={handleCopy}
            title="Copy as Markdown"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8f9fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <LuCopy size={16} />
          </button>
          <button
            style={buttonStyle}
            onClick={handleDownload}
            title="Download as Markdown"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f8f9fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
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
        {isNewFormat ? renderNewFormatLog() : renderOldFormatLog()}
      </div>
    </div>
  );
};
