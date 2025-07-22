// Lords of Doomspire Claude AI Player

import { GameState } from '../game/GameState';
import { GameLogger } from '../lib/gameLogger';
import { templateProcessor, TemplateVariables } from '../lib/templateProcessor';
import { createGameActionTools } from '../lib/tools';
import { Claude } from '../llm/claude';
import { ExecuteActionFunction, Player, PlayerType } from './Player';

export class ClaudePlayer implements Player {
    private name: string;
    private claude: Claude;

    constructor(name: string, claude: Claude) {
        this.name = name;
        this.claude = claude;
    }

    getName(): string {
        return this.name;
    }

    getType(): PlayerType {
        return 'claude';
    }

    async executeTurn(
        gameState: GameState,
        diceRolls: number[],
        executeAction: ExecuteActionFunction
    ): Promise<void> {
        console.log(GameLogger.formatTurnStart(this.name, diceRolls));

        const playerId = gameState.getCurrentPlayer().id;

        try {
            // Prepare the system prompt and user message
            const systemPrompt = await this.prepareSystemPrompt();
            const userMessage = await this.prepareUserMessage(gameState, playerId, diceRolls);

            // Create tools that can execute game actions
            const tools = createGameActionTools(executeAction);

            // Get LLM response with tool execution handled internally
            const diaryEntry = await this.claude.useClaude(systemPrompt, userMessage, tools);

            // Log the diary entry
            if (diaryEntry.trim()) {
                console.log(`${this.name} diary entry: ${diaryEntry.trim()}`);
            }

        } catch (error) {
            console.error(`${this.name} encountered an error during turn execution:`, error);
        }

        console.log(GameLogger.formatTurnEnd(this.name));
    }

    private async prepareSystemPrompt(): Promise<string> {
        return await templateProcessor.processTemplate('SystemPrompt', {});
    }

    private async prepareUserMessage(gameState: GameState, playerId: number, diceRolls: number[]): Promise<string> {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
        }

        // Get the first champion for position (assuming single champion for now)
        const champion = player.champions[0];
        const championRow = champion ? champion.position.row : 0;
        const championCol = champion ? champion.position.col : 0;

        // Get the first boat for position
        const boat = player.boats[0];
        const boatPosition = boat ? boat.position : 'nw';

        // Format resources as a readable string
        const resourcesString = Object.entries(player.resources)
            .map(([type, amount]) => `${type}: ${amount}`)
            .join(', ');

        // Serialize the board state
        const boardState = JSON.stringify(this.serializeGameState(gameState), null, 2);

        const variables: TemplateVariables = {
            currentRound: gameState.currentRound,
            playerId: playerId,
            diceRolls: diceRolls.join(', '),
            fame: player.fame,
            might: player.might,
            resources: resourcesString,
            championRow: championRow,
            championCol: championCol,
            boatPosition: boatPosition,
            boardState: boardState
        };

        return await templateProcessor.processTemplate('makeMove', variables);
    }

    private serializeGameState(gameState: GameState): any {
        return {
            currentRound: gameState.currentRound,
            currentPlayerIndex: gameState.currentPlayerIndex,
            players: gameState.players.map(player => ({
                id: player.id,
                name: player.name,
                fame: player.fame,
                might: player.might,
                resources: player.resources,
                maxClaims: player.maxClaims,
                champions: player.champions.map(champion => ({
                    id: champion.id,
                    position: champion.position,
                    treasures: champion.treasures
                })),
                boats: player.boats.map(boat => ({
                    id: boat.id,
                    position: boat.position
                })),
                homePosition: player.homePosition
            })),
            board: gameState.board.map(row =>
                row.map(tile => ({
                    position: tile.position,
                    tier: tile.tier,
                    explored: tile.explored,
                    tileType: tile.tileType,
                    resources: tile.resources,
                    isStarred: tile.isStarred,
                    claimedBy: tile.claimedBy,
                    monster: tile.monster,
                    adventureTokens: tile.adventureTokens
                }))
            ),
            gameEnded: gameState.gameEnded,
            winner: gameState.winner
        };
    }
} 