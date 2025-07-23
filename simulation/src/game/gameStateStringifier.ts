import { GameState } from '../game/GameState';
import type { Champion, Player, ResourceType, Tile } from '../lib/types';

export class GameStateStringifier {
    /**
     * Converts a GameState to a readable markdown string
     */
    public static stringify(gameState: GameState): string {
        const sections: string[] = [];

        // Game session section
        sections.push(this.formatGameSession(gameState));

        // Players section
        sections.push(this.formatPlayers(gameState));

        // Board section
        sections.push(this.formatBoard(gameState));

        return sections.join('\n\n');
    }

    private static formatGameSession(gameState: GameState): string {
        const currentPlayer = gameState.getCurrentPlayer();
        return `# Game session
- Current round: ${gameState.currentRound}
- Current player: ${currentPlayer.name}`;
    }

    private static formatPlayers(gameState: GameState): string {
        const sections: string[] = ['# Players'];

        for (const player of gameState.players) {
            sections.push(this.formatPlayer(player, gameState));
        }

        return sections.join('\n\n');
    }

    private static formatPlayer(player: Player, gameState: GameState): string {
        const lines: string[] = [`## ${player.name}`];

        // Basic stats
        lines.push(`- Might: ${player.might}`);
        lines.push(`- Fame: ${player.fame}`);
        lines.push(`- Home: ${this.formatPosition(player.homePosition)}`);

        // Resources
        const resourceStr = this.formatResources(player.resources);
        lines.push(`- Resource stockpile: ${resourceStr || 'none'}`);

        // Champions
        for (const champion of player.champions) {
            lines.push(this.formatChampion(champion, player.name));
        }

        // Boats
        for (const boat of player.boats) {
            lines.push(`- boat${boat.id} at (${boat.position})`);
        }

        // Claims
        const claimedTiles = this.getClaimedTiles(player.id, gameState);
        if (claimedTiles.length > 0) {
            lines.push(`- claims (${claimedTiles.length} tiles of max ${player.maxClaims}):`);
            for (const tile of claimedTiles) {
                lines.push(this.formatClaimedTile(tile, gameState));
            }
        } else {
            lines.push('- no claims');
        }

        return lines.join('\n');
    }

    private static formatChampion(champion: Champion, playerName: string): string {
        let line = `- champion${champion.id} at ${this.formatPosition(champion.position)}`;

        // Add treasures
        for (const treasure of champion.treasures) {
            line += `\n  - Has ${treasure}`;
        }

        return line;
    }

    private static getClaimedTiles(playerId: number, gameState: GameState): Tile[] {
        const claimedTiles: Tile[] = [];
        for (const row of gameState.board.getTilesGrid()) {
            for (const tile of row) {
                if (tile.claimedBy === playerId) {
                    claimedTiles.push(tile);
                }
            }
        }
        return claimedTiles;
    }

    private static formatClaimedTile(tile: Tile, gameState: GameState): string {
        let line = `  - Tile ${this.formatPosition(tile.position)}`;

        if (tile.resources) {
            const resourceStr = this.formatResources(tile.resources);
            if (resourceStr) {
                line += ` providing ${resourceStr}`;
            }
        }

        // Check if blockaded
        const blockadingChampions = this.getChampionsOnTile(tile.position, gameState)
            .filter(champ => champ.playerId !== tile.claimedBy);

        if (blockadingChampions.length > 0) {
            const blockader = blockadingChampions[0];
            const player = gameState.getPlayerById(blockader.playerId);
            line += ` (blockaded by ${player?.name} champion${blockader.id})`;
        }

        return line;
    }

    private static formatBoard(gameState: GameState): string {
        const sections: string[] = ['# Board'];

        // Only show interesting tiles (explored tiles or tiles with champions)
        const interestingTiles: Tile[] = [];

        for (const row of gameState.board.getTilesGrid()) {
            for (const tile of row) {
                if (this.isTileInteresting(tile, gameState)) {
                    interestingTiles.push(tile);
                }
            }
        }

        for (const tile of interestingTiles) {
            sections.push(this.formatTile(tile, gameState));
        }

        return sections.join('\n\n');
    }

