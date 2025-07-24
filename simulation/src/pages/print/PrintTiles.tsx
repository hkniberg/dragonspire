import Head from "next/head";
import React from "react";
import { TileComponent } from "../../components/Tile";
import {
  HOME_TILE_TRIOS,
  TIER_1_TRIOS,
  TIER_2_TRIOS,
  TileDef,
  TileTrioDef,
} from "../../content/tilesDefs";
import { convertTileDefToTile, TileColors } from "../../lib/TileConverter";
import type { Champion, Tile } from "../../lib/types";

const getPlayerColor = (playerId: number) => ({
  main: "#0070f3",
  light: "#66b3ff",
  dark: "#0056b3",
});

// Convert trio to tiles with grid positioning info
const convertTrioToTiles = (
  trioDef: TileTrioDef,
  showBackside: boolean = false,
  tier: 1 | 2 = 1
): { tile: Tile; gridPosition: { row: number; col: number } }[] => {
  const tileDefs = [trioDef.corner, trioDef.right, trioDef.below];
  const gridPositions = [
    { row: 1, col: 1 }, // corner
    { row: 1, col: 2 }, // right
    { row: 2, col: 1 }, // below
  ];

  return tileDefs.map((tileDef, index) => {
    const position = { row: 0, col: index };

    let backColor: string;
    let borderColor: string;

    if (tileDef === "home") {
      backColor = TileColors.homeBack;
      borderColor = TileColors.homeBorder;
    } else if (tier === 1) {
      backColor = TileColors.tier1Back;
      borderColor = TileColors.tier1Border;
    } else if (tier === 2) {
      backColor = TileColors.tier2Back;
      borderColor = TileColors.tier2Border;
    } else {
      backColor = TileColors.tier1Back;
      borderColor = TileColors.tier1Border;
    }

    const tile = convertTileDefToTile(
      tileDef,
      position,
      true,
      backColor,
      borderColor,
      1
    );

    if (showBackside) {
      tile.explored = false;
    } else {
      if (tile.tileType === "adventure" || tile.tileType === "oasis") {
        tile.adventureTokens = 0;
      }
    }

    return {
      tile,
      gridPosition: gridPositions[index],
    };
  });
};

