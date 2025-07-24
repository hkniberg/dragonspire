import ReactMarkdown from "react-markdown";
import type { TreasureCard as TreasureCardType } from "../../content/treasureCards";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  getTierBackgroundColor,
} from "../../lib/uiConstants";

interface TreasureCardProps {
  treasure: TreasureCardType;
  showDescription?: boolean;
}

export const TreasureCard = ({
  treasure,
  showDescription = false,
}: TreasureCardProps) => {
  const backgroundColor = getTierBackgroundColor(treasure.tier);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: "white",
        borderRadius: "6px",
        border: "2px solid #8B4513",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px",
        gap: "0px",
      }}
      title={`Treasure: ${treasure.name}`}
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
          src={`/treasures/${treasure.id}.png`}
          alt={treasure.name}
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
        {treasure.name}
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
              {treasure.description}
            </ReactMarkdown>
          </div>
          <div
            style={{
              fontSize: "8px",
              backgroundColor: "#ff6600",
              color: "white",
              padding: "1px 3px",
              borderRadius: "2px",
              marginTop: "2px",
              flexShrink: 0,
            }}
          >
            Item
          </div>
        </div>
      )}
    </div>
  );
};
