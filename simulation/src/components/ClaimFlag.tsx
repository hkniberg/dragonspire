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
        width: "20px",
        height: "16px",
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      {/* Flag pole */}
      <div
        style={{
          width: "2px",
          height: "16px",
          backgroundColor: "#8B4513",
          marginRight: "1px",
        }}
      />
      {/* Flag */}
      <div
        style={{
          width: "0",
          height: "0",
          borderLeft: `12px solid ${playerColors.main}`,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
        }}
      />
    </div>
  );
};
