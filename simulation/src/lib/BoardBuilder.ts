// Lords of Doomspire Board Builder

import { getMonsterByName } from '../content/monsterCards';
import { HOME_TILE_TRIOS, TIER_1_TRIOS, TIER_2_TRIOS, type TileDef, type TileTrioDef } from '../content/tilesDefs';
import { Board } from './Board';
import { convertTileDefToTile, TileColors } from './TileConverter';
import { calculateTrioPlacement, type Rotation } from './tilePlacementUtils';
import type {
    Position
} from './types';



export class BoardBuilder {
    private seedValue: number;
    private currentGroupId: number = 1;

    constructor(seed: number = 0) {
        this.seedValue = seed;
    }

    /**
     * Simple pseudo-random number generator using Linear Congruential Generator
     * Returns a number between 0 and 1 (exclusive)
     */
    private seededRandom(): number {
        this.seedValue = (this.seedValue * 1664525 + 1013904223) % 2 ** 32;
        return this.seedValue / 2 ** 32;
    }

    /**
     * Utility function to shuffle an array using seeded random
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Builds an 8x8 board with home tile trios in each corner, tier 1 trios, tier 2 trios, and tier 3 trios
     */
    public buildBoard(): Board {
        const board = new Board(8, 8);

        // Place home tile trios in each corner
        this.placeHomeTileTrios(board);

        // Place tier 1 trios at specified positions
        this.placeTier1Trios(board);

        // Place tier 2 trios at specified positions
        this.placeTier2Trios(board);

        // Place tier 3 trios in central positions
        this.placeTier3Trios(board);

        return board;
    }

    /**
     * Places home tile trios in each corner with proper rotations
     */
    private placeHomeTileTrios(board: Board): void {
        const cornerConfigs = [
            { corner: { row: 0, col: 0 }, rotation: 0 as Rotation }, // NW - no rotation
            { corner: { row: 0, col: 7 }, rotation: 1 as Rotation }, // NE - 90° rotation
            { corner: { row: 7, col: 7 }, rotation: 2 as Rotation }, // SE - 180° rotation
            { corner: { row: 7, col: 0 }, rotation: 3 as Rotation }, // SW - 270° rotation
        ];

        // Randomly shuffle the home tile trios to assign to corners
        const shuffledTrios = this.shuffleArray([...HOME_TILE_TRIOS]);

        cornerConfigs.forEach(({ corner, rotation }, index) => {
            // Get a random home tile trio definition for this corner
            const trioIndex = index % shuffledTrios.length;
            const trioDef = shuffledTrios[trioIndex];

            // Calculate the positions for the trio tiles
            const positions = calculateTrioPlacement(corner, rotation);

            // Place the tiles with different colors: darker green for home tile, regular green for others
            this.placeHomeTrio(board, trioDef, positions, true);
        });
    }

    /**
     * Places a home trio with special coloring: darker green for home tile, regular green for others
     */
    private placeHomeTrio(
        board: Board,
        trioDef: TileTrioDef,
        positions: Position[],
        explored: boolean
    ): void {
        const tileDefs = [trioDef.corner, trioDef.right, trioDef.below];
        const groupId = this.currentGroupId++;

        tileDefs.forEach((tileDef, index) => {
            const backColor = tileDef === 'home' ? TileColors.homeBack : TileColors.tier1Back;
            const borderColor = tileDef === 'home' ? TileColors.homeBorder : TileColors.tier1Border;
            const tile = convertTileDefToTile(tileDef, positions[index], explored, backColor, borderColor, groupId);
            board.setTile(tile);
        });
    }

    /**
     * Places tier 1 trios at specified positions with specified rotations
     */
    private placeTier1Trios(board: Board): void {
        const tier1Placements = [
            { corner: { row: 0, col: 4 }, rotation: 1 as Rotation },
            { corner: { row: 1, col: 2 }, rotation: 3 as Rotation },
            { corner: { row: 1, col: 5 }, rotation: 3 as Rotation },
            { corner: { row: 2, col: 1 }, rotation: 2 as Rotation },
            { corner: { row: 2, col: 6 }, rotation: 0 as Rotation },
            { corner: { row: 3, col: 0 }, rotation: 0 as Rotation },
            { corner: { row: 4, col: 7 }, rotation: 2 as Rotation },
            { corner: { row: 5, col: 1 }, rotation: 2 as Rotation },
            { corner: { row: 5, col: 6 }, rotation: 0 as Rotation },
            { corner: { row: 6, col: 2 }, rotation: 1 as Rotation },
            { corner: { row: 6, col: 5 }, rotation: 1 as Rotation },
            { corner: { row: 7, col: 3 }, rotation: 3 as Rotation },
        ];

        // Randomly shuffle the tier 1 trios to assign to positions
        const shuffledTrios = this.shuffleArray([...TIER_1_TRIOS]);

        tier1Placements.forEach(({ corner, rotation }, index) => {
            // Get a random tier 1 trio definition for this position
            const trioIndex = index % shuffledTrios.length;
            const trioDef = shuffledTrios[trioIndex];

            // Calculate the positions for the trio tiles
            const positions = calculateTrioPlacement(corner, rotation);

            // Place the tiles with green back color and forest green border
            this.placeTrio(board, trioDef, positions, true, TileColors.tier1Back, TileColors.tier1Border);
        });
    }

