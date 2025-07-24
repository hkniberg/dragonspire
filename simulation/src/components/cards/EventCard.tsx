import type { EventCard as EventCardType } from "../../content/eventCards";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  getTierBackgroundColor,
} from "../../lib/uiConstants";

interface EventCardProps {
  event: EventCardType;
  showDescription?: boolean;
}

export const EventCard = ({
  event,
  showDescription = false,
}: EventCardProps) => {
  const backgroundColor = getTierBackgroundColor(event.tier);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: "white",
        borderRadius: "6px",
        border: "2px solid #4B0082",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px",
        gap: "0px",
      }}
      title={`Event: ${event.name} (Tier ${event.tier})`}
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
          src={`/events/${event.id}.png`}
          alt={event.name}
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
        {event.name}
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
          <div style={{ marginBottom: "4px", flexShrink: 0 }}>
            Tier {event.tier}
          </div>
          <div
            style={{
              fontSize: "10px",
              overflow: "hidden",
              flex: 1,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            {event.description}
          </div>
        </div>
      )}
    </div>
  );
};
