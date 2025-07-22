// Lords of Doomspire Claude AI Player

import { GameStateStringifier } from '@/game/gameStateStringifier';
import { GameState } from '../game/GameState';
import { templateProcessor, TemplateVariables } from '../lib/templateProcessor';
import { createGameActionTools } from '../lib/tools';
import { Claude } from '../llm/claude';
import { ActionLogEntry, ExecuteActionFunction, Player, PlayerType } from './Player';

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
        executeAction: ExecuteActionFunction,
        actionLog: readonly ActionLogEntry[]
    ): Promise<string | undefined> {
        const playerId = gameState.getCurrentPlayer().id;

        try {
            // Prepare the system prompt and user message
            const systemPrompt = await this.prepareSystemPrompt();
            const userMessage = await this.prepareUserMessage(gameState, playerId, diceRolls, actionLog);

            // Create tools that can execute game actions
            const tools = createGameActionTools(executeAction, playerId);

            // Get LLM response with tool execution handled internally
            const diaryEntry = await this.claude.useClaude(systemPrompt, userMessage, tools);

            // Return the diary entry (trimmed)
            return diaryEntry.trim() || undefined;

        } catch (error) {
            console.error(`${this.name} encountered an error during turn execution:`, error);
            return undefined;
        }
    }

    private async prepareSystemPrompt(): Promise<string> {
        return await templateProcessor.processTemplate('SystemPrompt', {});
    }

    private async prepareUserMessage(gameState: GameState, playerId: number, diceRolls: number[], actionLog: readonly ActionLogEntry[]): Promise<string> {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
        }

        // Use the readable stringified game state instead of JSON
        const boardState = GameStateStringifier.stringify(gameState);

        // Format previous diary entries from action log
        const previousDiaryEntries = actionLog
            .filter(entry => entry.playerId === playerId && entry.diaryEntry)
            .map((entry, index) => `Turn ${entry.round}: ${entry.diaryEntry}`)
            .join('\n\n');

        const diaryText = previousDiaryEntries || 'No previous diary entries.';

        // Prepare extra instructions if they exist, formatted in a special block
        const extraInstructionsText = player.extraInstructions?.trim()
            ? `\n<additional-instructions-provided-by-player>\n${player.extraInstructions.trim()}\n</additional-instructions-provided-by-player>\n`
            : '';

        const variables: TemplateVariables = {
            playerName: player.name,
            diceRolls: diceRolls.join(' and '),
            boardState: boardState,
            previousDiaryEntries: diaryText
        };

        const baseMessage = await templateProcessor.processTemplate('makeMove', variables);
        return baseMessage + extraInstructionsText;
    }
} 