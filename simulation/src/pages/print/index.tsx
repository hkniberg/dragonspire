import Head from "next/head";
import Link from "next/link";

export default function PrintPage() {
  return (
    <>
      <Head>
        <title>Print - Lords of Doomspire</title>
        <meta
          name="description"
          content="Print game components for Lords of Doomspire"
        />
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
            }}
          >
            Print Tiles
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
