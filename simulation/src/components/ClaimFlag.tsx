interface ClaimFlagProps {
  playerId: number;
  getPlayerColor: (playerId: number) => {
    main: string;
    light: string;
    dark: string;
  };
}

export const ClaimFlag = ({ playerId, getPlayerColor }: ClaimFlagProps) => {
  const playerColors = getPlayerColor(playerId);

  return (
    <div
      style={{
        width: "30px",
        height: "24px",
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      {/* Flag pole */}
      <div
        style={{
          width: "3px",
          height: "24px",
          backgroundColor: "#8B4513",
          marginRight: "2px",
        }}
      />
      {/* Flag */}
      <div
        style={{
          width: "0",
          height: "0",
          borderLeft: `18px solid ${playerColors.main}`,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
        }}
      />
    </div>
  );
};
