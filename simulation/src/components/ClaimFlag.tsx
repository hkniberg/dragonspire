interface ClaimFlagProps {
  playerName: string;
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
  isBlockaded?: boolean;
}

export const ClaimFlag = ({ playerName, getPlayerColor, isBlockaded = false }: ClaimFlagProps) => {
  const playerColors = getPlayerColor(playerName);

  return (
    <div
      style={{
        width: "30px",
        height: "24px",
        display: "flex",
        alignItems: "flex-start",
        position: "relative",
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
      {/* Cross-out overlay when blockaded */}
      {isBlockaded && (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "3px",
              backgroundColor: "#FF0000",
              transform: "rotate(-45deg)",
              boxShadow: "0 0 2px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
};
