import Head from "next/head";
import Link from "next/link";

export default function PrintPage() {
  return (
    <>
      <Head>
        <title>Print - Lords of Doomspire</title>
        <meta name="description" content="Print game components for Lords of Doomspire" />
      </Head>

      <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
        <h1>Print Game Components</h1>
        <p>Print various components for Lords of Doomspire board game.</p>

        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/print/PrintTiles"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#4CAF50",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Tiles
          </Link>

          <Link
            href="/print/PrintCards"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#2196F3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Cards
          </Link>

          <Link
            href="/print/PrintCardsCompact"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#9C27B0",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Compact Cards
          </Link>

          <Link
            href="/tracks"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#FF9800",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Player Tracks
          </Link>

          <Link
            href="/castleBoard"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#795548",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Castle Board
          </Link>

          <Link
            href="/specialTileLabels"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "#607D8B",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1.1rem",
              marginRight: "1rem",
              marginBottom: "1rem",
            }}
          >
            Print Special Tile Labels
          </Link>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/"
            style={{
              color: "#666",
              textDecoration: "none",
            }}
          >
            ← Back to Game
          </Link>
        </div>
      </div>
    </>
  );
}
