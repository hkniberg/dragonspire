import type { TileDef } from '../content/tilesDefs';
import type { Position, ResourceType, Tile } from './types';

/**
 * Converts a tile definition to an actual tile object
 */
export function convertTileDefToTile(
    tileDef: TileDef,
    position: Position,
    explored: boolean = true,
    backColor: string = '#90EE90',
    borderColor: string = '#228B22',
    tileGroup?: number
): Tile {
    const tile: Tile = { position, explored, backColor, borderColor };

    if (tileGroup !== undefined) {
        tile.tileGroup = tileGroup;
    }

    if (typeof tileDef === 'string') {
        switch (tileDef) {
            case 'home':
                tile.tileType = 'home';
                tile.resources = { food: 1, wood: 1, ore: 0, gold: 0 };
                break;

            case 'adventure':
                tile.tileType = 'adventure';
                tile.tier = 1;
                tile.adventureTokens = 2;
                break;

            case 'adventure2':
                tile.tileType = 'adventure';
                tile.tier = 2;
                tile.adventureTokens = 2;
                break;

            case 'adventure3':
                tile.tileType = 'adventure';
                tile.tier = 3;
                tile.adventureTokens = 2;
                break;

            case 'doomspire':
                tile.tileType = 'doomspire';
                tile.tier = 3;
                break;

            case 'chapel':
                tile.tileType = 'chapel';
                break;

            case 'trader':
                tile.tileType = 'trader';
                break;

            case 'mercenary':
                tile.tileType = 'mercenary';
                break;

            case 'oasis':
                tile.tileType = 'oasis';
                tile.tier = 1;
                tile.adventureTokens = 2;
                break;

            case 'oasis2':
                tile.tileType = 'oasis';
                tile.tier = 2;
                tile.adventureTokens = 2;
                break;

            case 'food':
                tile.tileType = 'resource';
                tile.resources = { food: 1, wood: 0, ore: 0, gold: 0 };
                break;

            case 'wood':
                tile.tileType = 'resource';
                tile.resources = { food: 0, wood: 1, ore: 0, gold: 0 };
                break;

            case 'ore':
                tile.tileType = 'resource';
                tile.resources = { food: 0, wood: 0, ore: 1, gold: 0 };
                break;

            case 'gold':
                tile.tileType = 'resource';
                tile.resources = { food: 0, wood: 0, ore: 0, gold: 1 };
                break;

            case 'empty':
                tile.tileType = 'empty';
                break;

            default:
                throw new Error(`Unknown tile definition: ${tileDef}`);
        }
    } else if (Array.isArray(tileDef)) {
        // Handle resource arrays like ["food", "wood"] or ["ore", "ore"]
        tile.tileType = 'resource';
        const resources: Record<ResourceType, number> = { food: 0, wood: 0, ore: 0, gold: 0 };

        tileDef.forEach((resource: string) => {
            if (resource in resources) {
                resources[resource as ResourceType]++;
            }
        });

        tile.resources = resources;

        // Star resource tiles with more than one total resource
        const totalResources = Object.values(resources).reduce((sum, count) => sum + count, 0);
        if (totalResources > 1) {
            tile.isStarred = true;
        }
    }

    // Star single resource tiles that somehow have more than one total resource (shouldn't happen with current logic, but for safety)
    if (tile.tileType === 'resource' && tile.resources) {
        const totalResources = Object.values(tile.resources).reduce((sum, count) => sum + count, 0);
        if (totalResources > 1) {
            tile.isStarred = true;
        }
    }

    return tile;
}

// Color constants for tile backs and borders
export const TileColors = {
    // Back colors
    homeBack: '#006400',      // Dark green for home tiles
    tier1Back: '#90EE90',     // Light green for tier 1 and home trio tiles
    tier2Back: '#FFA500',     // Orange for tier 2 tiles
    tier3Back: '#FF4444',     // Red for tier 3 tiles

    // Border colors (darker shades of back colors)
    homeBorder: '#004000',    // Very dark green
    tier1Border: '#228B22',   // Forest green
    tier2Border: '#CC7A00',   // Dark orange
    tier3Border: '#CC0000',   // Dark red
} as const; 