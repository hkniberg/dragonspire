import ReactMarkdown from "react-markdown";
import type { Encounter } from "../../content/encounterCards";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  getTierBackgroundColor,
} from "../../lib/uiConstants";

interface EncounterCardProps {
  encounter: Encounter;
  showDescription?: boolean;
}

export const EncounterCard = ({
  encounter,
  showDescription = false,
}: EncounterCardProps) => {
  const backgroundColor = getTierBackgroundColor(encounter.tier);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: "white",
        borderRadius: "6px",
        border: "2px solid #2E8B57",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px",
        gap: "0px",
      }}
      title={`Encounter: ${encounter.name} (Tier ${encounter.tier})`}
    >
      <div
        style={{
          width: "152px",
          height: `${showDescription ? "100px" : "155px"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={`/encounters/${encounter.id}.png`}
          alt={encounter.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
      </div>

      <div
        style={{
          fontSize: "17px",
          fontWeight: "bold",
          color: "#333",
          textAlign: "center",
          lineHeight: "1",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
          backgroundColor,
          borderRadius: "4px",
          padding: "2px 4px",
          flexShrink: 0,
        }}
      >
        {encounter.name}
      </div>

      {showDescription && (
        <div
          style={{
            fontSize: "12px",
            textAlign: "center",
            lineHeight: "1.3",
            width: "100%",
            padding: "4px 2px",
            color: "#666",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              overflow: "hidden",
              flex: 1,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => (
                  <strong style={{ fontWeight: "bold", color: "#333" }}>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em style={{ fontStyle: "italic", color: "#555" }}>
                    {children}
                  </em>
                ),
                code: ({ children }) => (
                  <code
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "1px 3px",
                      borderRadius: "2px",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "#d63384",
                    }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {encounter.description}
            </ReactMarkdown>
          </div>
          {encounter.follower && (
            <div
              style={{
                fontSize: "8px",
                backgroundColor: "#28a745",
                color: "white",
                padding: "1px 3px",
                borderRadius: "2px",
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              Follower
            </div>
          )}
        </div>
      )}
    </div>
  );
};