    /**
     * Places tier 2 trios at specified positions with specified rotations
     */
    private placeTier2Trios(board: Board): void {
        const tier2Placements = [
            { corner: { row: 2, col: 2 }, rotation: 0 as Rotation },
            { corner: { row: 2, col: 5 }, rotation: 1 as Rotation },
            { corner: { row: 5, col: 5 }, rotation: 2 as Rotation },
            { corner: { row: 5, col: 2 }, rotation: 3 as Rotation },
        ];

        // Randomly shuffle the tier 2 trios to assign to positions
        const shuffledTrios = this.shuffleArray([...TIER_2_TRIOS]);

        tier2Placements.forEach(({ corner, rotation }, index) => {
            // Get a random tier 2 trio definition for this position
            const trioIndex = index % shuffledTrios.length;
            const trioDef = shuffledTrios[trioIndex];

            // Calculate the positions for the trio tiles
            const positions = calculateTrioPlacement(corner, rotation);

            // Place the tiles with orange back color and dark orange border
            this.placeTrio(board, trioDef, positions, false, TileColors.tier2Back, TileColors.tier2Border);
        });
    }

    /**
     * Places tier 3 trios in the central four positions with random rotations
     */
    private placeTier3Trios(board: Board): void {
        const centralPositions = [
            { row: 3, col: 3 },
            { row: 3, col: 4 },
            { row: 4, col: 3 },
            { row: 4, col: 4 },
        ];

        // Create array with 3 adventure3 tiles and 1 doomspire tile
        const tier3Tiles = ['adventure3', 'adventure3', 'adventure3', 'doomspire'];

        // Shuffle the tiles to randomize placement
        const shuffledTiles = this.shuffleArray([...tier3Tiles]);

        centralPositions.forEach((position, index) => {
            const tileDef = shuffledTiles[index] as TileDef;
            const tile = convertTileDefToTile(tileDef, position, false, TileColors.tier3Back, TileColors.tier3Border);
            board.setTile(tile);
        });
    }

    /**
     * Places a trio of tiles on the board at the specified positions,
     * making sure that the tiles don't already exist on the board.
     */
    private placeTrio(
        board: Board,
        trioDef: TileTrioDef,
        positions: Position[],
        explored: boolean,
        backColor: string,
        borderColor: string
    ): void {
        const tileDefs = [trioDef.corner, trioDef.right, trioDef.below];
        const groupId = this.currentGroupId++;

        tileDefs.forEach((tileDef, index) => {
            const position = positions[index];
            const existingTile = board.getTileAt(position);

            if (existingTile && existingTile.tileType != 'empty') {
                console.log(`Tile at ${position.row},${position.col} already exists`);
                console.log(`I was placing trioDef: ${JSON.stringify(trioDef)}`);
                console.log(`I was placing it at positions: ${JSON.stringify(positions)}`);
                console.log(`I found an existing tile: ${JSON.stringify(existingTile)}`);
                throw new Error(`Tile at ${position.row},${position.col} already exists`);
            }

            const tile = convertTileDefToTile(tileDef, positions[index], explored, backColor, borderColor, groupId);

            // Add monsters to appropriate tiles
            this.addMonsterToTile(tile, backColor);

            board.setTile(tile);
        });
    }

    /**
     * Adds monsters to tiles based on tier and tile type
     */
    private addMonsterToTile(tile: any, backColor: string): void {
        // For tier 1 zone (light green), place Wolf on starred resource tiles
        if (backColor === TileColors.tier1Back && tile.tileType === 'resource' && tile.isStarred) {
            const wolfMonster = getMonsterByName('Wolf');
            if (wolfMonster) {
                tile.monster = {
                    name: wolfMonster.name,
                    tier: wolfMonster.tier,
                    icon: wolfMonster.icon,
                    might: wolfMonster.might,
                    fame: wolfMonster.fame,
                    resources: wolfMonster.resources
                };
            }
        }

        // For tier 2 zone (orange), place Bandit on all resource tiles
        if (backColor === TileColors.tier2Back && tile.tileType === 'resource') {
            const banditMonster = getMonsterByName('Bandit');
            if (banditMonster) {
                tile.monster = {
                    name: banditMonster.name,
                    tier: banditMonster.tier,
                    icon: banditMonster.icon,
                    might: banditMonster.might,
                    fame: banditMonster.fame,
                    resources: banditMonster.resources
                };
            }
        }
    }


    /**
     * Static method to build a board with specified seed
     */
    public static buildBoard(seed: number = 0): Board {
        const builder = new BoardBuilder(seed);
        return builder.buildBoard();
    }
} 