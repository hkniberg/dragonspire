import type { Player } from "../lib/types";

// Ocean zones around the island
export const oceanZones = [
  { id: 0, label: "A", name: "Northwest Sea", position: "northwest" },
  { id: 1, label: "B", name: "Northeast Sea", position: "northeast" },
  { id: 2, label: "C", name: "Southwest Sea", position: "southwest" },
  { id: 3, label: "D", name: "Southeast Sea", position: "southeast" },
];

// Function to get boat image path based on player ID
const getBoatImagePath = (playerId: number): string => {
  const boatColors = ["red", "blue", "green", "orange"];
  const colorIndex = (playerId - 1) % boatColors.length;
  return `/boats/boat-${boatColors[colorIndex]}.png`;
};

// Function to generate boat positions for multiple boats in the same zone
const getBoatPosition = (zonePosition: string, boatIndex: number, boatId: number): { x: number; y: number } => {
  // Small random variation for natural look (based on boat ID)
  const seed = boatId * 1337;
  const randomX = (((seed * 9301) % 233280) / 233280) * 10 - 5; // ±5px variation
  const randomY = (((seed * 7919) % 233280) / 233280) * 10 - 5; // ±5px variation

  // Base spacing between boats - calculated to fit 5x5 grid in 640px ocean tile
  const spacing = 135; // 540px usable space ÷ 4 intervals = 135px

  // Calculate grid position based on boat index using 5x5 grid
  const getGridPosition = (index: number, zonePos: string): { gridX: number; gridY: number } => {
    if (index === 0) {
      // Corner positions
      switch (zonePos) {
        case "northwest":
          return { gridX: 0, gridY: 0 };
        case "northeast":
          return { gridX: 0, gridY: 4 };
        case "southwest":
          return { gridX: 4, gridY: 0 };
        case "southeast":
          return { gridX: 4, gridY: 4 };
      }
    }

    // Calculate steps: odd indices use direction 1, even indices use direction 2
    const steps = Math.ceil(index / 2);
    const isDirection1 = index % 2 === 1;

    switch (zonePos) {
      case "northwest":
        // Direction 1: right (increase x), Direction 2: down (increase y)
        if (isDirection1) {
          return { gridX: steps, gridY: 0 };
        } else {
          return { gridX: 0, gridY: steps };
        }

      case "northeast":
        // Direction 1: left (decrease y), Direction 2: down (increase x)
        if (isDirection1) {
          return { gridX: 0, gridY: 4 - steps };
        } else {
          return { gridX: steps, gridY: 4 };
        }

      case "southwest":
        // Direction 1: up (decrease x), Direction 2: right (increase y)
        if (isDirection1) {
          return { gridX: 4 - steps, gridY: 0 };
        } else {
          return { gridX: 4, gridY: steps };
        }

      case "southeast":
        // Direction 1: left (decrease y), Direction 2: up (decrease x)
        if (isDirection1) {
          return { gridX: 4, gridY: 4 - steps };
        } else {
          return { gridX: 4 - steps, gridY: 4 };
        }
    }

    return { gridX: 0, gridY: 0 }; // fallback
  };

  const { gridX, gridY } = getGridPosition(boatIndex, zonePosition);

  // Convert grid position to pixel offset from corner
  let baseX = 0;
  let baseY = 0;

  switch (zonePosition) {
    case "northwest":
      baseX = gridX * spacing;
      baseY = gridY * spacing;
      break;

    case "northeast":
      baseX = (gridY - 4) * spacing; // gridY: 4->0, 3->-80, 2->-160, etc.
      baseY = gridX * spacing; // gridX: 0->0, 1->80, 2->160, etc.
      break;

    case "southwest":
      baseX = gridY * spacing; // gridY: 0->0, 1->80, 2->160, etc.
      baseY = (gridX - 4) * spacing; // gridX: 4->0, 3->-80, 2->-160, etc.
      break;

    case "southeast":
      baseX = (gridY - 4) * spacing; // gridY: 4->0, 3->-80, 2->-160, etc.
      baseY = (gridX - 4) * spacing; // gridX: 4->0, 3->-80, 2->-160, etc.
      break;
  }

  return {
    x: baseX + randomX,
    y: baseY + randomY,
  };
};

export const OceanZoneComponent = ({
  zone,
  players,
  getPlayerColor,
}: {
  zone: (typeof oceanZones)[0];
  players: Player[];
  getPlayerColor?: (playerName: string) => {
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
  const boatsInZone = players
    .flatMap((player) =>
      player.boats
        .filter((boat) => zonePositionMap[zone.position]?.includes(boat.position))
        .map((boat) => ({ ...boat, player })),
    )
    .sort((a, b) => {
      // Sort first by player name, then by boat ID for consistent positioning
      if (a.player.name !== b.player.name) {
        return a.player.name.localeCompare(b.player.name);
      }
      return a.id - b.id;
    });

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
            // Ocean tile is 640x640, we want 5x5 grid centered with 135px spacing
            // Grid starts at 50px from edge, accounting for 96px boat size
            const gridStart = 50;
            const boatSize = 96;
            const halfBoat = boatSize / 2;

            switch (zonePosition) {
              case "northwest":
                // Grid position (0,0) - start at top-left of grid
                return {
                  top: `${gridStart - halfBoat}px`,
                  left: `${gridStart - halfBoat}px`,
                };
              case "northeast":
                // Grid position (0,4) - start at top-right of grid
                return {
                  top: `${gridStart - halfBoat}px`,
                  left: `${gridStart + 4 * 135 - halfBoat}px`,
                };
              case "southwest":
                // Grid position (4,0) - start at bottom-left of grid
                return {
                  top: `${gridStart + 4 * 135 - halfBoat}px`,
                  left: `${gridStart - halfBoat}px`,
                };
              case "southeast":
                // Grid position (4,4) - start at bottom-right of grid
                return {
                  top: `${gridStart + 4 * 135 - halfBoat}px`,
                  left: `${gridStart + 4 * 135 - halfBoat}px`,
                };
              default:
                return { top: `${gridStart}px`, left: `${gridStart}px` };
            }
          };

          const cornerStyle = getCornerPosition(zone.position);

          return (
            <div
              style={{
                position: "absolute",
                ...cornerStyle,
                zIndex: 10,
              }}
            >
              {boatsInZone.map((boatWithPlayer, boatIndex) => {
                const playerColors = getPlayerColor
                  ? getPlayerColor(boatWithPlayer.player.name)
                  : { main: "#666", light: "#ccc", dark: "#333" };
                const offset = getBoatPosition(zone.position, boatIndex, boatWithPlayer.id);

                // Find player index for boat image
                const playerIndex = players.findIndex((p) => p.name === boatWithPlayer.player.name);

                return (
                  <div
                    key={`${boatWithPlayer.player.name}-${boatWithPlayer.id}`}
                    style={{
                      position: "absolute",
                      backgroundColor: "transparent",
                      borderRadius: "12px",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "bold",
                      minWidth: "60px",
                      transform: `translate(${offset.x}px, ${offset.y}px)`,
                    }}
                    title={`Boat ${boatWithPlayer.id} (${boatWithPlayer.player.name})`}
                  >
                    <img
                      src={getBoatImagePath(playerIndex)}
                      alt={`Boat ${boatWithPlayer.id}`}
                      style={{
                        width: "96px",
                        height: "96px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })()}
    </div>
  );
};
