// Lords of Doomspire Game Rules Engine

import { GameState, rollD3 } from '../game/GameState';
import { GameDecks } from '../lib/cards';
import { getMonsterByName } from '../lib/content/monsterCards';
import type {
    GameAction,
    HarvestAction,
    MoveBoatAction,
    MoveChampionAction,
    Position,
    ResourceType
} from '../lib/types';
import { ActionResult } from '../players/Player';
import { CombatResolver } from './CombatResolver';

export class ActionExecutor {
    private static combatResolver: CombatResolver = new CombatResolver();

    /**
     * Set a custom combat resolver (useful for testing)
     */
    public static setCombatResolver(combatResolver: CombatResolver): void {
        this.combatResolver = combatResolver;
    }

    /**
     * Validates and executes a game action, returning the new state and summary
     */
    public static executeAction(gameState: GameState, action: GameAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        try {
            switch (action.type) {
                case 'moveChampion':
                    return ActionExecutor.executeMoveChampion(gameState, action, diceValues, gameDecks);
                case 'moveBoat':
                    return ActionExecutor.executeMoveBoat(gameState, action, diceValues, gameDecks);
                case 'harvest':
                    return ActionExecutor.executeHarvest(gameState, action, diceValues);
                default:
                    return {
                        newGameState: gameState,
                        summary: `Unknown action type: ${(action as any).type}`,
                        success: false,
                        diceValuesUsed: diceValues
                    };
            }
        } catch (error) {
            return {
                newGameState: gameState,
                summary: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }
    }

    /**
 * Handles all the logic for a champion arriving at a tile (exploration, battles, claiming, etc.)
 */
    private static executeChampionArrival(
        gameState: GameState,
        playerId: number,
        championId: number,
        destination: Position,
        claimTile: boolean = false,
        gameDecks?: GameDecks
    ): ActionResult {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${playerId} not found`,
                success: false
            };
        }

        const champion = gameState.getChampionById(playerId, championId);
        if (!champion) {
            return {
                newGameState: gameState,
                summary: `Champion ${championId} not found for player ${playerId}`,
                success: false
            };
        }

        const destinationTile = gameState.getTile(destination);
        if (!destinationTile) {
            return {
                newGameState: gameState,
                summary: `Invalid destination: tile at (${destination.row}, ${destination.col}) does not exist`,
                success: false
            };
        }

        // Validate home tile access
        if (destinationTile.tileType === 'home') {
            const homeOwner = ActionExecutor.getHomeTileOwner(destination);
            if (homeOwner && homeOwner !== playerId) {
                return {
                    newGameState: gameState,
                    summary: `Cannot enter home tile at (${destination.row}, ${destination.col}): belongs to player ${homeOwner}`,
                    success: false
                };
            }
        }

        // Check for champions on destination tile
        const destinationChampions = gameState.players
            .flatMap(p => p.champions)
            .filter(c => c.position.row === destination.row && c.position.col === destination.col);

        let battleSummary = '';
        let updatedGameState = gameState;

        // Handle champion vs champion battles first
        if (destinationChampions.length > 0) {
            const existingChampion = destinationChampions[0];

            // Allow staying in the same position (e.g., to claim a tile)
            if (existingChampion.playerId === playerId && existingChampion.id === championId) {
                // Champion is staying in the same position - this is allowed
            } else if (existingChampion.playerId === playerId) {
                // Different champion from same player - not allowed
                return {
                    newGameState: gameState,
                    summary: `Cannot move to tile (${destination.row}, ${destination.col}): already occupied by your champion${existingChampion.id}`,
                    success: false
                };
            } else {
                // Champion vs champion battle
                const defendingPlayer = gameState.getPlayerById(existingChampion.playerId);
                if (!defendingPlayer) {
                    return {
                        newGameState: gameState,
                        summary: `Defending player ${existingChampion.playerId} not found`,
                        success: false
                    };
                }

                const combatResult = ActionExecutor.combatResolver.resolveChampionCombat(
                    player,
                    defendingPlayer,
                    existingChampion
                );

                if (!combatResult.attackerWins) {
                    // Attacker lost - cannot move to tile
                    const updatedPlayers = gameState.players.map(p =>
                        p.id === player.id ? combatResult.updatedAttackingPlayer : p
                    );

                    return {
                        newGameState: gameState.withUpdates({ players: updatedPlayers }),
                        summary: `Champion battle: ${combatResult.summary} - cannot move to tile`,
                        success: false
                    };
                } else {
                    // Attacker won - update both players and continue with tile logic
                    const updatedPlayers = gameState.players.map(p => {
                        if (p.id === player.id) return combatResult.updatedAttackingPlayer;
                        if (p.id === defendingPlayer.id) return combatResult.updatedDefendingPlayer;
                        return p;
                    });

                    updatedGameState = gameState.withUpdates({ players: updatedPlayers });
                    battleSummary = ` and ${combatResult.summary}`;
                }
            }
        }

        // Check for existing monsters on the tile and handle combat BEFORE claiming
        let updatedBoard = updatedGameState.board;
        let updatedPlayer = updatedGameState.getPlayerById(playerId)!;
        let existingMonsterCombatSummary = '';

        if (destinationTile.monster) {
            // There's an existing monster on this tile - must defeat it first
            const combatResult = ActionExecutor.combatResolver.resolveMonsterCombat(
                updatedPlayer,
                champion,
                destinationTile.monster
            );

            if (combatResult.championReturnedHome) {
                // Champion lost and went home
                const updatedChampions = combatResult.updatedPlayer.champions;
                const finalPlayer = { ...combatResult.updatedPlayer, champions: updatedChampions };
                const finalPlayers = updatedGameState.players.map(p =>
                    p.id === playerId ? finalPlayer : p
                );

                const newGameState = updatedGameState.withUpdates({
                    board: updatedBoard,
                    players: finalPlayers
                });

                return {
                    newGameState,
                    summary: `Champion${championId} fought ${destinationTile.monster.name} and ${combatResult.summary}`,
                    success: true
                };
            } else {
                // Champion won - remove monster from tile and continue
                updatedPlayer = combatResult.updatedPlayer;
                existingMonsterCombatSummary = ` and ${combatResult.summary}`;

                // Remove the monster from the tile
                const updatedTile = {
                    ...destinationTile,
                    monster: undefined
                };
                updatedBoard = updatedGameState.board.map((row, rowIndex) =>
                    row.map((tile, colIndex) =>
                        rowIndex === destination.row && colIndex === destination.col
                            ? updatedTile
                            : tile
                    )
                );

                // Update the destination tile reference for subsequent logic
                destinationTile.monster = undefined;
            }
        }

        // Now validate claiming if requested (after monster combat)
        if (claimTile) {
            // Check if tile is a resource tile
            if (destinationTile.tileType !== 'resource') {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile at (${destination.row}, ${destination.col}): not a resource tile`,
                    success: false
                };
            }