export default function PrintTiles() {
  const emptyChampions: Champion[] = [];

  // Combine all trios
  const homeTriosCount = HOME_TILE_TRIOS.length;
  const tier1TriosCount = TIER_1_TRIOS.length;
  const allTrios = [...HOME_TILE_TRIOS, ...TIER_1_TRIOS, ...TIER_2_TRIOS];

  const getTierForTrio = (trioIndex: number): 1 | 2 => {
    if (trioIndex < homeTriosCount + tier1TriosCount) {
      return 1;
    } else {
      return 2;
    }
  };

  // Convert all trios to tiles with positioning
  const frontTrios: {
    tiles: { tile: Tile; gridPosition: { row: number; col: number } }[];
    tier: 1 | 2;
  }[] = [];

  const backTrios: {
    tiles: { tile: Tile; gridPosition: { row: number; col: number } }[];
    tier: 1 | 2;
  }[] = [];

  allTrios.forEach((trio, index) => {
    const tier = getTierForTrio(index);
    frontTrios.push({
      tiles: convertTrioToTiles(trio, false, tier),
      tier,
    });
    backTrios.push({
      tiles: convertTrioToTiles(trio, true, tier),
      tier,
    });
  });

  // Create tier 3 tiles (not in trios)
  const tier3TileDefs: TileDef[] = [
    "adventure3",
    "adventure3",
    "adventure3",
    "doomspire",
  ];
  const frontTier3Tiles: Tile[] = [];
  const backTier3Tiles: Tile[] = [];

  tier3TileDefs.forEach((tileDef) => {
    const position = { row: 0, col: 0 };

    const frontTile = convertTileDefToTile(
      tileDef,
      position,
      false,
      TileColors.tier3Back,
      TileColors.tier3Border,
      1
    );
    frontTile.explored = true;
    frontTile.adventureTokens = 0;

    const backTile = convertTileDefToTile(
      tileDef,
      position,
      false,
      TileColors.tier3Back,
      TileColors.tier3Border,
      1
    );
    backTile.explored = false;

    frontTier3Tiles.push(frontTile);
    backTier3Tiles.push(backTile);
  });

  // Split trios into pages (6 trios per page = 3x2 layout)
  const TRIOS_PER_PAGE = 6;
  const frontPages: (typeof frontTrios)[] = [];
  const backPages: (typeof backTrios)[] = [];

  for (let i = 0; i < frontTrios.length; i += TRIOS_PER_PAGE) {
    frontPages.push(frontTrios.slice(i, i + TRIOS_PER_PAGE));
    backPages.push(backTrios.slice(i, i + TRIOS_PER_PAGE));
  }

  return (
    <>
      <Head>
        <title>Print Tiles - Lords of Doomspire</title>
      </Head>

      <style jsx>{`
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

        .print-page {
          padding: 20px;
          border-bottom: 2px dashed #ccc;
          margin-bottom: 20px;
        }

        .print-page:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .trios-grid {
          display: grid;
          grid-template-columns: repeat(4, 120px);
          grid-template-rows: repeat(6, 120px);
          gap: 0px;
          justify-content: center;
        }

        .trio-container {
          display: contents;
        }

        .tier3-grid {
          display: grid;
          grid-template-columns: repeat(4, 120px);
          gap: 0px;
          justify-content: center;
          margin-top: 20px;
        }

        @media print {
          .print-button {
            display: none !important;
          }

          .outer-container {
            padding: 0 !important;
          }

          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-page {
            page-break-after: always;
            break-after: page;
            padding: 0.5in;
            border: none;
            margin: 0;
          }

          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .trios-grid {
            display: grid;
            grid-template-columns: repeat(4, 120px);
            grid-template-rows: repeat(6, 120px);
            gap: 0px;
            justify-content: center;
          }

          .tier3-grid {
            display: grid;
            grid-template-columns: repeat(4, 120px);
            gap: 0px;
            justify-content: center;
            margin-top: 20px;
          }
        }
      `}</style>

      <div
        className="outer-container"
        style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}
      >
        <button className="print-button" onClick={() => window.print()}>
          📄 Print / Save as PDF
        </button>

        {/* Alternating front and back pages with trios */}
        {frontPages.map((frontPageTrios, pageIndex) => {
          const backPageTrios = backPages[pageIndex];

          return (
            <React.Fragment key={`page-pair-${pageIndex}`}>
              {/* Front page */}
              <div className="print-page">
                <h3>Front Side - Page {pageIndex + 1}</h3>
                <div className="trios-grid">
                  {frontPageTrios.map((trioData, trioIndex) => {
                    // Calculate trio position in 3x2 grid
                    const trioRow = Math.floor(trioIndex / 2);
                    const trioCol = trioIndex % 2;

                    return (
                      <div key={`trio-${trioIndex}`} className="trio-container">
                        {trioData.tiles.map(
                          ({ tile, gridPosition }, tileIndex) => {
                            // Calculate absolute grid position for this tile
                            const gridRow = trioRow * 2 + gridPosition.row;
                            const gridCol = trioCol * 2 + gridPosition.col;

                            return (
                              <div
                                key={`tile-${tileIndex}`}
                                style={{
                                  gridRow: gridRow,
                                  gridColumn: gridCol,
                                }}
                              >
                                <TileComponent
                                  tile={tile}
                                  champions={emptyChampions}
                                  debugMode={false}
                                  getPlayerColor={getPlayerColor}
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Back page */}
              <div className="print-page">
                <h3>Back Side - Page {pageIndex + 1}</h3>
                <div className="trios-grid">
                  {backPageTrios.map((trioData, trioIndex) => {
                    // Calculate trio position in 3x2 grid
                    const trioRow = Math.floor(trioIndex / 2);
                    const trioCol = trioIndex % 2;

                    return (
                      <div key={`trio-${trioIndex}`} className="trio-container">
                        {trioData.tiles.map(
                          ({ tile, gridPosition }, tileIndex) => {
                            // Calculate absolute grid position for this tile
                            const gridRow = trioRow * 2 + gridPosition.row;
                            const gridCol = trioCol * 2 + gridPosition.col;

                            return (
                              <div
                                key={`tile-${tileIndex}`}
                                style={{
                                  gridRow: gridRow,
                                  gridColumn: gridCol,
                                }}
                              >
                                <TileComponent
                                  tile={tile}
                                  champions={emptyChampions}
                                  debugMode={false}
                                  getPlayerColor={getPlayerColor}
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Tier 3 tiles front page */}
        <div className="print-page">
          <h3>Tier 3 Tiles - Front Side</h3>
          <div className="tier3-grid">
            {frontTier3Tiles.map((tile, index) => (
              <TileComponent
                key={`tier3-front-${index}`}
                tile={tile}
                champions={emptyChampions}
                debugMode={false}
                getPlayerColor={getPlayerColor}
              />
            ))}
          </div>
        </div>

        {/* Tier 3 tiles back page */}
        <div className="print-page">
          <h3>Tier 3 Tiles - Back Side</h3>
          <div className="tier3-grid">
            {backTier3Tiles.map((tile, index) => (
              <TileComponent
                key={`tier3-back-${index}`}
                tile={tile}
                champions={emptyChampions}
                debugMode={false}
                getPlayerColor={getPlayerColor}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
