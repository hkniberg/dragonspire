import Head from "next/head";
import styles from "../styles/CheatSheet.module.css";

export default function CheatSheet() {
  return (
    <>
      <Head>
        <title>Lords of Doomspire - Player Cheat Sheet</title>
        <meta name="description" content="Quick reference guide for Lords of Doomspire board game" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LORDS OF DOOMSPIRE</h1>
          <h2 className={styles.subtitle}>PLAYER CHEAT SHEET</h2>
        </div>

        <div className={styles.twoColumn}>
          {/* Side 1: Core Gameplay */}
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
                      <li>Roll 1 die + 1 per knight</li>
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
                <div className={styles.listItem}>
                  <span className={styles.number}>4</span>
                  <div>
                    <strong>End Turn</strong>: Pass Starting Player token clockwise
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
                    <strong>Harvest</strong>: Collect from owned tiles (die value = max different tiles)
                  </li>
                  <li>
                    <strong>Build</strong>: Construct building or recruit knight (die value doesn't matter)
                  </li>
                </ul>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>MOVEMENT RULES</h3>
              <ul className={styles.bulletList}>
                <li>Horizontal/vertical only (no diagonal)</li>
                <li>Must stop when entering unexplored tile</li>
                <li>Cannot pass through other knights (they may force combat)</li>
                <li>Cannot enter enemy home tiles</li>
                <li>One action per knight per turn</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>COMBAT BASICS</h3>

              <div className={styles.combatBlock}>
                <h4 className={styles.combatTitle}>vs Monsters:</h4>
                <ul className={styles.bulletList}>
                  <li>Roll D3 + Might + adjacent support</li>
                  <li>Win if ≥ monster's Might → gain rewards</li>
                  <li>Lose → return home, pay 1 resource or lose 1 Fame</li>
                </ul>
              </div>

              <div className={styles.combatBlock}>
                <h4 className={styles.combatTitle}>vs Knights:</h4>
                <ul className={styles.bulletList}>
                  <li>Both roll 2D3 + Might + adjacent support</li>
                  <li>Winner gains 1 Fame, stays in tile</li>
                  <li>Loser returns home, pays 1 resource or loses 1 Fame</li>
                  <li>Winner may steal 1 resource OR 1 item</li>
                </ul>
              </div>

              <div className={styles.supportNote}>
                <strong>Adjacent Support:</strong> +1 per knight/warship in adjacent tiles
              </div>
            </section>
          </div>

          {/* Side 2: Strategic Reference */}
          <div className={styles.side}>
            <h2 className={styles.sideTitle}>Strategic Reference</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                VICTORY CONDITIONS <span className={styles.note}>(First to achieve ANY wins!)</span>
              </h3>
              <ul className={styles.victoryList}>
                <li>
                  <strong>Combat Victory</strong>: Defeat the Dragon at Doomspire
                </li>
                <li>
                  <strong>Diplomatic Victory</strong>: 12+ Fame → visit Doomspire
                </li>
                <li>
                  <strong>Economic Victory</strong>: Control 4+ starred resource tiles → visit Doomspire
                </li>
                <li>
                  <strong>Gold Victory</strong>: 20+ Gold → visit Doomspire
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>BUILDING COSTS & EFFECTS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>2nd Knight</strong>: 3 Food, 3 Gold, 1 Ore → +1 die
                </div>
                <div className={styles.building}>
                  <strong>3rd Knight</strong>: 6 Food, 6 Gold, 3 Ore → +1 die
                </div>
                <div className={styles.building}>
                  <strong>Market</strong>: 3 Food, 3 Wood → Sell 2 resources for 1 Gold
                </div>
                <div className={styles.building}>
                  <strong>Blacksmith</strong>: 3 Food, 3 Ore → Buy 1 Might for 1 Gold + 2 Ore
                </div>
                <div className={styles.building}>
                  <strong>Dock</strong>: 2 Wood, 2 Gold → +1 boat (max 2)
                </div>
                <div className={styles.building}>
                  <strong>Chapel</strong>: 3 Wood, 4 Gold → +3 Fame
                </div>
                <div className={styles.building}>
                  <strong>Monastery</strong>: 4 Wood, 5 Gold, 2 Ore → +5 Fame
                </div>
                <div className={styles.building}>
                  <strong>Warship Upgrade</strong>: 2 Wood, 1 Ore, 1 Gold → All boats become warships
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                SPECIAL LOCATIONS <span className={styles.note}>(Non-combat zones)</span>
              </h3>
              <ul className={styles.locationList}>
                <li>
                  <strong>Temple</strong>: Sacrifice 3 Fame → gain 1 Might
                </li>
                <li>
                  <strong>Marketplace</strong>: Buy any resource for 2 Gold
                </li>
                <li>
                  <strong>Trader</strong>: Trade Food/Wood/Ore for Gold (1:1) + buy items
                </li>
                <li>
                  <strong>Mercenary Camp</strong>: Buy 1 Might for 3 Gold
                </li>
                <li>
                  <strong>Doomspire</strong>: Dragon lair - multiple victory paths!
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>KNIGHT INVENTORY</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>2 items max</strong> per knight (can drop/pick up)
                </li>
                <li>
                  <strong>2 followers max</strong> per knight (cannot be stolen)
                </li>
                <li>Items can be stolen in combat; followers cannot</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>TILE INTERACTION</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Resource Tiles</strong>: Claim with flag OR conquer (costs 1 Might or 1 Fame)
                </li>
                <li>
                  <strong>Adventure Tiles</strong>: Draw card, remove adventure token
                </li>
                <li>
                  <strong>Blockading</strong>: Knight in enemy tile can harvest from it
                </li>
                <li>
                  <strong>Protection</strong>: Knights protect 4 adjacent tiles from conquest/blockade
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>QUICK REFERENCES</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Home Tile</strong>: Permanent, provides 1 Wood + 1 Food when harvested
                </li>
                <li>
                  <strong>Trading</strong>: Current player can trade with others anytime
                </li>
                <li>
                  <strong>Fame/Might</strong>: Cannot go below 0
                </li>
                <li>
                  <strong>Dragon Might</strong>: 8 + D3 (determined when revealed)
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
