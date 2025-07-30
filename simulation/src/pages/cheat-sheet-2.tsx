import Head from "next/head";
import styles from "../styles/CheatSheet.module.css";

export default function CheatSheet2() {
  return (
    <>
      <Head>
        <title>Lords of Doomspire - Costs & Buildings</title>
        <meta name="description" content="Costs and buildings reference for Lords of Doomspire board game" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LORDS OF DOOMSPIRE</h1>
          <h2 className={styles.subtitle}>COSTS & BUILDINGS CHEAT SHEET</h2>
        </div>

        <div className={styles.twoColumn}>
          {/* Building Costs */}
          <div className={styles.side}>
            <h2 className={styles.sideTitle}>In castle</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>KNIGHTS & BOATS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>2nd Knight</strong>: 3 Food, 3 Gold, 1 Ore → +1 die per turn
                </div>
                <div className={styles.building}>
                  <strong>3rd Knight</strong>: 6 Food, 6 Gold, 3 Ore → +1 die per turn
                </div>
                <div className={styles.building}>
                  <strong>Boat</strong>: 2 Wood, 2 Gold → +1 boat (max 2 boats)
                </div>
                <div className={styles.building}>
                  <strong>Warship Upgrade</strong>: 2 Wood, 1 Ore, 1 Gold → All boats become warships (+1 coastal combat
                  support)
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>ECONOMIC BUILDINGS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>Market</strong>: 2 Food, 2 Wood → Sell any resource for Gold (2:1 rate)
                </div>
                <div className={styles.building}>
                  <strong>Blacksmith</strong>: 2 Food, 2 Ore → Buy 1 Might for 1 Gold + 2 Ore (once per harvest phase)
                </div>
                <div className={styles.building}>
                  <strong>Fletcher</strong>: 1 Wood, 1 Food, 1 Gold, 1 Ore → Buy 1 Might for 3 Wood + 1 Ore (once per
                  harvest phase)
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>FAME BUILDINGS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>Chapel</strong>: 6 Wood, 2 Gold → +3 Fame (once per player)
                </div>
                <div className={styles.building}>
                  <strong>Monastery</strong>: 8 Wood, 3 Gold, 1 Ore → +5 Fame (requires Chapel, once per player)
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>BUILDING USAGE</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Market</strong>: Sell 2 any resources → 1 Gold
                </li>
                <li>
                  <strong>Blacksmith</strong>: Pay 1 Gold + 2 Ore → +1 Might (once per harvest)
                </li>
                <li>
                  <strong>Fletcher</strong>: Pay 3 Wood + 1 Ore → +1 Might (once per harvest)
                </li>
                <li>
                  <strong>Chapel/Monastery</strong>: One-time Fame bonus when built
                </li>
              </ul>
            </section>
          </div>

          {/* Special Locations */}
          <div className={styles.side}>
            <h2 className={styles.sideTitle}>Outside castle</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                SPECIAL TILES <span className={styles.note}>(Multiple knights allowed)</span>
              </h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>Temple</strong>: Pay 2 Fame → +1 Might (once per turn)
                </div>
                <div className={styles.building}>
                  <strong>Trader</strong>: Trade 2 any resources → 1 any resource + Buy items
                </div>
                <div className={styles.building}>
                  <strong>Mercenary Camp</strong>: Pay 3 Gold → +1 Might (once per turn)
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>RESOURCE TILE ACTIONS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>Claim Tile</strong>: Free
                </div>
                <div className={styles.building}>
                  <strong>Blockade Tile</strong>: Place knight on enemy tile → harvest from it instead of owner
                </div>
                <div className={styles.building}>
                  <strong>Incite Revolt</strong>: 1 Fame → Remove enemy claim (tile becomes unclaimed)
                </div>
                <div className={styles.building}>
                  <strong>Conquer Tile</strong>: 1 Might → Take over enemy tile
                </div>
              </div>
              <div className={styles.supportNote}>
                <strong>Note:</strong> Can only target unprotected enemy tiles. Protected tiles have adjacent knights or
                warships.
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                VICTORY CONDITIONS <span className={styles.note}>(First to achieve ANY wins!)</span>
              </h3>
              <ul className={styles.victoryList}>
                <li>
                  <strong>Combat Victory</strong>: Defeat the Dragon at Doomspire (8 + 1D3 Might)
                </li>
                <li>
                  <strong>Diplomatic Victory</strong>: 15+ Fame → visit Doomspire
                </li>
                <li>
                  <strong>Economic Victory</strong>: Control 4+ starred resource tiles → visit Doomspire
                </li>
                <li>
                  <strong>Gold Victory</strong>: 15+ Gold → visit Doomspire
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
