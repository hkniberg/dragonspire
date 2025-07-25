import { CombatResolver, DiceRoller } from "../../src/engine/CombatResolver";
import { Champion, Monster, Player } from "../../src/lib/types";

// Mock dice roller for predictable testing
class MockDiceRoller implements DiceRoller {
  private rolls: number[];
  private currentIndex: number = 0;

  constructor(rolls: number[]) {
    this.rolls = rolls;
  }

  rollD3(): number {
    const roll = this.rolls[this.currentIndex % this.rolls.length];
    this.currentIndex++;
    return roll;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

describe("CombatResolver", () => {
  const createTestPlayer = (might: number = 0, fame: number = 0, gold: number = 0): Player => ({
    id: 1,
    name: "Test Player",
    fame,
    might,
    resources: { food: 0, wood: 0, ore: 0, gold },
    maxClaims: 10,
    champions: [],
    boats: [],
    homePosition: { row: 0, col: 0 },
  });

  const createTestChampion = (id: number = 1, playerId: number = 1): Champion => ({
    id,
    playerId,
    position: { row: 1, col: 1 },
    treasures: [],
  });

  const createTestMonster = (might: number = 5, fame: number = 2): Monster => ({
    id: "test-monster",
    name: "Test Monster",
    tier: 1,
    icon: "👹",
    might,
    fame,
    resources: { food: 2, wood: 1, ore: 0, gold: 1 },
  });

  describe("Monster Combat", () => {
    it("should handle player victory against monster", () => {
      const mockRoller = new MockDiceRoller([3]); // Player rolls 3
      const combatResolver = new CombatResolver(mockRoller);

      const player = createTestPlayer(2, 5, 0); // might=2, fame=5
      const champion = createTestChampion();
      const monster = createTestMonster(5, 3); // might=5, fame=3

      // Player roll: 3 + 2 = 5, Monster might: 5 → Player wins (tie goes to player)
      const result = combatResolver.resolveMonsterCombat(player, champion, monster);

      expect(result.playerWon).toBe(true);
      expect(result.playerRoll).toBe(5);
      expect(result.monsterMight).toBe(5);
      expect(result.fameGained).toBe(3);
      expect(result.championReturnedHome).toBe(false);
      expect(result.updatedPlayer.fame).toBe(8); // 5 + 3
      expect(result.updatedPlayer.resources.food).toBe(2);
      expect(result.updatedPlayer.resources.wood).toBe(1);
      expect(result.updatedPlayer.resources.gold).toBe(1);
      expect(result.summary).toContain("defeated Test Monster (5 vs 5)");
      expect(result.summary).toContain("gained 3 fame");
    });

    it("should handle player defeat against monster with gold payment", () => {
      const mockRoller = new MockDiceRoller([1]); // Player rolls 1
      const combatResolver = new CombatResolver(mockRoller);

      const player = createTestPlayer(2, 5, 3); // might=2, fame=5, gold=3
      const champion = createTestChampion();
      const monster = createTestMonster(5, 3); // might=5

      // Player roll: 1 + 2 = 3, Monster might: 5 → Player loses
      const result = combatResolver.resolveMonsterCombat(player, champion, monster);

      expect(result.playerWon).toBe(false);
      expect(result.playerRoll).toBe(3);
      expect(result.monsterMight).toBe(5);
      expect(result.fameGained).toBe(0);
      expect(result.championReturnedHome).toBe(true);
      expect(result.updatedPlayer.fame).toBe(5); // No fame change when paying gold
      expect(result.updatedPlayer.resources.gold).toBe(2); // 3 - 1 medical cost
      expect(result.summary).toContain("lost to Test Monster (3 vs 5)");
      expect(result.summary).toContain("paid 1 gold medical cost");
    });

    it("should handle player defeat against monster with fame payment when no gold", () => {
      const mockRoller = new MockDiceRoller([1]); // Player rolls 1
      const combatResolver = new CombatResolver(mockRoller);

      const player = createTestPlayer(1, 3, 0); // might=1, fame=3, gold=0
      const champion = createTestChampion();
      const monster = createTestMonster(5, 2); // might=5

      // Player roll: 1 + 1 = 2, Monster might: 5 → Player loses
      const result = combatResolver.resolveMonsterCombat(player, champion, monster);

      expect(result.playerWon).toBe(false);
      expect(result.playerRoll).toBe(2);
      expect(result.championReturnedHome).toBe(true);
      expect(result.updatedPlayer.fame).toBe(2); // 3 - 1 medical cost
      expect(result.updatedPlayer.resources.gold).toBe(0); // No gold change
      expect(result.summary).toContain("lost to Test Monster (2 vs 5)");
      expect(result.summary).toContain("lost 1 fame for medical cost");
    });

    it("should not reduce fame below 0", () => {
      const mockRoller = new MockDiceRoller([1]);
      const combatResolver = new CombatResolver(mockRoller);

      const player = createTestPlayer(0, 0, 0); // No might, no fame, no gold
      const champion = createTestChampion();
      const monster = createTestMonster(5, 1);

      const result = combatResolver.resolveMonsterCombat(player, champion, monster);

      expect(result.playerWon).toBe(false);
      expect(result.championReturnedHome).toBe(true);
      expect(result.updatedPlayer.fame).toBe(0); // Should not go below 0
    });
  });

  describe("Champion Combat", () => {
    it("should handle attacker victory", () => {
      const mockRoller = new MockDiceRoller([3, 1]); // Attacker rolls 3, Defender rolls 1
      const combatResolver = new CombatResolver(mockRoller);

      const attacker = createTestPlayer(2, 5, 0);
      attacker.id = 1;
      attacker.name = "Attacker";
      const defender = createTestPlayer(1, 3, 2);
      defender.id = 2;
      defender.name = "Defender";
      const defendingChampion = createTestChampion(1, 2);

      // Attacker: 3 + 2 = 5, Defender: 1 + 1 = 2 → Attacker wins
      const result = combatResolver.resolveChampionCombat(attacker, defender, defendingChampion);

      expect(result.attackerWins).toBe(true);
      expect(result.attackerRoll).toBe(5);
      expect(result.defenderRoll).toBe(2);
      expect(result.updatedAttackingPlayer.fame).toBe(6); // 5 + 1 for winning
      expect(result.updatedAttackingPlayer.resources.gold).toBe(0); // No change for winner
      expect(result.updatedDefendingPlayer.resources.gold).toBe(1); // 2 - 1 medical cost
      expect(result.summary).toContain("Attacker defeated Defender");
    });

    it("should handle defender victory", () => {
      const mockRoller = new MockDiceRoller([1, 3]); // Attacker rolls 1, Defender rolls 3
      const combatResolver = new CombatResolver(mockRoller);

      const attacker = createTestPlayer(1, 5, 1);
      attacker.id = 1;
      attacker.name = "Attacker";
      const defender = createTestPlayer(2, 3, 0);
      defender.id = 2;
      defender.name = "Defender";
      const defendingChampion = createTestChampion(1, 2);

      // Attacker: 1 + 1 = 2, Defender: 3 + 2 = 5 → Defender wins
      const result = combatResolver.resolveChampionCombat(attacker, defender, defendingChampion);

      expect(result.attackerWins).toBe(false);
      expect(result.attackerRoll).toBe(2);
      expect(result.defenderRoll).toBe(5);
      expect(result.updatedAttackingPlayer.resources.gold).toBe(0); // 1 - 1 medical cost
      expect(result.updatedDefendingPlayer.resources.gold).toBe(0); // No change for winner
      expect(result.summary).toContain("Defender");
    });

    it("should re-roll on ties", () => {
      const mockRoller = new MockDiceRoller([2, 2, 3, 1]); // Tie first, then attacker wins
      const combatResolver = new CombatResolver(mockRoller);

      const attacker = createTestPlayer(1, 5, 0);
      attacker.id = 1;
      attacker.name = "Attacker";
      const defender = createTestPlayer(1, 3, 1);
      defender.id = 2;
      defender.name = "Defender";
      const defendingChampion = createTestChampion(1, 2);

      // First round: 2 + 1 = 3, 2 + 1 = 3 → Tie, re-roll
      // Second round: 3 + 1 = 4, 1 + 1 = 2 → Attacker wins
      const result = combatResolver.resolveChampionCombat(attacker, defender, defendingChampion);

      expect(result.attackerWins).toBe(true);
      expect(result.attackerRoll).toBe(4);
      expect(result.defenderRoll).toBe(2);
    });
  });
});
