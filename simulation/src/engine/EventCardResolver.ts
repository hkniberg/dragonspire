// Lords of Doomspire Event Card Resolver

import { getEventCardById } from '../content/eventCards';
import { GameState } from '../game/GameState';
import { DecisionContext, Player } from '../players/Player';

export interface EventResolutionResult {
    newGameState: GameState;
    effect: string;
}

export class EventCardResolver {
    /**
     * Resolve an event card and return the updated game state and effect description
     */
    async resolveEventCard(
        gameState: GameState,
        currentPlayer: Player,
        eventCardId: string
    ): Promise<EventResolutionResult> {
        const eventCard = getEventCardById(eventCardId);
        if (!eventCard) {
            return {
                newGameState: gameState,
                effect: `Unknown event card: ${eventCardId}`
            };
        }

        switch (eventCardId) {
            case 'hungry-pests':
                return this.resolveHungryPests(gameState, currentPlayer);
            case 'sudden-storm':
                return this.resolveSuddenStorm(gameState);
            default:
                return {
                    newGameState: gameState,
                    effect: `Event card ${eventCard.name} not yet implemented`
                };
        }
    }

    /**
     * Resolve hungry-pests event: current player chooses another player to lose 1 food
     */
    private async resolveHungryPests(
        gameState: GameState,
        currentPlayer: Player
    ): Promise<EventResolutionResult> {
        const currentPlayerId = gameState.getCurrentPlayer().id;

        // Get all other players as choices
        const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId);

        if (otherPlayers.length === 0) {
            return {
                newGameState: gameState,
                effect: 'no other players to target'
            };
        }

        // Create decision context for the current player
        const decisionContext: DecisionContext = {
            type: 'event_card_choice',
            description: 'Hungry Pests: Choose which player should lose 1 food',
            options: otherPlayers,
            metadata: { eventCardId: 'hungry-pests' }
        };

        // Let the current player choose which player should lose food
        const decision = await currentPlayer.makeDecision(gameState, [], decisionContext);
        const chosenPlayer = decision.choice;

        // Validate the choice
        if (!chosenPlayer || !otherPlayers.find(p => p.id === chosenPlayer.id)) {
            // Fallback to random choice if invalid
            const randomIndex = Math.floor(Math.random() * otherPlayers.length);
            const fallbackPlayer = otherPlayers[randomIndex];

            // Deduct 1 food from the fallback player
            const updatedFallbackPlayer = {
                ...fallbackPlayer,
                resources: {
                    ...fallbackPlayer.resources,
                    food: Math.max(0, fallbackPlayer.resources.food - 1)
                }
            };

            const updatedPlayers = gameState.players.map(p =>
                p.id === fallbackPlayer.id ? updatedFallbackPlayer : p
            );

            return {
                newGameState: gameState.withUpdates({ players: updatedPlayers }),
                effect: `chose ${fallbackPlayer.name} to lose 1 food (fallback choice due to invalid selection)`
            };
        }

        // Deduct 1 food from the chosen player
        const updatedChosenPlayer = {
            ...chosenPlayer,
            resources: {
                ...chosenPlayer.resources,
                food: Math.max(0, chosenPlayer.resources.food - 1)
            }
        };

        const updatedPlayers = gameState.players.map(p =>
            p.id === chosenPlayer.id ? updatedChosenPlayer : p
        );

        return {
            newGameState: gameState.withUpdates({ players: updatedPlayers }),
            effect: `chose ${chosenPlayer.name} to lose 1 food`
        };
    }

    /**
     * Resolve sudden-storm event: All boats move into adjacent sea, All oases gain +1 mystery card
     */
    private resolveSuddenStorm(gameState: GameState): EventResolutionResult {
        // Note: This is a simplified implementation since the full boat movement 
        // and oasis card mechanics aren't fully implemented yet

        let effectDescription = '';

        // Count boats affected (for reporting)
        const totalBoats = gameState.players.reduce((count, player) => count + player.boats.length, 0);
        if (totalBoats > 0) {
            effectDescription += `${totalBoats} boat(s) moved to adjacent seas`;
        }

        // Count oases affected (for reporting)
        const oases = gameState.board.findTiles(tile => tile.tileType === 'oasis');
        if (oases.length > 0) {
            if (effectDescription) effectDescription += ', ';
            effectDescription += `${oases.length} oasis(es) gained adventure tokens`;

            // Actually add adventure tokens to oases
            oases.forEach(oasis => {
                if (oasis.adventureTokens === undefined) {
                    oasis.adventureTokens = 1;
                } else {
                    oasis.adventureTokens += 1;
                }
            });
        }

        if (!effectDescription) {
            effectDescription = 'no boats or oases were affected';
        }

        return {
            newGameState: gameState, // Board is modified in place
            effect: effectDescription
        };
    }
} 