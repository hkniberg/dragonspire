// Lords of Doomspire Claude AI Player

import { GameStateStringifier } from '@/game/gameStateStringifier';
import { GameState } from '../game/GameState';
import { formatActionLogEntry } from '../lib/actionLogFormatter';
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

    async handleEventCardChoice(
        gameState: GameState,
        eventCardId: string,
        availableChoices: any[]
    ): Promise<any> {
        if (availableChoices.length === 0) {
            return null;
        }

        try {
            if (eventCardId === 'hungry-pests') {
                // For hungry-pests, availableChoices are Player objects
                const choicePrompt = this.prepareEventChoicePrompt(gameState, eventCardId, availableChoices);

                // Use Claude to make the choice
                const response = await this.claude.useClaude(
                    "You are a strategic board game player making tactical decisions.",
                    choicePrompt
                );

                // Parse the response to extract the chosen player
                const chosenPlayerMatch = response.match(/Player (\d+)/);
                if (chosenPlayerMatch) {
                    const chosenPlayerId = parseInt(chosenPlayerMatch[1]);
                    const chosenPlayer = availableChoices.find(p => p.id === chosenPlayerId);
                    if (chosenPlayer) {
                        return chosenPlayer;
                    }
                }

                // Fallback to first available choice if parsing fails
                return availableChoices[0];
            }

            // Default to first choice for unknown events
            return availableChoices[0];

        } catch (error) {
            console.error(`${this.name} encountered an error during event card choice:`, error);
            // Fallback to random choice
            const randomIndex = Math.floor(Math.random() * availableChoices.length);
            return availableChoices[randomIndex];
        }
    }

    private prepareEventChoicePrompt(gameState: GameState, eventCardId: string, availableChoices: any[]): string {
        if (eventCardId === 'hungry-pests') {
            const currentPlayer = gameState.getCurrentPlayer();
            let prompt = `You drew a "Hungry pests" event card! The card says: "Choose 1 player who loses 1 food to a mischief of starved rats."\n\n`;

            prompt += `You are ${currentPlayer.name} and you must choose which other player should lose 1 food.\n\n`;
            prompt += `Available players to choose from:\n`;

            for (const player of availableChoices) {
                prompt += `- Player ${player.id} (${player.name}): Has ${player.resources.food} food\n`;
            }

            prompt += `\nPlease respond with your choice in the format: "Player X" where X is the player ID you want to target.`;
            prompt += `\nConsider strategic implications - you might want to target a player who has more food, or a player who is currently ahead.`;

            return prompt;
        }

        return `Event card ${eventCardId} - please choose from: ${JSON.stringify(availableChoices)}`;
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

        // Format the complete game log using the action log formatter
        // Only show diary entries for the current player
        const gameLogLines: string[] = [];
        for (const entry of actionLog) {
            const formattedEntry = formatActionLogEntry(entry, playerId);
            gameLogLines.push(...formattedEntry);
            gameLogLines.push(''); // Add empty line between turns
        }
        const gameLog = gameLogLines.join('\n').trim();

        // Prepare extra instructions if they exist, formatted in a special block
        const extraInstructionsText = player.extraInstructions?.trim()
            ? `\n<additional-instructions-provided-by-player>\n${player.extraInstructions.trim()}\n</additional-instructions-provided-by-player>\n`
            : '';

        const variables: TemplateVariables = {
            playerName: player.name,
            diceRolls: diceRolls.join(' and '),
            boardState: boardState,
            gameLog: gameLog
        };

        const baseMessage = await templateProcessor.processTemplate('makeMove', variables);
        return baseMessage + extraInstructionsText;
    }
} 