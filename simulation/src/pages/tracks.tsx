import Head from "next/head";
import { GameSettings } from "../lib/GameSettings";
import styles from "../styles/CheatSheet.module.css";

export default function Tracks() {
  const renderTrack = (trackName: string, maxValue: number, dragonPosition?: number) => {
    const values = Array.from({ length: maxValue + 1 }, (_, i) => i);

    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{trackName}</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "2px solid #654321",
            borderRadius: "8px",
            background: "white",
            width: "120px",
            margin: "0 auto",
          }}
        >
          {values.reverse().map((value) => (
            <div
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "8px 12px",
                borderBottom: value > 0 ? "1px solid #8b7355" : "none",
                background: value === dragonPosition ? "rgba(255, 215, 0, 0.3)" : "white",
                fontWeight: value === dragonPosition ? "bold" : "normal",
                fontSize: "16px",
                minHeight: "50px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#654321",
                }}
              >
                {value}
              </div>
              {value === dragonPosition && (
                <img
                  src="/icons/dragon.png"
                  alt="Dragon"
                  style={{
                    position: "absolute",
                    right: "8px",
                    width: "20px",
                    height: "20px",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Lords of Doomspire - Player Tracks</title>
        <meta name="description" content="Fame and Might tracking sheets for Lords of Doomspire board game" />
      </Head>

      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "80px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          {/* Fame Track */}
          <div>{renderTrack("FAME", 20, GameSettings.VICTORY_FAME_THRESHOLD)}</div>

          {/* Might Track */}
          <div>{renderTrack("MIGHT", 20, GameSettings.DRAGON_BASE_MIGHT)}</div>
        </div>
      </div>
    </>
  );
}
