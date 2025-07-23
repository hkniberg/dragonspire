import Head from "next/head";
import { TileComponent } from "../../components/Tile";
import { convertTileDefToTile, TileColors } from "../../lib/TileConverter";
import {
  HOME_TILE_TRIOS,
  TIER_1_TRIOS,
  TIER_2_TRIOS,
  TileDef,
  TileTrioDef,
} from "../../lib/content/tilesDefs";
import type { Champion, Player, Tile } from "../../lib/types";

// Simple function to create dummy props for TileComponent
const createDummyPlayer = (): Player => ({
  id: 1,
  name: "Print Player",
  fame: 0,
  might: 0,
  resources: { food: 0, wood: 0, ore: 0, gold: 0 },
  maxClaims: 0,
  champions: [],
  boats: [],
  homePosition: { row: 0, col: 0 },
});

const getPlayerColor = (playerId: number) => ({
  main: "#0070f3",
  light: "#66b3ff",
  dark: "#0056b3",
});

// Function to convert a trio definition to an array of tiles
const convertTrioToTiles = (trioDef: TileTrioDef): Tile[] => {
  const tileDefs = [trioDef.corner, trioDef.right, trioDef.below];

  return tileDefs.map((tileDef, index) => {
    const position = { row: 0, col: index }; // Simple positioning for print view
    const backColor =
      tileDef === "home" ? TileColors.homeBack : TileColors.tier1Back;
    const borderColor =
      tileDef === "home" ? TileColors.homeBorder : TileColors.tier1Border;

    const tile = convertTileDefToTile(
      tileDef,
      position,
      true,
      backColor,
      borderColor,
      1
    );

    // Remove adventure tokens for print version - they're added during gameplay
    if (tile.tileType === "adventure" || tile.tileType === "oasis") {
      tile.adventureTokens = 0;
    }
    console.log("tile", tile);
    return tile;
  });
};

// Component to render a single trio
const TrioDisplay = ({ trio, index }: { trio: TileTrioDef; index: number }) => {
  const dummyPlayer = createDummyPlayer();
  const emptyChampions: Champion[] = [];
  const trioTiles = convertTrioToTiles(trio);

  return (
    <div
      className="trio-display"
      style={{ display: "inline-block", margin: 0, padding: 0 }}
    >
      {/* L-shaped layout */}
      <div style={{ margin: 0, padding: 0 }}>
        {/* Top row: Corner and Right tiles */}
        <div
          className="trio-top-row"
          style={{ display: "flex", margin: 0, padding: 0 }}
        >
          <TileComponent
            tile={trioTiles[0]} // corner
            champions={emptyChampions}
            currentPlayer={dummyPlayer}
            debugMode={false}
            printMode={true}
            getPlayerColor={getPlayerColor}
          />
          <TileComponent
            tile={trioTiles[1]} // right
            champions={emptyChampions}
            currentPlayer={dummyPlayer}
            debugMode={false}
            printMode={true}
            getPlayerColor={getPlayerColor}
          />
        </div>

        {/* Bottom row: Below tile aligned with Corner */}
        <div
          className="trio-bottom-row"
          style={{ display: "flex", margin: 0, padding: 0 }}
        >
          <TileComponent
            tile={trioTiles[2]} // below
            champions={emptyChampions}
            currentPlayer={dummyPlayer}
            debugMode={false}
            printMode={true}
            getPlayerColor={getPlayerColor}
          />
        </div>
      </div>
    </div>
  );
};

// Component to render individual tier 3 tiles
const Tier3TileDisplay = ({
  tileDef,
  index,
}: {
  tileDef: TileDef;
  index: number;
}) => {
  const dummyPlayer = createDummyPlayer();
  const emptyChampions: Champion[] = [];

  const position = { row: 0, col: 0 };
  const tile = convertTileDefToTile(
    tileDef,
    position,
    false, // tier 3 tiles start unexplored
    TileColors.tier3Back,
    TileColors.tier3Border,
    1
  );
  tile.explored = true;
  tile.adventureTokens = 0;

  return (
    <div style={{ display: "inline-block" }}>
      <TileComponent
        tile={tile}
        champions={emptyChampions}
        currentPlayer={dummyPlayer}
        debugMode={false}
        printMode={true}
        getPlayerColor={getPlayerColor}
      />
    </div>
  );
};

export default function PrintTiles() {
  // Combine all trios into a single array
  const allTrios = [...HOME_TILE_TRIOS, ...TIER_1_TRIOS, ...TIER_2_TRIOS];

  // Tier 3 tiles: 3 adventure3 and 1 doomspire
  const tier3Tiles: TileDef[] = [
    "adventure3",
    "adventure3",
    "adventure3",
    "doomspire",
  ];

  // Group trios into rows of 2
  const trioRows = [];
  for (let i = 0; i < allTrios.length; i += 2) {
    trioRows.push(allTrios.slice(i, i + 2));
  }

  return (
    <>
      <Head>
        <title>Print Tiles - Lords of Doomspire</title>
        <meta
          name="description"
          content="Print tile trios for Lords of Doomspire"
        />
      </Head>

      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Universal spacing reset for print */
          .print-area * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          .print-area {
            line-height: 0;
            margin-top: 1rem !important;
          }
        }

        .print-button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .print-button:hover {
          background: #0056b3;
        }

        @media print {
          .print-button {
            display: none;
          }

          body {
            margin: 0.5in;
          }

          h1 {
            font-size: 18px;
            margin-bottom: 10px;
          }

          .trio-row {
            page-break-inside: avoid;
            margin: 0 !important;
            padding: 0 !important;
          }

          .trio-display {
            margin: 0 !important;
            padding: 0 !important;
          }

          .trio-top-row {
            margin: 0 !important;
            padding: 0 !important;
            margin-bottom: 0px !important;
          }

          .trio-bottom-row {
            margin: 0 !important;
            padding: 0 !important;
          }

          .tier3-row {
            page-break-before: auto;
            margin-top: 20px;
            margin-bottom: 0 !important;
            padding: 0 !important;
          }

          /* Remove all spacing from tile components in print */
          .trio-row > div {
            margin: 0 !important;
            padding: 0 !important;
          }

          .trio-display > div > div > div {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Force all styling to print including backgrounds, borders, shadows */
          .print-area * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ensure resource symbol styling prints correctly */
          .print-area span {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
        <button className="print-button" onClick={() => window.print()}>
          📄 Print / Save as PDF
        </button>

        <h1>Print Tiles</h1>

        <div className="print-area" style={{ marginTop: "2rem" }}>
          {/* Trio rows with 2 trios each */}
          {trioRows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="trio-row"
              style={{ display: "flex", margin: 0, padding: 0 }}
            >
              {row.map((trio, index) => (
                <TrioDisplay
                  key={`trio-${rowIndex * 2 + index}`}
                  trio={trio}
                  index={rowIndex * 2 + index}
                />
              ))}
            </div>
          ))}

          {/* Tier 3 tiles row */}
          <div className="tier3-row" style={{ display: "flex" }}>
            {tier3Tiles.map((tileDef, index) => (
              <Tier3TileDisplay
                key={`tier3-${index}`}
                tileDef={tileDef}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
