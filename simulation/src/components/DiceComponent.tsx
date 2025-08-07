// Lords of Doomspire Dice Component

import React, { useState, useEffect } from "react";

interface DiceComponentProps {
  value: number; // Final dice value (1-3)
  isUsed?: boolean; // Whether this die has been used
  isSelected?: boolean; // Whether this die is currently selected
  isRolling?: boolean; // Whether to show rolling animation
  onSelect?: () => void; // Callback when die is clicked
  size?: number; // Size in pixels
}

const DiceComponent: React.FC<DiceComponentProps> = ({
  value,
  isUsed = false,
  isSelected = false,
  isRolling = false,
  onSelect,
  size = 60,
}) => {
  const [displayValue, setDisplayValue] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rolling animation effect
  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 3) + 1);
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(value);
        setIsAnimating(false);
      }, 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(value);
      setIsAnimating(false);
    }
  }, [isRolling, value]);

  const getDiceSymbol = (val: number): string => {
    switch (val) {
      case 1:
        return "⚀";
      case 2:
        return "⚁";
      case 3:
        return "⚂";
      default:
        return "⚀";
    }
  };

  const getDiceColor = (): string => {
    if (isUsed) return "#999"; // Gray for used dice
    if (isSelected) return "#FFD700"; // Gold for selected
    return "#333"; // Dark gray for available
  };

  return (
    <div
      onClick={!isUsed && onSelect ? onSelect : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size,
        color: getDiceColor(),
        cursor: !isUsed && onSelect ? "pointer" : "default",
        transition: "all 0.2s ease",
        filter: isSelected ? "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))" : "none",
        transform: isSelected ? "scale(1.1)" : "scale(1)",
        opacity: isUsed ? 0.5 : 1,
        position: "relative",
        userSelect: "none",
        animation: isAnimating ? "diceShake 0.1s infinite" : "none",
      }}
      title={
        isUsed
          ? `Die value ${value} - Already used`
          : onSelect
            ? `Die value ${value} - Click to select`
            : `Die value ${value}`
      }
    >
      {getDiceSymbol(displayValue)}

      {isUsed && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: size * 0.3,
            color: "#666",
            fontWeight: "bold",
          }}
        >
          ✗
        </div>
      )}
    </div>
  );
};

// CSS for dice shake animation
const diceStyles = `
  @keyframes diceShake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
`;

// Inject styles into the document
if (typeof document !== "undefined") {
  // Check if styles are already injected
  if (!document.querySelector("#dice-styles")) {
    const styleElement = document.createElement("style");
    styleElement.id = "dice-styles";
    styleElement.textContent = diceStyles;
    document.head.appendChild(styleElement);
  }
}

export default DiceComponent;
