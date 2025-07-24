import type { TreasureCard as TreasureCardType } from "../../content/treasureCards";
import { getTierBackgroundColor } from "../../lib/uiConstants";

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
        width: "160px",
        height: "190px",
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
        }}
      >
        {treasure.name}
      </div>

      {showDescription && (
        <div
          style={{
            fontSize: "12px",
            textAlign: "center",
            lineHeight: "1.1",
            width: "100%",
            padding: "2px",
            color: "#666",
            overflow: "hidden",
            height: "47px",
          }}
        >
          <div style={{ marginBottom: "1px" }}>Carryable</div>
          <div
            style={{
              fontSize: "10px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {treasure.description}
          </div>
        </div>
      )}
    </div>
  );
};
