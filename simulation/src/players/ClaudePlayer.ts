// Lords of Doomspire Claude AI Player

import { GameStateStringifier } from '@/game/gameStateStringifier';
import { GameState } from '../game/GameState';
import { formatActionLogEntry } from '../lib/actionLogFormatter';
import { templateProcessor, TemplateVariables } from '../lib/templateProcessor';
import { Claude2 } from '../llm/claude2';
import {
    ActionLogEntry,
    Decision,
    DecisionContext,
    DiceAction,
    ExecuteActionFunction,
    GameLogEntry,
    Player,
    PlayerType,
    TurnContext
} from './Player';

export class ClaudePlayer implements Player {
    private name: string;
    private claude2: Claude2;

    constructor(name: string, claude2: Claude2) {
        this.name = name;
        this.claude2 = claude2;
    }

    getName(): string {
        return this.name;
    }

    getType(): PlayerType {
        return 'claude';
    }

    async decideDiceAction(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext
    ): Promise<DiceAction> {
        const playerId = gameState.getCurrentPlayer().id;
        const dieValue = turnContext.remainingDiceValues[0];

        try {
            // Prepare the user message with current context
            const userMessage = await this.prepareDiceActionMessage(gameState, playerId, gameLog, turnContext);

            // Define JSON schema for DiceAction response
            const responseSchema = {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["moveChampion", "moveBoat", "harvest"],
                        description: "The type of action to perform"
                    },
                    playerId: {
                        type: "number",
                        description: "The player ID performing the action"
                    },
                    championId: {
                        type: "number",
                        description: "Champion ID (for moveChampion actions)"
                    },
                    path: {
                        type: "array",
                        description: "Path for movement actions",
                        items: {
                            type: "object",
                            properties: {
                                row: { type: "number" },
                                col: { type: "number" }
                            },
                            required: ["row", "col"]
                        }
                    },
                    claimTile: {
                        type: "boolean",
                        description: "Whether to claim the destination tile (moveChampion only)"
                    },
                    boatId: {
                        type: "number",
                        description: "Boat ID (for moveBoat actions)"
                    },
                    championDropPosition: {
                        type: "object",
                        description: "Where to drop off champion (moveBoat only)",
                        properties: {
                            row: { type: "number" },
                            col: { type: "number" }
                        }
                    },
                    resources: {
                        type: "object",
                        description: "Resources to harvest (harvest actions only)",
                        properties: {
                            food: { type: "number" },
                            wood: { type: "number" },
                            ore: { type: "number" },
                            gold: { type: "number" }
                        },
                        required: ["food", "wood", "ore", "gold"]
                    }
                },
                required: ["type", "playerId"]
            };

            // Get LLM response with structured JSON
            const response = await this.claude2.useClaude(userMessage, responseSchema);

            // Ensure playerId is correct
            response.playerId = playerId;