    private static isTileInteresting(tile: Tile, gameState: GameState): boolean {
        // Show explored tiles, tiles with champions, or home tiles
        if (tile.explored || tile.tileType === 'home') {
            return true;
        }

        // Show tiles with champions
        const championsOnTile = this.getChampionsOnTile(tile.position, gameState);
        return championsOnTile.length > 0;
    }

    private static formatTile(tile: Tile, gameState: GameState): string {
        const lines: string[] = [`Tile ${this.formatPosition(tile.position)}`];

        if (!tile.explored) {
            lines.push(`- Unexplored tier ${tile.tier} tile`);
        } else {
            // Format based on tile type
            switch (tile.tileType) {
                case 'home':
                    const homeOwner = this.getPlayerByHomePosition(tile.position, gameState);
                    lines.push(`- Home tile for ${homeOwner?.name || 'unknown'}`);
                    break;
                case 'resource':
                    if (tile.resources) {
                        const resourceStr = this.formatResources(tile.resources);
                        if (resourceStr) {
                            lines.push(`- Resource tile providing ${resourceStr}`);
                        }
                    }
                    if (tile.isStarred) {
                        lines.push('- Starred');
                    }
                    if (tile.claimedBy) {
                        const player = gameState.getPlayerById(tile.claimedBy);
                        lines.push(`- Claimed by ${player?.name || 'unknown'}`);
                    } else {
                        lines.push('- Unclaimed');
                    }
                    if (tile.monster) {
                        lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
                    }
                    break;
                case 'adventure':
                    lines.push(`- Tier ${tile.tier} adventure tile`);
                    if (tile.adventureTokens !== undefined) {
                        lines.push(`- Remaining adventure tokens: ${tile.adventureTokens}`);
                    }
                    if (tile.monster) {
                        lines.push(`- Monster: ${tile.monster.name} (might ${tile.monster.might})`);
                    }
                    break;
                case 'chapel':
                    lines.push('- Chapel');
                    break;
                case 'trader':
                    lines.push('- Trader');
                    break;
                case 'mercenary':
                    lines.push('- Mercenary camp');
                    break;
                case 'doomspire':
                    lines.push('- Doomspire Dragon (might 13)');
                    break;
                default:
                    lines.push(`- Tier ${tile.tier} tile`);
            }
        }

        // Add champions on this tile
        const championsOnTile = this.getChampionsOnTile(tile.position, gameState);
        for (const champion of championsOnTile) {
            const player = gameState.getPlayerById(champion.playerId);
            lines.push(`- ${player?.name || 'unknown'} champion${champion.id} is here`);
        }

        return lines.join('\n');
    }

    private static getChampionsOnTile(position: { row: number; col: number }, gameState: GameState): Champion[] {
        const champions: Champion[] = [];
        for (const player of gameState.players) {
            for (const champion of player.champions) {
                if (champion.position.row === position.row && champion.position.col === position.col) {
                    champions.push(champion);
                }
            }
        }
        return champions;
    }

    private static getPlayerByHomePosition(position: { row: number; col: number }, gameState: GameState): Player | undefined {
        return gameState.players.find(player =>
            player.homePosition.row === position.row && player.homePosition.col === position.col
        );
    }

    private static formatPosition(position: { row: number; col: number }): string {
        return `(${position.row},${position.col})`;
    }

    private static formatResources(resources: Record<ResourceType, number>): string {
        const parts: string[] = [];

        if (resources.food > 0) {
            parts.push(`${resources.food} food`);
        }
        if (resources.wood > 0) {
            parts.push(`${resources.wood} wood`);
        }
        if (resources.ore > 0) {
            parts.push(`${resources.ore} ore`);
        }
        if (resources.gold > 0) {
            parts.push(`${resources.gold} gold`);
        }

        return parts.join(', ');
    }
} 