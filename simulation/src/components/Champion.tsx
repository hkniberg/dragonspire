import type { Champion } from "../lib/types";

export const ChampionComponent = ({
  champion,
  getPlayerColor,
}: {
  champion: Champion;
  getPlayerColor: (playerId: number) => {
    main: string;
    light: string;
    dark: string;
  };
}) => {
  const playerColors = getPlayerColor(champion.playerId);

  return (
    <div
      style={{
        backgroundColor: playerColors.main,
        color: "white",
        borderRadius: "50%",
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "bold",
        border: "3px solid white",
        boxShadow: "0 3px 6px rgba(0,0,0,0.4)",
        position: "relative",
      }}
      title={`Champion ${champion.id} (Player ${champion.playerId})`}
    >
      <img
        src="/knights/knight.png"
        alt="Knight"
        style={{
          width: "48px",
          height: "48px",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
          pointerEvents: "none",
        }}
      >
        {champion.id}
      </div>
    </div>
  );
};
