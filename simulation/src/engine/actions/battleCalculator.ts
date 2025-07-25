// Lords of Doomspire Battle Calculator

import { GameSettings } from "@/lib/GameSettings";

export interface ChampionBattleResult {
  attackerWins: boolean;
  attackerFinalRoll: number;
  defenderFinalRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  rollCount: number; // How many times we had to reroll due to ties
}

export interface MonsterBattleResult {
  championWins: boolean;
  championRoll: number;
  championTotal: number;
  monsterTotal: number;
}

export interface DragonBattleResult extends MonsterBattleResult {
  dragonMight: number; // The randomly determined dragon might (6 + D3)
}

/**
 * Roll a D3 (returns 1, 2, or 3 with equal probability like the game rules)
 */
function rollD3(): number {
  const outcomes = [1, 1, 2, 2, 3, 3];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Resolve champion vs champion battle
 * Keeps rerolling on ties until someone wins (per game rules)
 */
export function resolveChampionBattle(
  attackerMight: number,
  defenderMight: number
): ChampionBattleResult {
  let rollCount = 0;
  let attackerRoll: number;
  let defenderRoll: number;
  let attackerTotal: number;
  let defenderTotal: number;

  do {
    rollCount++;
    attackerRoll = rollD3();
    defenderRoll = rollD3();
    attackerTotal = attackerMight + attackerRoll;
    defenderTotal = defenderMight + defenderRoll;
  } while (attackerTotal === defenderTotal); // Keep rerolling on ties

  return {
    attackerWins: attackerTotal > defenderTotal,
    attackerFinalRoll: attackerRoll,
    defenderFinalRoll: defenderRoll,
    attackerTotal,
    defenderTotal,
    rollCount
  };
}

/**
 * Resolve champion vs monster battle
 * Champion needs to equal or exceed monster's might to win
 */
export function resolveMonsterBattle(
  championMight: number,
  monsterMight: number
): MonsterBattleResult {
  const championRoll = rollD3();
  const championTotal = championMight + championRoll;

  return {
    championWins: championTotal >= monsterMight,
    championRoll,
    championTotal,
    monsterTotal: monsterMight
  };
}

/**
 * Resolve dragon battle (special case with random dragon might)
 * Dragon might is 6 base + D3 roll, determined when combat starts
 */
export function resolveDragonBattle(championMight: number): DragonBattleResult {
  const dragonMight = GameSettings.DRAGON_BASE_MIGHT + rollD3();
  const result = resolveMonsterBattle(championMight, dragonMight);

  return {
    ...result,
    dragonMight
  };
} 