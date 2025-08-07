// Lords of Doomspire Arrow Path Component

import React from "react";

interface Position {
  row: number;
  col: number;
}

interface ArrowPathProps {
  path: Position[]; // Array of positions in movement order
  playerColor: string; // Color for the arrows
  tileSize: number; // Size of each tile in pixels
  boardOffset: { x: number; y: number }; // Offset of the board container
}

const ArrowPath: React.FC<ArrowPathProps> = ({ path, playerColor, tileSize, boardOffset }) => {
  if (path.length < 2) {
    return null; // Need at least 2 positions to draw arrows
  }

  // Calculate tile center coordinates
  const getTileCenter = (pos: Position) => ({
    x: pos.col * tileSize + tileSize / 2 + boardOffset.x,
    y: pos.row * tileSize + tileSize / 2 + boardOffset.y,
  });

  // Create arrow segments
  const segments = [];
  for (let i = 0; i < path.length - 1; i++) {
    const start = getTileCenter(path[i]);
    const end = getTileCenter(path[i + 1]);

    // Calculate arrow angle
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Calculate arrow length
    const length = Math.sqrt(dx * dx + dy * dy);

    segments.push({
      start,
      end,
      angle,
      length,
      key: `${i}-${path[i].row}-${path[i].col}-${path[i + 1].row}-${path[i + 1].col}`,
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // Don't interfere with tile clicks
        zIndex: 5, // Above tiles but below champions
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Define arrowhead marker */}
        <defs>
          <marker
            id={`arrowhead-${playerColor.replace("#", "")}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={playerColor} stroke={playerColor} strokeWidth="1" />
          </marker>
        </defs>

        {/* Draw arrow segments */}
        {segments.map((segment) => (
          <line
            key={segment.key}
            x1={segment.start.x}
            y1={segment.start.y}
            x2={segment.end.x}
            y2={segment.end.y}
            stroke={playerColor}
            strokeWidth="6"
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${playerColor.replace("#", "")})`}
            opacity="0.8"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}
          />
        ))}

        {/* Draw start position marker */}
        <circle
          cx={getTileCenter(path[0]).x}
          cy={getTileCenter(path[0]).y}
          r="8"
          fill={playerColor}
          stroke="white"
          strokeWidth="2"
          opacity="0.9"
        />

        {/* Draw end position marker */}
        {path.length > 1 && (
          <circle
            cx={getTileCenter(path[path.length - 1]).x}
            cy={getTileCenter(path[path.length - 1]).y}
            r="6"
            fill="white"
            stroke={playerColor}
            strokeWidth="3"
            opacity="0.9"
          />
        )}
      </svg>
    </div>
  );
};

export default ArrowPath;