            // Check if tile is already claimed
            if (destinationTile.claimedBy !== undefined) {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile at (${destination.row}, ${destination.col}): already claimed by player ${destinationTile.claimedBy}`,
                    success: false
                };
            }

            // Check if player has claims available
            const currentClaims = gameState.board
                .flat()
                .filter(tile => tile.claimedBy === playerId).length;

            if (currentClaims >= player.maxClaims) {
                return {
                    newGameState: gameState,
                    summary: `Cannot claim tile: Player ${playerId} has reached maximum claims (${player.maxClaims})`,
                    success: false
                };
            }
        }

        // Handle exploration
        let explorationSummary = '';

        if (!destinationTile.explored) {
            // Reveal the tile
            const revealedTile = { ...updatedBoard[destination.row][destination.col], explored: true };
            updatedBoard = updatedBoard.map((row, rowIndex) =>
                row.map((tile, colIndex) =>
                    rowIndex === destination.row && colIndex === destination.col
                        ? revealedTile
                        : tile
                )
            );

            // Grant 1 fame for exploring the tile
            updatedPlayer = { ...updatedPlayer, fame: updatedPlayer.fame + 1 };
            explorationSummary = ` and explored a new tile (gained 1 Fame)`;
        }

        // Handle tile claiming if requested (after monster is defeated)
        let claimSummary = '';
        if (claimTile) {
            const updatedTile = { ...updatedBoard[destination.row][destination.col], claimedBy: playerId };
            updatedBoard = updatedBoard.map((row, rowIndex) =>
                row.map((tile, colIndex) =>
                    rowIndex === destination.row && colIndex === destination.col
                        ? updatedTile
                        : tile
                )
            );

            // Generate resource description
            const resourceDesc = ActionExecutor.getTileResourceDescription(updatedTile);
            claimSummary = ` and claimed a resource tile${resourceDesc}`;
        }

        // Check for blockading (landing on opponent's claimed resource tile)
        let blockadeSummary = '';
        if (destinationTile.tileType === 'resource' &&
            destinationTile.claimedBy !== undefined &&
            destinationTile.claimedBy !== playerId) {
            const opponentPlayer = updatedGameState.getPlayerById(destinationTile.claimedBy);
            const opponentName = opponentPlayer?.name || `Player ${destinationTile.claimedBy}`;
            const resourceDesc = ActionExecutor.getTileResourceDescription(destinationTile);
            blockadeSummary = ` and blockaded ${opponentName}'s resource tile${resourceDesc}`;
        }