            return response as DiceAction;

        } catch (error) {
            console.error(`${this.name} encountered an error during dice action:`, error);

            // Fallback to simple harvest action
            return {
                type: 'harvest',
                playerId: playerId,
                resources: { food: 0, wood: 0, ore: 0, gold: 0 }
            };
        }
    }

    async makeDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext
    ): Promise<Decision> {
        try {
            // Prepare decision context message
            const userMessage = this.prepareDecisionMessage(gameState, gameLog, decisionContext);

            // Get text response for decision
            const response = await this.claude2.useClaude(userMessage);

            // Parse the response to extract the decision
            // For now, we'll use simple text parsing. In future, we could use JSON schema too.
            return this.parseDecisionResponse(response, decisionContext);

        } catch (error) {
            console.error(`${this.name} encountered an error during decision:`, error);

            // Fallback to first available option
            return {
                choice: decisionContext.options.length > 0 ? decisionContext.options[0] : null,
                reasoning: 'Error occurred, chose first available option'
            };
        }
    }

    async writeDiaryEntry(
        gameState: GameState,
        gameLog: readonly GameLogEntry[]
    ): Promise<string | undefined> {
        try {
            const playerId = gameState.getCurrentPlayer().id;
            const userMessage = this.prepareDiaryMessage(gameState, playerId, gameLog);

            // Get text response for diary entry
            const diaryEntry = await this.claude2.useClaude(userMessage);

            return diaryEntry.trim() || undefined;

        } catch (error) {
            console.error(`${this.name} encountered an error during diary entry:`, error);
            return undefined;
        }
    }

    // Legacy method for backwards compatibility
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

            // Use the old Claude interface with tools if available
            const claude = (this.claude2 as any).claude; // Access underlying Claude if available
            if (claude) {
                const { createGameActionTools } = await import('../lib/tools');
                const tools = createGameActionTools(executeAction, playerId);
                const diaryEntry = await claude.useClaude(systemPrompt, userMessage, tools);
                return diaryEntry.trim() || undefined;
            }

            // Fallback: return undefined
            return undefined;

        } catch (error) {
            console.error(`${this.name} encountered an error during legacy turn execution:`, error);
            return undefined;
        }
    }

    // Legacy method for backwards compatibility
    async handleEventCardChoice(
        gameState: GameState,
        eventCardId: string,
        availableChoices: any[]
    ): Promise<any> {
        const decisionContext: DecisionContext = {
            type: 'event_card_choice',
            description: `Choose response to event card: ${eventCardId}`,
            options: availableChoices,
            metadata: { eventCardId }
        };

        const decision = await this.makeDecision(gameState, [], decisionContext);
        return decision.choice;
    }

    private async prepareDiceActionMessage(
        gameState: GameState,
        playerId: number,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext
    ): Promise<string> {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
        }

        // Use the readable stringified game state
        const boardState = GameStateStringifier.stringify(gameState);

        // Format the game log into readable text
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        // Prepare extra instructions if they exist
        const extraInstructionsText = player.extraInstructions?.trim()
            ? `\n<additional-instructions-provided-by-player>\n${player.extraInstructions.trim()}\n</additional-instructions-provided-by-player>\n`
            : '';

        const dieValue = turnContext.remainingDiceValues[0];
        const remainingDiceText = turnContext.remainingDiceValues.length > 1
            ? ` (${turnContext.remainingDiceValues.length - 1} dice remaining after this one)`
            : ' (last die)';

        return `<player-context>
You are player ${player.name}.
</player-context>

<game-log>
${gameLogText}
</game-log>

<current-board-state>
${boardState}
</current-board-state>

<dice-action-request>
It is your turn as ${player.name}. You have rolled dice: ${turnContext.diceRolled.join(', ')}.

You are now deciding what to do with a die showing ${dieValue}${remainingDiceText}.

Respond with a JSON object specifying your dice action. You can choose from:
1. moveChampion: Move a champion along a path, optionally claiming the destination tile
2. moveBoat: Move a boat, optionally transporting a champion  
3. harvest: Collect resources from your claimed tiles

Make sure your action is legal according to the game rules and the current board state.
</dice-action-request>${extraInstructionsText}`;
    }

    private prepareDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext
    ): string {
        const player = gameState.getCurrentPlayer();
        const gameLogText = this.formatGameLogForPrompt(gameLog);
        const boardState = GameStateStringifier.stringify(gameState);

        return `<player-context>
You are player ${player.name}.
</player-context>

<current-situation>
${decisionContext.description}

Available options:
${decisionContext.options.map((option, i) => `${i + 1}. ${JSON.stringify(option)}`).join('\n')}
</current-situation>

<current-board-state>
${boardState}
</current-board-state>

<game-log>
${gameLogText}
</game-log>

Please choose one of the available options and explain your reasoning briefly.
Respond with your choice clearly indicated.`;
    }

    private prepareDiaryMessage(
        gameState: GameState,
        playerId: number,
        gameLog: readonly GameLogEntry[]
    ): string {
        const player = gameState.getPlayerById(playerId);
        if (!player) {
            throw new Error(`Player with ID ${playerId} not found`);
        }

        const boardState = GameStateStringifier.stringify(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        return `<player-context>
You are player ${player.name}.
</player-context>

<current-board-state>
${boardState}
</current-board-state>

<game-log>
${gameLogText}
</game-log>

<diary-request>
Write a brief diary entry reflecting on the current situation, your strategy, and your plans.
This will help you maintain strategic focus across turns.
Keep it concise (1-2 sentences maximum).
</diary-request>`;
    }

    private formatGameLogForPrompt(gameLog: readonly GameLogEntry[]): string {
        if (gameLog.length === 0) {
            return 'No game events yet.';
        }

        // Group by round and format readably
        const logByRound = gameLog.reduce((acc, entry) => {
            if (!acc[entry.round]) {
                acc[entry.round] = [];
            }
            acc[entry.round].push(entry);
            return acc;
        }, {} as Record<number, GameLogEntry[]>);

        const formattedRounds = Object.entries(logByRound)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([round, entries]) => {
                const roundEntries = entries.map(entry =>
                    `  ${entry.playerName}: ${entry.content}`
                ).join('\n');
                return `Round ${round}:\n${roundEntries}`;
            });

        return formattedRounds.join('\n\n');
    }

    private parseDecisionResponse(response: string, decisionContext: DecisionContext): Decision {
        // Simple parsing for now - look for option numbers or specific choices
        const lowerResponse = response.toLowerCase();

        // Try to find "option 1", "option 2", etc.
        for (let i = 0; i < decisionContext.options.length; i++) {
            if (lowerResponse.includes(`option ${i + 1}`) || lowerResponse.includes(`choice ${i + 1}`)) {
                return {
                    choice: decisionContext.options[i],
                    reasoning: response.trim()
                };
            }
        }

        // Try to match option content directly
        for (let i = 0; i < decisionContext.options.length; i++) {
            const optionStr = JSON.stringify(decisionContext.options[i]).toLowerCase();
            if (lowerResponse.includes(optionStr)) {
                return {
                    choice: decisionContext.options[i],
                    reasoning: response.trim()
                };
            }
        }

        // Fallback to first option
        return {
            choice: decisionContext.options.length > 0 ? decisionContext.options[0] : null,
            reasoning: `Could not parse decision, chose first option. Response: ${response.trim()}`
        };
    }

    // Legacy helper methods for backwards compatibility
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