import Head from "next/head";
import styles from "../styles/CheatSheet.module.css";

export default function CheatSheet1() {
  return (
    <>
      <Head>
        <title>Lords of Doomspire - Core Mechanics</title>
        <meta name="description" content="Core mechanics cheat sheet for Lords of Doomspire board game" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LORDS OF DOOMSPIRE</h1>
          <h2 className={styles.subtitle}>CORE MECHANICS CHEAT SHEET</h2>
        </div>

        <div className={styles.twoColumn}>
          {/* Core Gameplay */}
          <div className={styles.side}>
            <h2 className={styles.sideTitle}>Core Gameplay</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>TURN STRUCTURE</h3>
              <div className={styles.orderedList}>
                <div className={styles.listItem}>
                  <span className={styles.number}>1</span>
                  <div>
                    <strong>Roll Dice Phase</strong> <em>(Parallel)</em>
                    <ul className={styles.bulletList}>
                      <li>Rotate starting player token to next player</li>
                      <li>Roll 1 die for castle + 1 per knight</li>
                      <li>
                        <strong>Dice Tax</strong>: Pay 2 Food per die after first 2
                      </li>
                    </ul>
                  </div>
                </div>
                <div className={styles.listItem}>
                  <span className={styles.number}>2</span>
                  <div>
                    <strong>Move Phase</strong> <em>(Sequential from Starting Player)</em>
                    <ul className={styles.bulletList}>
                      <li>Use dice for Move & Act or Boat Travel</li>
                      <li>Can save dice for Harvest Phase</li>
                    </ul>
                  </div>
                </div>
                <div className={styles.listItem}>
                  <span className={styles.number}>3</span>
                  <div>
                    <strong>Harvest Phase</strong> <em>(Parallel)</em>
                    <ul className={styles.bulletList}>
                      <li>Use remaining dice for Harvest or Build</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                ACTIONS <span className={styles.note}>(One per die)</span>
              </h3>

              <div className={styles.actionGroup}>
                <h4 className={styles.actionTitle}>Move Phase:</h4>
                <ul className={styles.actionList}>
                  <li>
                    <strong>Move & Act</strong>: Move knight (up to die value) + tile action
                  </li>
                  <li>
                    <strong>Boat Travel</strong>: Move boat + transport 1 knight
                  </li>
                </ul>
              </div>

              <div className={styles.actionGroup}>
                <h4 className={styles.actionTitle}>Harvest Phase:</h4>
                <ul className={styles.actionList}>
                  <li>
                    <strong>Harvest</strong>: Collect from owned non-blockaded tiles (die value = how many tiles)
                  </li>
                  <li>
                    <strong>Use buildings</strong>: Use market/blacksmith/fletcher.
                  </li>
                  <li>
                    <strong>Build</strong>: Build/upgrade building, buy knight/boat.
                  </li>
                </ul>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>MOVEMENT RULES</h3>
              <ul className={styles.bulletList}>
                <li>Horizontal/vertical only (no diagonal)</li>
                <li>Must stop when entering unexplored tile or tile with monster</li>
                <li>Cannot stop in same tile as other knights (except non-combat zones)</li>
                <li>Cannot pass through monster tiles</li>
                <li>Can pass through other knights (they may force combat)</li>
                <li>Cannot enter enemy home tiles</li>
                <li>One action per knight per turn</li>
              </ul>
            </section>
          </div>

          {/* Advanced Rules */}
          <div className={styles.side}>
            <h2 className={styles.sideTitle}>Game mechanics</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>COMBAT BASICS</h3>

              <div className={styles.combatBlock}>
                <h4 className={styles.combatTitle}>vs Monsters:</h4>
                <ul className={styles.bulletList}>
                  <li>Roll 1D3 + Might + adjacent support</li>
                  <li>Win if ≥ monster's Might → gain rewards</li>
                  <li>Lose → return home, pay 1 resource or lose 1 Fame</li>
                </ul>
              </div>

              <div className={styles.combatBlock}>
                <h4 className={styles.combatTitle}>vs Knights:</h4>
                <ul className={styles.bulletList}>
                  <li>Both roll 2D3 + Might + adjacent support</li>
                  <li>Winner gains 1 Fame, stays in tile</li>
                  <li>Loser returns home (no resource cost to heal)</li>
                  <li>Winner may steal 1 resource OR 1 item</li>
                </ul>
              </div>

              <div className={styles.supportNote}>
                <strong>Adjacent Support:</strong> +1 per knight/warship in adjacent tiles
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>TILE INTERACTION</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Forced Interactions</strong>: Explore unexplored tiles, combat monsters/knights, draw
                  adventure cards
                </li>
                <li>
                  <strong>Exploring</strong>: +1 Fame when entering an unexplored tile
                </li>
                <li>
                  <strong>Resource Tiles</strong>: Claim, Blockade, Incite Revolt, or Conquer
                </li>
                <li>
                  <strong>Adventure Tiles</strong>: Draw card, remove adventure token
                </li>
                <li>
                  <strong>Blockading</strong>: Knight in enemy tile can harvest from it
                </li>
                <li>
                  <strong>Protection</strong>: Knights protect 4 adjacent tiles, warships protect coastal tiles
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>FLEEING COMBAT</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Cannot flee</strong> if you chose to fight
                </li>
                <li>
                  <strong>Roll 1D3</strong>: 1=fail (fight), 2=flee home, 3=flee to closest owned tile
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>DOOMSPIRE</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Victory Check</strong>: Win if you have 15+ Fame, 15+ Gold, or 4+ starred tiles
                </li>
                <li>
                  <strong>Dragon Combat</strong>: 8 + 1D3 Might (if no victory condition met)
                </li>
                <li>
                  <strong>Fleeing Dragon</strong>: Always succeeds → go home, lose 1 Fame
                </li>
                <li>
                  <strong>Losing to Dragon</strong>: Knight gets eaten (removed from game)
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