        // Handle adventure tiles and NEW monster encounters (from adventure tokens)
        let adventureSummary = '';
        let newMonsterCombatSummary = '';
        if (destinationTile.tileType === 'adventure' && gameDecks && destinationTile.adventureTokens && destinationTile.adventureTokens > 0) {
            // Draw a card from the appropriate tier (for now, draw from deck 1)
            const drawnCard = gameDecks.drawCard(destinationTile.tier, 1);

            if (drawnCard) {
                if (drawnCard.type === 'monster') {
                    // Look up monster stats
                    const monster = getMonsterByName(drawnCard.name);
                    if (monster) {
                        // Initiate monster combat
                        const combatResult = ActionExecutor.combatResolver.resolveMonsterCombat(
                            updatedPlayer,
                            champion,
                            monster
                        );

                        if (combatResult.championReturnedHome) {
                            // Champion lost and went home - update champion position and player
                            const updatedChampions = combatResult.updatedPlayer.champions;
                            const finalPlayer = { ...combatResult.updatedPlayer, champions: updatedChampions };
                            const finalPlayers = updatedGameState.players.map(p =>
                                p.id === playerId ? finalPlayer : p
                            );

                            // Reduce adventure tokens and place monster on tile
                            const updatedTile = {
                                ...updatedBoard[destination.row][destination.col],
                                adventureTokens: destinationTile.adventureTokens - 1,
                                monster: monster
                            };
                            updatedBoard = updatedBoard.map((row, rowIndex) =>
                                row.map((tile, colIndex) =>
                                    rowIndex === destination.row && colIndex === destination.col
                                        ? updatedTile
                                        : tile
                                )
                            );

                            const newGameState = updatedGameState.withUpdates({
                                board: updatedBoard,
                                players: finalPlayers
                            });

                            return {
                                newGameState,
                                summary: `Champion${championId} encountered ${monster.name} and ${combatResult.summary}`,
                                success: true
                            };
                        } else {
                            // Champion won - update player stats and reduce adventure tokens
                            updatedPlayer = combatResult.updatedPlayer;
                            newMonsterCombatSummary = ` and ${combatResult.summary}`;

                            // Reduce adventure tokens
                            const updatedTile = {
                                ...updatedBoard[destination.row][destination.col],
                                adventureTokens: destinationTile.adventureTokens - 1
                            };
                            updatedBoard = updatedBoard.map((row, rowIndex) =>
                                row.map((tile, colIndex) =>
                                    rowIndex === destination.row && colIndex === destination.col
                                        ? updatedTile
                                        : tile
                                )
                            );
                        }
                    } else {
                        adventureSummary = `, drew ${drawnCard.name} monster card but monster stats not found`;
                    }
                } else {
                    // For now, ignore non-monster cards
                    adventureSummary = `, drew a ${drawnCard.type} card (${drawnCard.name}) - non-monster cards temporarily ignored`;

                    // Still reduce adventure tokens
                    const updatedTile = {
                        ...updatedBoard[destination.row][destination.col],
                        adventureTokens: destinationTile.adventureTokens - 1
                    };
                    updatedBoard = updatedBoard.map((row, rowIndex) =>
                        row.map((tile, colIndex) =>
                            rowIndex === destination.row && colIndex === destination.col
                                ? updatedTile
                                : tile
                        )
                    );
                }
            } else {
                adventureSummary = `, adventure tile has no more cards`;
            }
        } else if (destinationTile.tileType === 'adventure') {
            if (!destinationTile.monster && (!destinationTile.adventureTokens || destinationTile.adventureTokens === 0)) {
                adventureSummary = `, adventure tile with no tokens or monsters`;
            }
        }

