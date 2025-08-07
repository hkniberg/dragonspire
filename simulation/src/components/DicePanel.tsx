// Lords of Doomspire Dice Panel Component

import React from "react";
import DiceComponent from "./DiceComponent";

interface DicePanelProps {
  diceValues: number[]; // Array of dice values rolled
  usedDice: number[]; // Indices of dice that have been used
  selectedDieIndex: number | null; // Index of currently selected die
  onDieSelect: (index: number) => void; // Callback when a die is selected
  isRolling?: boolean; // Whether to show rolling animation
}

const DicePanel: React.FC<DicePanelProps> = ({
  diceValues,
  usedDice,
  selectedDieIndex,
  onDieSelect,
  isRolling = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        minWidth: "fit-content",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          color: "#2c3e50",
        }}
      >
        {isRolling ? "🎲 Rolling..." : "🎲 Your Dice"}
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {diceValues.map((value, index) => (
          <DiceComponent
            key={index}
            value={value}
            isUsed={usedDice.includes(index)}
            isSelected={selectedDieIndex === index}
            isRolling={isRolling}
            onSelect={() => onDieSelect(index)}
            size={80}
          />
        ))}
      </div>
    </div>
  );
};

export default DicePanel;
