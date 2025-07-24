import ReactMarkdown from "react-markdown";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  getBiomeDisplayName,
  getTierBackgroundColor,
  getTierDisplayText,
  getTierSolidColor,
} from "../../lib/uiConstants";

// Helper function to format monster resources as emojis
const formatResources = (
  resources: Record<string, number> | undefined
): string => {
  if (!resources) return "None";

  const resourceSymbols = {
    food: "🌾",
    wood: "🪵",
    ore: "🪨",
    gold: "💰",
  };

  const formatted = Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => {
      const symbol = resourceSymbols[type as keyof typeof resourceSymbols];
      return amount > 1 ? `${amount}${symbol}` : symbol;
    })
    .join(" ");

  return formatted || "None";
};

// Helper functions to format content for each card type
export const formatMonsterContent = (monster: any): string => {
  return `**Might:** ${monster.might}  
**Fame:** ${monster.fame || 0}  
**Loot:** ${formatResources(monster.resources)}`;
};

export const formatEncounterContent = (encounter: any): string => {
  return encounter.description;
};

export const formatEventContent = (event: any): string => {
  return event.description;
};

export const formatTreasureContent = (treasure: any): string => {
  return treasure.description;
};

// Helper function to get border color for each card type
export const getBorderColor = (cardType: string): string => {
  switch (cardType) {
    case "monster":
      return "#8B0000"; // dark red
    case "encounter":
      return "#2E8B57"; // green
    case "event":
      return "#4B0082"; // purple
    case "treasure":
      return "#8B4513"; // brown
    default:
      return "#666666"; // gray
  }
};

interface AdventureCardProps {
  upsideDown?: boolean;
  compactMode?: boolean;
  tier?: number;
  biome?: string; // for backside
  borderColor: string;
  imageUrl?: string; // for frontside
  name?: string; // for frontside
  content?: string; // markdown string
  bottomTag?: string; // optional tag at bottom
  title?: string; // for tooltip
  contentFontSize?: string; // font size for content text
  printMode?: boolean; // disable shadows for print
}

export const AdventureCard = ({
  upsideDown = false,
  compactMode = false,
  tier,
  biome,
  borderColor,
  imageUrl,
  name,
  content,
  bottomTag,
  title,
  contentFontSize = "9px",
  printMode = false,
}: AdventureCardProps) => {
  const backgroundColor = getTierBackgroundColor(tier);

  // Backside view (like AdventureCardBackside)
  if (upsideDown) {
    return (
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundImage: biome ? `url(/biomes/${biome}.png)` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: biome ? "transparent" : backgroundColor,
          borderRadius: "6px",
          border: `2px solid ${borderColor}`,
          boxShadow: printMode ? "none" : "0 4px 8px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          position: "relative",
        }}
        title={
          title ||
          `Monster Card Back - ${
            biome ? getBiomeDisplayName(biome) : "Unknown"
          } (Tier ${tier || "?"})`
        }
      >
        {/* Semi-transparent overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            borderRadius: "4px",
          }}
        />
        <div
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#333",
            textAlign: "center",
            lineHeight: "1.2",
            textTransform: "uppercase",
            letterSpacing: "1px",
            position: "relative",
            zIndex: 1,
            textShadow: "1px 1px 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          ADVENTURE
        </div>
        {tier && (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: getTierSolidColor(tier),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
              position: "relative",
              zIndex: 1,
              boxShadow: printMode ? "none" : "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              {getTierDisplayText(tier)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Front side view
  const showContent = !compactMode && content;
  const imageHeight = showContent ? "100px" : compactMode ? "90px" : "155px";

  // Compact mode dimensions - smaller and more square
  const cardWidth = compactMode ? "110px" : CARD_WIDTH;
  const cardHeight = compactMode ? "125px" : CARD_HEIGHT;
  const imageWidth = compactMode ? "110px" : "152px";

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        backgroundColor: "white",
        borderRadius: "6px",
        border: `2px solid ${borderColor}`,
        boxShadow: printMode ? "none" : "0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px 4px 2px 4px",
        gap: "0px",
      }}
      title={title}
    >
      {/* Image */}
      <div
        style={{
          width: imageWidth,
          height: imageHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
          marginBottom: "3px",
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name || "Card"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
        )}
      </div>

      {/* Title */}
      {name && (
        <div
          style={{
            fontSize: compactMode ? "12px" : "17px",
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
            padding: compactMode ? "1px 2px" : "2px 4px",
            flexShrink: 0,
          }}
        >
          {name}
        </div>
      )}

      {/* Content */}
      {showContent && (
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
              fontSize: contentFontSize,
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
              {content}
            </ReactMarkdown>
          </div>

          {/* Bottom tag */}
          {bottomTag && (
            <div
              style={{
                fontSize: "8px",
                backgroundColor:
                  bottomTag === "Follower" ? "#28a745" : "#ff6600",
                color: "white",
                padding: "1px 3px",
                borderRadius: "2px",
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              {bottomTag}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