        // Create new game state with champion moved
        const updatedChampions = updatedPlayer.champions.map(c =>
            c.id === championId
                ? { ...c, position: destination }
                : c
        );

        const finalPlayer = { ...updatedPlayer, champions: updatedChampions };
        const updatedPlayers = updatedGameState.players.map(p =>
            p.id === playerId ? finalPlayer : p
        );

        const newGameState = updatedGameState.withUpdates({
            board: updatedBoard,
            players: updatedPlayers
        });

        return {
            newGameState,
            summary: `Champion${championId} arrived at (${destination.row}, ${destination.col})${adventureSummary}${battleSummary}${existingMonsterCombatSummary}${explorationSummary}${claimSummary}${blockadeSummary}${newMonsterCombatSummary}`,
            success: true
        };
    }

    private static executeMoveChampion(gameState: GameState, action: MoveChampionAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        const champion = gameState.getChampionById(action.playerId, action.championId);
        if (!champion) {
            return {
                newGameState: gameState,
                summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate path
        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Check that path starts from champion's current position
        const startPos = action.path[0];
        if (startPos.row !== champion.position.row || startPos.col !== champion.position.col) {
            return {
                newGameState: gameState,
                summary: `Invalid path: path must start from champion's current position (${champion.position.row}, ${champion.position.col})`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate each step in the path is adjacent
        for (let i = 1; i < action.path.length; i++) {
            if (!ActionExecutor.areAdjacent(action.path[i - 1], action.path[i])) {
                return {
                    newGameState: gameState,
                    summary: `Invalid path: positions (${action.path[i - 1].row}, ${action.path[i - 1].col}) and (${action.path[i].row}, ${action.path[i].col}) are not adjacent`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }
        }

        const destination = action.path[action.path.length - 1];

        // Handle champion arrival at destination
        const arrivalResult = ActionExecutor.executeChampionArrival(gameState, action.playerId, action.championId, destination, action.claimTile, gameDecks);
        if (!arrivalResult.success) {
            return {
                newGameState: gameState,
                summary: arrivalResult.summary,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        return {
            newGameState: arrivalResult.newGameState,
            summary: `Moved champion${action.championId} from (${champion.position.row}, ${champion.position.col}) to (${destination.row}, ${destination.col}). ${arrivalResult.summary}`,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    private static executeMoveBoat(gameState: GameState, action: MoveBoatAction, diceValues?: number[], gameDecks?: GameDecks): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        const boat = player.boats.find(b => b.id === action.boatId);
        if (!boat) {
            return {
                newGameState: gameState,
                summary: `Boat ${action.boatId} not found for player ${action.playerId}`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        if (action.path.length === 0) {
            return {
                newGameState: gameState,
                summary: `Invalid path: empty path`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // For now, just move the boat to the destination
        const destination = action.path[action.path.length - 1];
        const updatedBoats = player.boats.map(b =>
            b.id === action.boatId
                ? { ...b, position: destination as any } // Type assertion for ocean position
                : b
        );

        let updatedGameState = gameState.withUpdates({
            players: gameState.players.map(p =>
                p.id === action.playerId ? { ...p, boats: updatedBoats } : p
            )
        });

        let summary = `Moved boat${action.boatId} to ${destination}`;

        // Handle champion pickup/dropoff if specified
        if (action.championId && action.championDropPosition) {
            const champion = player.champions.find(c => c.id === action.championId);
            if (!champion) {
                return {
                    newGameState: gameState,
                    summary: `Champion ${action.championId} not found for player ${action.playerId}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }

            // Use the same arrival logic as champion movement
            const arrivalResult = ActionExecutor.executeChampionArrival(updatedGameState, action.playerId, action.championId, action.championDropPosition, false, gameDecks);
            if (!arrivalResult.success) {
                return {
                    newGameState: gameState,
                    summary: `${summary}, but champion transport failed: ${arrivalResult.summary}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }

            updatedGameState = arrivalResult.newGameState;
            summary += ` and transported champion${action.championId} to (${action.championDropPosition.row}, ${action.championDropPosition.col}). ${arrivalResult.summary}`;
        }

        return {
            newGameState: updatedGameState,
            summary,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    private static executeHarvest(gameState: GameState, action: HarvestAction, diceValues?: number[]): ActionResult {
        const player = gameState.getPlayerById(action.playerId);
        if (!player) {
            return {
                newGameState: gameState,
                summary: `Player ${action.playerId} not found`,
                success: false,
                diceValuesUsed: diceValues
            };
        }

        // Validate harvest amounts are non-negative
        const resourceTypes: ResourceType[] = ['food', 'wood', 'ore', 'gold'];
        for (const resourceType of resourceTypes) {
            if (action.resources[resourceType] < 0) {
                return {
                    newGameState: gameState,
                    summary: `Invalid harvest: cannot harvest negative ${resourceType}`,
                    success: false,
                    diceValuesUsed: diceValues
                };
            }
        }

        // Calculate total resources being harvested
        const totalHarvested = Object.values(action.resources).reduce((sum, amount) => sum + amount, 0);
        if (totalHarvested === 0) {
            return {
                newGameState: gameState,
                summary: `No resources harvested`,
                success: true,
                diceValuesUsed: diceValues
            };
        }

        // Add resources to player
        const newResources = { ...player.resources };
        for (const resourceType of resourceTypes) {
            newResources[resourceType] += action.resources[resourceType];
        }

        const updatedPlayer = { ...player, resources: newResources };
        const updatedPlayers = gameState.players.map(p =>
            p.id === action.playerId ? updatedPlayer : p
        );

        const newGameState = gameState.withUpdates({ players: updatedPlayers });

        const harvestedItems = resourceTypes
            .filter(type => action.resources[type] > 0)
            .map(type => `${action.resources[type]} ${type}`)
            .join(', ');

        return {
            newGameState,
            summary: `Harvested ${harvestedItems}`,
            success: true,
            diceValuesUsed: diceValues
        };
    }

    /**
     * Generate a description of resources on a tile
     */
    private static getTileResourceDescription(tile: any): string {
        if (!tile.resources) return '';

        const resources = [];
        if (tile.resources.food > 0) resources.push(`${tile.resources.food} food`);
        if (tile.resources.wood > 0) resources.push(`${tile.resources.wood} wood`);
        if (tile.resources.ore > 0) resources.push(`${tile.resources.ore} ore`);
        if (tile.resources.gold > 0) resources.push(`${tile.resources.gold} gold`);

        return resources.length > 0 ? ` with ${resources.join(', ')}` : '';
    }

    /**
     * Check if two positions are adjacent (horizontally or vertically only, not diagonally)
     */
    private static areAdjacent(pos1: Position, pos2: Position): boolean {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * Get the player ID who owns a home tile at the given position
     */
    private static getHomeTileOwner(position: Position): number | undefined {
        // Home tiles are at the four corners of the 8x8 board
        // Player 1: (0,0), Player 2: (0,7), Player 3: (7,0), Player 4: (7,7)
        if (position.row === 0 && position.col === 0) {
            return 1; // Player 1
        } else if (position.row === 0 && position.col === 7) {
            return 2; // Player 2
        } else if (position.row === 7 && position.col === 0) {
            return 3; // Player 3
        } else if (position.row === 7 && position.col === 7) {
            return 4; // Player 4
        }
        return undefined; // Not a home tile
    }

    /**
     * Resolve battle between attacking champion's player and defending champion
     */
    private static resolveBattle(gameState: GameState, attackingPlayer: any, defendingChampion: any): {
        success: boolean;
        summary: string;
        newGameState: GameState;
    } {
        const defendingPlayer = gameState.getPlayerById(defendingChampion.playerId);
        if (!defendingPlayer) {
            return {
                success: false,
                summary: `Defending player ${defendingChampion.playerId} not found`,
                newGameState: gameState
            };
        }

        let attackerRoll: number;
        let defenderRoll: number;

        // Battle until there's a winner (no ties)
        do {
            attackerRoll = rollD3() + attackingPlayer.might;
            defenderRoll = rollD3() + defendingPlayer.might;
        } while (attackerRoll === defenderRoll);

        const attackerWins = attackerRoll > defenderRoll;

        if (attackerWins) {
            // Defending champion loses, goes home
            const defenderHomePosition = defendingPlayer.homePosition;
            const updatedDefendingChampion = { ...defendingChampion, position: defenderHomePosition };

            let updatedDefendingPlayer = { ...defendingPlayer };
            let medicalCostSummary = '';

            if (updatedDefendingPlayer.resources.gold >= 1) {
                updatedDefendingPlayer.resources.gold -= 1;
                medicalCostSummary = ' (paid 1 gold medical cost)';
            } else {
                updatedDefendingPlayer.fame = Math.max(0, updatedDefendingPlayer.fame - 1);
                medicalCostSummary = ' (lost 1 fame for medical cost)';
            }

            // Update the defending champion position and player resources/fame
            updatedDefendingPlayer.champions = updatedDefendingPlayer.champions.map(c =>
                c.id === defendingChampion.id ? updatedDefendingChampion : c
            );

            const updatedPlayers = gameState.players.map(p =>
                p.id === defendingPlayer.id ? updatedDefendingPlayer : p
            );

            const newGameState = gameState.withUpdates({ players: updatedPlayers });

            return {
                success: true,
                summary: `defeated ${defendingPlayer.name}'s champion${defendingChampion.id} in battle (${attackerRoll} vs ${defenderRoll})${medicalCostSummary}`,
                newGameState
            };
        } else {
            // Attacking champion loses, cannot move to this tile
            let updatedAttackingPlayer = { ...attackingPlayer };
            let medicalCostSummary = '';

            if (updatedAttackingPlayer.resources.gold >= 1) {
                updatedAttackingPlayer.resources.gold -= 1;
                medicalCostSummary = ' (paid 1 gold medical cost)';
            } else {
                updatedAttackingPlayer.fame = Math.max(0, updatedAttackingPlayer.fame - 1);
                medicalCostSummary = ' (lost 1 fame for medical cost)';
            }

            const updatedPlayers = gameState.players.map(p =>
                p.id === attackingPlayer.id ? updatedAttackingPlayer : p
            );

            const newGameState = gameState.withUpdates({ players: updatedPlayers });

            return {
                success: false,
                summary: `Battle lost to ${defendingPlayer.name}'s champion${defendingChampion.id} (${defenderRoll} vs ${attackerRoll})${medicalCostSummary} - cannot move to tile`,
                newGameState
            };
        }
    }

    /**
     * Check victory conditions for a player
     */
    public static checkVictory(gameState: GameState): { won: boolean; playerId?: number; condition?: string } {
        // For now, just return false - victory conditions will be implemented later
        return { won: false };
    }
} 