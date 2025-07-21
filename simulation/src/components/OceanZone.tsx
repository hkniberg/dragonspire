import type { Player } from "../lib/types";

// Ocean zones around the island
export const oceanZones = [
  { id: 0, label: "A", name: "Northwest Sea", position: "northwest" },
  { id: 1, label: "B", name: "Northeast Sea", position: "northeast" },
  { id: 2, label: "C", name: "Southwest Sea", position: "southwest" },
  { id: 3, label: "D", name: "Southeast Sea", position: "southeast" },
];

export const OceanZoneComponent = ({
  zone,
  players,
  getPlayerColor,
}: {
  zone: (typeof oceanZones)[0];
  players: Player[];
  getPlayerColor?: (playerId: number) => {
    main: string;
    light: string;
    dark: string;
  };
}) => {
  // Map zone positions to boat positions
  const zonePositionMap: Record<string, string[]> = {
    northwest: ["nw"],
    northeast: ["ne"],
    southwest: ["sw"],
    southeast: ["se"],
  };

  // Find boats in this zone
  const boatsInZone = players.flatMap((player) =>
    player.boats
      .filter((boat) => zonePositionMap[zone.position]?.includes(boat.position))
      .map((boat) => ({ ...boat, player }))
  );

  return (
    <div
      style={{
        backgroundColor: "#87CEEB", // Sky blue for ocean
        color: "#000080", // Dark blue text
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "640px",
        width: "640px",
        fontSize: "32px",
        fontWeight: "bold",
        border: "2px solid #4682B4",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Discrete wave illustrations */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          fontSize: "24px",
          color: "rgba(255, 255, 255, 0.8)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: "25%",
          fontSize: "20px",
          color: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "15%",
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.9)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "70%",
          right: "30%",
          fontSize: "22px",
          color: "rgba(255, 255, 255, 0.6)",
          pointerEvents: "none",
        }}
      >
        〜〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "15%",
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "30%",
          fontSize: "20px",
          color: "rgba(255, 255, 255, 0.8)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.6)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "60%",
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.8)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "10%",
          fontSize: "20px",
          color: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "65%",
          left: "40%",
          fontSize: "24px",
          color: "rgba(255, 255, 255, 0.5)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "80%",
          left: "10%",
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.8)",
          pointerEvents: "none",
        }}
      >
        〜〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "70%",
          fontSize: "22px",
          color: "rgba(255, 255, 255, 0.6)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "40%",
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.9)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "75%",
          right: "20%",
          fontSize: "20px",
          color: "rgba(255, 255, 255, 0.7)",
          pointerEvents: "none",
        }}
      >
        〜
      </div>
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "65%",
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.8)",
          pointerEvents: "none",
        }}
      >
        〜〜
      </div>

      {boatsInZone.length > 0 &&
        (() => {
          // Determine corner position based on zone
          const getCornerPosition = (zonePosition: string) => {
            switch (zonePosition) {
              case "northwest":
                return { top: "20px", left: "20px" };
              case "northeast":
                return { top: "20px", right: "20px" };
              case "southwest":
                return { bottom: "20px", left: "20px" };
              case "southeast":
                return { bottom: "20px", right: "20px" };
              default:
                return { top: "20px", left: "20px" };
            }
          };

          const cornerStyle = getCornerPosition(zone.position);

          return (
            <div
              style={{
                position: "absolute",
                ...cornerStyle,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                zIndex: 10,
              }}
            >
              {boatsInZone.map((boatWithPlayer) => {
                const playerColors = getPlayerColor
                  ? getPlayerColor(boatWithPlayer.player.id)
                  : { main: "#666", light: "#ccc", dark: "#333" };
                return (
                  <div
                    key={`${boatWithPlayer.player.id}-${boatWithPlayer.id}`}
                    style={{
                      backgroundColor: playerColors.main,
                      color: "white",
                      borderRadius: "12px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "bold",
                      border: "2px solid white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      minWidth: "60px",
                    }}
                    title={`Boat ${boatWithPlayer.id} (${boatWithPlayer.player.name})`}
                  >
                    🚢
                  </div>
                );
              })}
            </div>
          );
        })()}
    </div>
  );
};
