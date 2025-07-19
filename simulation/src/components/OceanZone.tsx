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
}: {
  zone: (typeof oceanZones)[0];
  players: Player[];
}) => {
  // For now, since boats don't have zone mapping, show empty boats
  const boatsInZone: Player[] = [];

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

      {boatsInZone.length > 0 && (
        <div style={{ fontSize: "32px", marginTop: "20px", zIndex: 1 }}>
          🛥️ {boatsInZone.length}
        </div>
      )}
    </div>
  );
};
