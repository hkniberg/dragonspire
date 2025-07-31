import Head from "next/head";
import styles from "../styles/CheatSheet.module.css";

export default function CheatSheet() {
  return (
    <>
      <Head>
        <title>Lords of Doomspire - Game Reference</title>
        <meta name="description" content="Complete game reference for Lords of Doomspire board game" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LORDS OF DOOMSPIRE</h1>
        </div>

        <div className={styles.twoColumn}>
          {/* Left Column */}
          <div className={styles.side}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>TURN STRUCTURE & ACTIONS</h3>
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
                      <li>
                        <strong>Move Knight</strong>: Move up to die value + tile interaction
                      </li>
                      <li>
                        <strong>Move Boat</strong>: Move boat + optionally transport knight
                      </li>
                      <li>Can save dice for Harvest Phase</li>
                    </ul>
                  </div>
                </div>
                <div className={styles.listItem}>
                  <span className={styles.number}>3</span>
                  <div>
                    <strong>Harvest Phase</strong> <em>(Parallel)</em>
                    <ul className={styles.bulletList}>
                      <li>
                        <strong>Harvest</strong>: Collect from resource tiles (die value = how many tiles)
                      </li>
                      <li>
                        <strong>Use Buildings</strong>: Market, blacksmith, fletcher
                      </li>
                      <li>
                        <strong>Build</strong>: Buy knight/boat, build/upgrade buildings
                      </li>
                    </ul>
                  </div>
                </div>
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
          </div>

          {/* Right Column */}
          <div className={styles.side}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>RESOURCE TILE ACTIONS</h3>
              <div className={styles.buildingList}>
                <div className={styles.building}>
                  <strong>Claim Tile</strong>: Free (unclaimed tiles only)
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
                <strong>Protection:</strong> Tiles with adjacent knights or warships cannot be blockaded, conquered, or
                revolted
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>TILE INTERACTION</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Forced</strong>: Explore unexplored tiles (+1 Fame), combat monsters/knights, draw adventure
                  cards
                </li>
                <li>
                  <strong>Voluntary</strong>: Use special locations, claim/blockade/conquer resource tiles, pick up/drop
                  items
                </li>
                <li>
                  <strong>Adventure Tiles</strong>: Draw card, remove adventure token
                </li>
                <li>
                  <strong>Non-Combat Zones</strong>: Temple, Trader, Mercenary Camp (multiple knights allowed)
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>DRAGON EXILE CONDITIONS</h3>
              <p className={styles.note}>Reach Doomspire with ANY of these to exile the dragon and trigger endgame:</p>
              <ul className={styles.victoryList}>
                <li>
                  <strong>Combat Exile</strong>: Defeat the Dragon (8 + 1D3 Might)
                </li>
                <li>
                  <strong>Fame Exile</strong>: Have 15+ Fame
                </li>
                <li>
                  <strong>Economic Exile</strong>: Own 4+ starred resource tiles
                </li>
                <li>
                  <strong>Gold Exile</strong>: Have 12+ Gold
                </li>
              </ul>
              <div className={styles.supportNote}>
                <strong>Dragon Combat:</strong> Lose = knight gets eaten (removed from game)
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>VICTORY POINTS SCORING</h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Dragon Exile</strong>: 8 VP (for player who exiled dragon)
                </li>
                <li>
                  <strong>Might</strong>: 1 VP per might
                </li>
                <li>
                  <strong>Fame</strong>: 1 VP per 2 fame (rounded down)
                </li>
                <li>
                  <strong>Knights</strong>: 3 VP per knight
                </li>
                <li>
                  <strong>Starred tiles</strong>: 1 VP per starred tile (excluding home)
                </li>
                <li>
                  <strong>Total tiles</strong>: 1 VP per tile (excluding home)
                </li>
                <li>
                  <strong>Castle buildings</strong>: 2 VP per building
                </li>
                <li>
                  <strong>Warships</strong>: 3 VP per warship
                </li>
                <li>
                  <strong>Items & followers</strong>: 1 VP per item/follower
                </li>
                <li>
                  <strong>Gold</strong>: 1 VP per 2 gold (rounded down)
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
