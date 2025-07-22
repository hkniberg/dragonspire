// Lords of Doomspire Combat Resolution System

import type { Champion, Player } from '../lib/types';
import { Monster } from '../lib/types';

export interface DiceRoller {
    rollD3(): number;
}

export class RandomDiceRoller implements DiceRoller {
    rollD3(): number {
        const outcomes = [1, 1, 2, 2, 3, 3];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    }
}

export interface MonsterCombatResult {
    playerWon: boolean;
    playerRoll: number;
    monsterMight: number;
    fameGained: number;
    resourcesGained: Record<string, number>;
    updatedPlayer: Player;
    championReturnedHome: boolean;
    summary: string;
}

export interface ChampionCombatResult {
    attackerWins: boolean;
    attackerRoll: number;
    defenderRoll: number;
    updatedAttackingPlayer: Player;
    updatedDefendingPlayer: Player;
    updatedDefendingChampion: Champion;
    summary: string;
}

export class CombatResolver {
    private diceRoller: DiceRoller;

    constructor(diceRoller: DiceRoller = new RandomDiceRoller()) {
        this.diceRoller = diceRoller;
    }

    /**
     * Resolve combat between a player and a monster
     */
    resolveMonsterCombat(player: Player, champion: Champion, monster: Monster): MonsterCombatResult {
        const playerRoll = this.diceRoller.rollD3() + player.might;
        const playerWon = playerRoll >= monster.might;

        if (playerWon) {
            // Player wins - gain fame and resources
            const updatedPlayer = {
                ...player,
                fame: player.fame + monster.fame,
                resources: {
                    food: player.resources.food + (monster.resources.food || 0),
                    wood: player.resources.wood + (monster.resources.wood || 0),
                    ore: player.resources.ore + (monster.resources.ore || 0),
                    gold: player.resources.gold + (monster.resources.gold || 0)
                }
            };

            const resourcesGained = {
                food: monster.resources.food || 0,
                wood: monster.resources.wood || 0,
                ore: monster.resources.ore || 0,
                gold: monster.resources.gold || 0
            };

            const resourceDesc = this.describeResources(resourcesGained);
            const summary = `defeated ${monster.name} (${playerRoll} vs ${monster.might}), gained ${monster.fame} fame${resourceDesc}`;

            return {
                playerWon: true,
                playerRoll,
                monsterMight: monster.might,
                fameGained: monster.fame,
                resourcesGained,
                updatedPlayer,
                championReturnedHome: false,
                summary
            };
        } else {
            // Player loses - apply medical costs and send champion home
            let updatedPlayer = { ...player };
            let medicalCostSummary = '';

            if (updatedPlayer.resources.gold >= 1) {
                updatedPlayer.resources.gold -= 1;
                medicalCostSummary = ' (paid 1 gold medical cost)';
            } else {
                updatedPlayer.fame = Math.max(0, updatedPlayer.fame - 1);
                medicalCostSummary = ' (lost 1 fame for medical cost)';
            }

            // Move champion home
            const updatedChampions = updatedPlayer.champions.map(c =>
                c.id === champion.id
                    ? { ...c, position: player.homePosition }
                    : c
            );
            updatedPlayer = { ...updatedPlayer, champions: updatedChampions };

            const summary = `lost to ${monster.name} (${playerRoll} vs ${monster.might})${medicalCostSummary}, champion returned home`;

            return {
                playerWon: false,
                playerRoll,
                monsterMight: monster.might,
                fameGained: 0,
                resourcesGained: { food: 0, wood: 0, ore: 0, gold: 0 },
                updatedPlayer,
                championReturnedHome: true,
                summary
            };
        }
    }

    /**
     * Resolve champion vs champion combat
     */
    resolveChampionCombat(
        attackingPlayer: Player,
        defendingPlayer: Player,
        defendingChampion: Champion
    ): ChampionCombatResult {
        let attackerRoll: number;
        let defenderRoll: number;

        // Battle until there's a winner (no ties)
        do {
            attackerRoll = this.diceRoller.rollD3() + attackingPlayer.might;
            defenderRoll = this.diceRoller.rollD3() + defendingPlayer.might;
        } while (attackerRoll === defenderRoll);

        const attackerWins = attackerRoll > defenderRoll;

        let updatedAttackingPlayer = { ...attackingPlayer };
        let updatedDefendingPlayer = { ...defendingPlayer };
        let updatedDefendingChampion = { ...defendingChampion };
        let summary = '';

        if (attackerWins) {
            // Attacker wins - defender pays medical costs and returns home
            updatedAttackingPlayer.fame += 1; // Winner gains 1 fame

            let medicalCostSummary = '';
            if (updatedDefendingPlayer.resources.gold >= 1) {
                updatedDefendingPlayer.resources.gold -= 1;
                medicalCostSummary = ' (paid 1 gold medical cost)';
            } else {
                updatedDefendingPlayer.fame = Math.max(0, updatedDefendingPlayer.fame - 1);
                medicalCostSummary = ' (lost 1 fame for medical cost)';
            }

            // Move defending champion home
            updatedDefendingChampion = {
                ...defendingChampion,
                position: defendingPlayer.homePosition
            };

            // Update defending player's champions
            updatedDefendingPlayer.champions = updatedDefendingPlayer.champions.map(c =>
                c.id === defendingChampion.id ? updatedDefendingChampion : c
            );

            summary = `${attackingPlayer.name} defeated ${defendingPlayer.name}'s champion${defendingChampion.id} (${attackerRoll} vs ${defenderRoll})${medicalCostSummary}`;
        } else {
            // Defender wins - attacker pays medical costs (but doesn't move)
            let medicalCostSummary = '';
            if (updatedAttackingPlayer.resources.gold >= 1) {
                updatedAttackingPlayer.resources.gold -= 1;
                medicalCostSummary = ' (paid 1 gold medical cost)';
            } else {
                updatedAttackingPlayer.fame = Math.max(0, updatedAttackingPlayer.fame - 1);
                medicalCostSummary = ' (lost 1 fame for medical cost)';
            }

            summary = `${defendingPlayer.name}'s champion${defendingChampion.id} defeated ${attackingPlayer.name} (${defenderRoll} vs ${attackerRoll})${medicalCostSummary}`;
        }

        return {
            attackerWins,
            attackerRoll,
            defenderRoll,
            updatedAttackingPlayer,
            updatedDefendingPlayer,
            updatedDefendingChampion,
            summary
        };
    }

    /**
     * Handle fleeing from monster combat
     */
    fleeFromMonster(player: Player, champion: Champion, monster: Monster): {
        updatedPlayer: Player;
        summary: string;
    } {
        // Lose 1 fame for fleeing
        let updatedPlayer = {
            ...player,
            fame: Math.max(0, player.fame - 1)
        };

        // Move champion home
        const updatedChampions = updatedPlayer.champions.map(c =>
            c.id === champion.id
                ? { ...c, position: player.homePosition }
                : c
        );
        updatedPlayer = { ...updatedPlayer, champions: updatedChampions };

        return {
            updatedPlayer,
            summary: `fled from ${monster.name}, lost 1 fame and returned home`
        };
    }

    private describeResources(resources: Record<string, number>): string {
        const items = [];
        if (resources.food > 0) items.push(`${resources.food} food`);
        if (resources.wood > 0) items.push(`${resources.wood} wood`);
        if (resources.ore > 0) items.push(`${resources.ore} ore`);
        if (resources.gold > 0) items.push(`${resources.gold} gold`);

        return items.length > 0 ? `, gained ${items.join(', ')}` : '';
    }
} 