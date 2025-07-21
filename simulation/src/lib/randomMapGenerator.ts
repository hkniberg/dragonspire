// Lords of Doomspire Random Map Generator

import type {
    Position,
    ResourceType,
    Tile,
    TileTier
} from './types';

export class RandomMapGenerator {
    // Hard-coded seed for deterministic map generation
    private static readonly SEED = 12345;
    private static seedValue = this.SEED;

    /**
     * Simple pseudo-random number generator using Linear Congruential Generator
     * Returns a number between 0 and 1 (exclusive)
     */
    private static seededRandom(): number {
        this.seedValue = (this.seedValue * 1664525 + 1013904223) % 2 ** 32;
        return this.seedValue / 2 ** 32;
    }

    /**
     * Reset the seed to the initial value
     */
    private static resetSeed(): void {
        this.seedValue = this.SEED;
    }

    /**
     * Generates a random 8x8 board with tier-based layout according to board setup rules
     */
    public static generateBoard(): Tile[][] {
        // Reset seed for consistent generation
        this.resetSeed();

        const board: Tile[][] = [];

        // Initialize empty board
        for (let row = 0; row < 8; row++) {
            board[row] = [];
            for (let col = 0; col < 8; col++) {
                const position: Position = { row, col };
                const distanceFromCenter = Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5));

                let tier: TileTier;
                let explored = false;

                if (distanceFromCenter >= 2.5) {
                    tier = 1;
                    explored = true; // Tier 1 tiles start explored
                } else if (distanceFromCenter >= 1.5) {
                    tier = 2;
                } else {
                    tier = 3;
                }

                // Initialize basic tile structure
                const tile: Tile = {
                    position,
                    tier,
                    explored,
                    adventureTokens: 0,
                };

                board[row].push(tile);
            }
        }

        // Place special tiles according to board setup rules
        this.placeSpecialTiles(board);
        this.generateTileContent(board);

        return board;
    }

    /**
     * Places special tiles according to board setup rules
     */
    private static placeSpecialTiles(board: Tile[][]): void {
        // Place 4 player home tiles in corners (Tier 1)
        // Each home tile is claimed by the corresponding player and provides wood OR food
        const homePositions = [
            { pos: { row: 0, col: 0 }, playerId: 1 },
            { pos: { row: 0, col: 7 }, playerId: 2 },
            { pos: { row: 7, col: 0 }, playerId: 3 },
            { pos: { row: 7, col: 7 }, playerId: 4 }
        ];

        homePositions.forEach(({ pos, playerId }) => {
            const tile = board[pos.row][pos.col];
            tile.tileType = 'home';
            tile.claimedBy = playerId;
            // Home tiles provide both wood and food (OR logic handled during harvesting)
            tile.resources = { food: 1, wood: 1, ore: 0, gold: 0 };
            tile.isStarred = false; // Home tiles are not starred
        });

        // Place doomspire in center (Tier 3)
        board[3][3].tileType = 'doomspire';

        // Collect available Tier 1 positions (excluding corners and doomspire)
        const tier1Positions: Position[] = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const tile = board[row][col];
                if (tile.tier === 1 && !tile.tileType) {
                    tier1Positions.push({ row, col });
                }
            }
        }

        // Randomly place chapel, trader, and mercenary in Tier 1
        const specialTiles = ['chapel', 'trader', 'mercenary'] as const;
        const shuffledPositions = this.shuffleArray([...tier1Positions]);

        for (let i = 0; i < specialTiles.length && i < shuffledPositions.length; i++) {
            const pos = shuffledPositions[i];
            board[pos.row][pos.col].tileType = specialTiles[i];
        }
    }

    /**
     * Generates content for tiles based on their tier and type
     */
    private static generateTileContent(board: Tile[][]): void {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const tile = board[row][col];

                // Skip tiles that already have special types
                if (tile.tileType) {
                    continue;
                }

                // Generate content based on tier
                if (tile.tier === 1) {
                    // Tier 1: Mix of resource and adventure tiles
                    if (this.seededRandom() < 0.6) {
                        this.makeResourceTile(tile);
                    } else {
                        this.makeAdventureTile(tile);
                    }
                } else if (tile.tier === 2) {
                    // Tier 2: Mix of resource and adventure tiles (better resources)
                    if (this.seededRandom() < 0.5) {
                        this.makeResourceTile(tile, true); // Better resources
                    } else {
                        this.makeAdventureTile(tile);
                    }
                } else if (tile.tier === 3) {
                    // Tier 3: Only adventure tiles
                    this.makeAdventureTile(tile);
                }
            }
        }
    }

    /**
     * Converts a tile to a resource tile
     */
    private static makeResourceTile(tile: Tile, isBetter: boolean = false): void {
        tile.tileType = 'resource';
        tile.resources = this.generateRandomResources(isBetter);
        tile.isStarred = this.seededRandom() < 0.1; // 10% chance of starred resource
        tile.adventureTokens = 0;
    }

    /**
     * Converts a tile to an adventure tile
     */
    private static makeAdventureTile(tile: Tile): void {
        tile.tileType = 'adventure';
        tile.adventureTokens = 2; // Adventure tiles get 2 tokens
        delete tile.resources;
        delete tile.isStarred;
        delete tile.claimedBy;
    }

    /**
     * Generates random resources for a tile
     */
    private static generateRandomResources(isBetter: boolean = false): Record<ResourceType, number> {
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];

        // Determine if this should be a dual-resource tile
        const dualResourceChance = isBetter ? 0.4 : 0.15; // 40% for tier 2, 15% for tier 1
        const isDualResource = this.seededRandom() < dualResourceChance;

        if (isDualResource) {
            // Create a tile with two different resource types
            const shuffledTypes = this.shuffleArray([...resourceTypes]);
            const firstType = shuffledTypes[0];
            const secondType = shuffledTypes[1];

            const baseAmount = isBetter ? 1 : 1;
            const firstAmount = baseAmount + Math.floor(this.seededRandom() * (isBetter ? 2 : 1));
            const secondAmount = baseAmount + Math.floor(this.seededRandom() * (isBetter ? 2 : 1));

            return {
                [firstType]: firstAmount,
                [secondType]: secondAmount
            } as Record<ResourceType, number>;
        } else {
            // Create a single-resource tile (existing logic)
            const randomType = resourceTypes[Math.floor(this.seededRandom() * resourceTypes.length)];

            // Better resources for Tier 2
            const baseAmount = isBetter ? 2 : 1;
            const amount = baseAmount + Math.floor(this.seededRandom() * (isBetter ? 3 : 2));

            // Only include the resource type that has a non-zero value
            return {
                [randomType]: amount
            } as Record<ResourceType, number>;
        }
    }

    /**
     * Utility function to shuffle an array
     */
    private static shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generates a deterministic board for testing purposes
     */
    public static generateTestBoard(): Tile[][] {
        // TODO: Implement deterministic board generation for testing
        // For now, just return the random board
        return this.generateBoard();
    }
} 