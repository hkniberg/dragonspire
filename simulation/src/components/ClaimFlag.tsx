interface ClaimFlagProps {
  playerName: string;
  getPlayerColor: (playerName: string) => {
    main: string;
    light: string;
    dark: string;
  };
  isBlockaded?: boolean;
  blockadingPlayer?: string;
  isProtected?: boolean;
}

export const ClaimFlag = ({
  playerName,
  getPlayerColor,
  isBlockaded = false,
  blockadingPlayer,
  isProtected = false,
}: ClaimFlagProps) => {
  const playerColors = getPlayerColor(playerName);
  const blockadingColors = blockadingPlayer ? getPlayerColor(blockadingPlayer) : null;

  if (isBlockaded) {
    return (
      <div
        style={{
          width: "40px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Rotated flag container */}
        <div
          style={{
            transform: "rotate(90deg)",
            transformOrigin: "center",
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
        {/* Blockade indicator */}
        <div
          style={{
            marginLeft: "6px",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: blockadingColors?.main || "#FF0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            fontWeight: "bold",
            color: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          BLOCKADE
        </div>
        {/* Protection indicator */}
        {isProtected && (
          <div
            style={{
              marginLeft: "4px",
              padding: "2px 4px",
              borderRadius: "4px",
              backgroundColor: playerColors.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8px",
              fontWeight: "bold",
              color: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
            title="This claim is protected by adjacent knights or warships"
          >
            P
          </div>
        )}
      </div>
    );
  }

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
      {/* Protection indicator */}
      {isProtected && (
        <div
          style={{
            marginLeft: "4px",
            padding: "2px 4px",
            borderRadius: "4px",
            backgroundColor: playerColors.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            fontWeight: "bold",
            color: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
          }}
          title="This claim is protected by adjacent knights or warships"
        >
          P
        </div>
      )}
    </div>
  );
};
