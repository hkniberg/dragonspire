// Lords of Doomspire Claude AI Player

import { GameState } from '../game/GameState';
import { GameLogger } from '../lib/gameLogger';
import { GameStateStringifier } from '../lib/gameStateStringifier';
import { templateProcessor, TemplateVariables } from '../lib/templateProcessor';
import { createGameActionTools } from '../lib/tools';
import { Claude } from '../llm/claude';
import { ExecuteActionFunction, Player, PlayerType } from './Player';

export class ClaudePlayer implements Player {
    private name: string;
    private claude: Claude;
    private diaryEntries: string[] = [];

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

            // Store the diary entry for future turns
            if (diaryEntry.trim()) {
                this.diaryEntries.push(diaryEntry.trim());
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

        // Use the readable stringified game state instead of JSON
        const boardState = GameStateStringifier.stringify(gameState);

        // Format previous diary entries
        const previousDiaryEntries = this.diaryEntries.length > 0
            ? this.diaryEntries.map((entry, index) => `Turn ${index + 1}: ${entry}`).join('\n\n')
            : 'No previous diary entries.';

        const variables: TemplateVariables = {
            playerName: player.name,
            diceRolls: diceRolls.join(' and '),
            boardState: boardState,
            previousDiaryEntries: previousDiaryEntries
        };

        return await templateProcessor.processTemplate('makeMove', variables);
    }
} 