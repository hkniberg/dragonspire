// Lords of Doomspire Claude AI Player

import { getTraderItemById } from "@/content/traderItems";
import { stringifyGameState } from "@/game/gameStateStringifier";
import { BuildingUsageDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";
import { decisionSchema, diceActionSchema, traderDecisionSchema } from "../lib/claudeSchemas";
import { templateProcessor, TemplateVariables } from "../lib/templateProcessor";
import { Claude } from "../llm/claude";
import { PlayerAgent } from "./PlayerAgent";

export class ClaudePlayerAgent implements PlayerAgent {
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
        return "claude";
    }


    async makeStrategicAssessment(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceValues: number[],
        thinkingLogger?: (content: string) => void,
    ): Promise<string | undefined> {
        try {
            const userMessage = await this.prepareAssessmentMessage(gameState, gameLog, diceValues);

            // Get text response for strategic assessment
            const strategicAssessment = await this.claude.useClaude(userMessage, undefined, 1024, 2000, thinkingLogger);

            return strategicAssessment.trim() || undefined;
        } catch (error) {
            console.error(`${this.name} encountered an error during strategic assessment:`, error);
            return undefined;
        }
    }

    async decideDiceAction(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext,
        thinkingLogger?: (content: string) => void,
    ): Promise<DiceAction> {
        // Prepare the user message with current context
        const userMessage = await this.prepareDiceActionMessage(gameState, gameLog, turnContext);

        // Get LLM response with structured JSON
        const response = await this.claude.useClaude(userMessage, diceActionSchema, 1024, 3000, thinkingLogger);

        // Convert the nested response to flat GameAction format
        return response as DiceAction;
    }

    async makeDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext,
        thinkingLogger?: (content: string) => void,
    ): Promise<Decision> {
        try {
            // Prepare decision context message
            const userMessage = await this.prepareDecisionMessage(gameState, gameLog, decisionContext);

            // Get structured JSON response for decision
            const response = await this.claude.useClaude(userMessage, decisionSchema, 0, 200, thinkingLogger);

            return response as Decision;
        } catch (error) {
            console.error(`${this.name} encountered an error during decision:`, error);

            // Fallback to first available option
            return {
                choice: decisionContext.options.length > 0 ? decisionContext.options[0] : null,
                reasoning: "Error occurred, chose first available option",
            };
        }
    }

    async makeTraderDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        traderContext: TraderContext,
        thinkingLogger?: (content: string) => void,
    ): Promise<TraderDecision> {
        try {
            // Prepare trader decision context message
            const userMessage = await this.prepareTraderDecisionMessage(gameState, gameLog, traderContext);

            // Get structured JSON response for trader decision
            const response = await this.claude.useClaude(userMessage, traderDecisionSchema, 0, 500, thinkingLogger);

            return response as TraderDecision;
        } catch (error) {
            console.error(`${this.name} encountered an error during trader decision:`, error);

            // Fallback to no actions
            return {
                actions: [],
                reasoning: "Error occurred, chose to perform no trader actions",
            };
        }
    }

    async useBuilding(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
        thinkingLogger?: (content: string) => void,
    ): Promise<BuildingUsageDecision> {
        try {
            const userMessage = await this.prepareBuildingUsageMessage(gameState, gameLog, playerName);

            // Define schema for building usage decision
            const buildingUsageSchema = {
                type: "object",
                properties: {
                    useBlacksmith: {
                        type: "boolean",
                        description: "Whether to use the blacksmith to buy 1 Might for 1 Gold + 2 Ore"
                    },
                    sellAtMarket: {
                        type: "object",
                        description: "Resources to sell at market (only used if you have a market)",
                        properties: {
                            food: {
                                type: "number",
                                description: "Amount of food to sell"
                            },
                            wood: {
                                type: "number",
                                description: "Amount of wood to sell"
                            },
                            ore: {
                                type: "number",
                                description: "Amount of ore to sell"
                            }
                        },
                        additionalProperties: false
                    },
                    reasoning: {
                        type: "string",
                        description: "Brief reasoning for the decision"
                    }
                },
                required: ["useBlacksmith", "sellAtMarket"]
            };

            // Get structured JSON response for building usage decision
            const response = await this.claude.useClaude(userMessage, buildingUsageSchema, 0, 300, thinkingLogger);

            return response as BuildingUsageDecision;
        } catch (error) {
            console.error(`${this.name} encountered an error during building usage decision:`, error);

            // Fallback to not using any buildings
            return { useBlacksmith: false, sellAtMarket: { food: 0, wood: 0, ore: 0, gold: 0 } };
        }
    }

    private async prepareAssessmentMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls: number[],
    ): Promise<string> {
        const boardState = stringifyGameState(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        const variables: TemplateVariables = {
            playerName: this.name,
            boardState: boardState,
            gameLog: gameLogText,
            diceValues: diceRolls.join(", "),
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await templateProcessor.processTemplate("strategicAssessment", variables);
    }

    private async prepareDiceActionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext,
    ): Promise<string> {

        // Use the readable stringified game state
        const boardState = stringifyGameState(gameState);

        // Format the game log into readable text
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        const variables: TemplateVariables = {
            playerName: this.name,
            gameLog: gameLogText,
            boardState: boardState,
            turnNumber: turnContext.turnNumber,
            remainingDice: turnContext.remainingDiceValues.join(", "),
            extraInstructions: this.getExtraInstructionsSection(gameState)
        };

        return await templateProcessor.processTemplate("diceAction", variables);
    }

    private async prepareDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext,
    ): Promise<string> {
        const player = gameState.getCurrentPlayer();
        const gameLogText = this.formatGameLogForPrompt(gameLog);
        const boardState = stringifyGameState(gameState);

        const optionsText = decisionContext.options.map((option, i) => `${i + 1}. ${JSON.stringify(option)}`).join("\n");

        const variables: TemplateVariables = {
            playerName: player.name,
            description: decisionContext.description,
            options: optionsText,
            boardState: boardState,
            gameLog: gameLogText,
        };

        return await templateProcessor.processTemplate("makeDecision", variables);
    }

    private async prepareTraderDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        traderContext: TraderContext,
    ): Promise<string> {
        const player = gameState.getCurrentPlayer();
        const gameLogText = this.formatGameLogForPrompt(gameLog);
        const boardState = stringifyGameState(gameState);

        // Format player resources
        const resourcesText = Object.entries(traderContext.playerResources)
            .map(([resource, amount]) => `${resource}: ${amount}`)
            .join(", ");

        // Format available items (group duplicates and show quantities)
        const itemCounts = traderContext.availableItems.reduce((acc, traderCard) => {
            acc[traderCard.id] = (acc[traderCard.id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const itemsText = Object.entries(itemCounts)
            .map(([itemId, quantity], i) => {
                const item = getTraderItemById(itemId);
                if (!item) {
                    return `${i + 1}. Unknown item (ID: ${itemId}) - Quantity: ${quantity}`;
                }
                const quantityText = quantity > 1 ? ` - Quantity: ${quantity}` : "";
                return `${i + 1}. ${item.name} (ID: ${item.id}) - Cost: ${item.cost} gold${quantityText} - ${item.description}`;
            })
            .join("\n");

        const variables: TemplateVariables = {
            playerName: player.name,
            description: traderContext.description,
            playerResources: resourcesText,
            availableItems: itemsText,
            boardState: boardState,
            gameLog: gameLogText,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await templateProcessor.processTemplate("traderDecision", variables);
    }

    private async prepareBuildingUsageMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
    ): Promise<string> {
        const player = gameState.getPlayer(playerName);
        if (!player) {
            throw new Error(`Player with name ${playerName} not found`);
        }

        const boardState = stringifyGameState(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        const variables: TemplateVariables = {
            playerName: player.name,
            boardState: boardState,
            gameLog: gameLogText,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await templateProcessor.processTemplate("useBuilding", variables);
    }

    private getExtraInstructionsSection(gameState: GameState): string {
        const player = gameState.getPlayer(this.name);
        if (!player) {
            throw new Error(`Player with name ${this.name} not found`);
        }

        return player.extraInstructions?.trim()
            ? `\n<additional-instructions-provided-by-human-player>\n${player.extraInstructions.trim()}\n</additional-instructions-provided-by-human-player>\n`
            : "";
    }


    private formatGameLogForPrompt(gameLog: readonly GameLogEntry[]): string {
        if (gameLog.length === 0) {
            return "No game events yet.";
        }

        // Determine current round
        const currentRound = Math.max(...gameLog.map(entry => entry.round));
        const previousRound = currentRound - 1;

        // Filter entries based on the rules:
        // - For previous round and current round: include all entries except other players' assessments and thinking entries
        // - For earlier rounds: only include this player's entries
        // - Always exclude thinking entries as they are too detailed for the LLM to process
        const filteredEntries = gameLog.filter(entry => {
            // Always exclude thinking entries
            if (entry.type === "thinking") {
                return false;
            }

            if (entry.round >= previousRound) {
                // Recent rounds: exclude other players' assessments (keep own assessments and all other types)
                return entry.playerName === this.name || entry.type !== "assessment";
            } else {
                // Earlier rounds: only include this player's entries
                return entry.playerName === this.name;
            }
        });

        // Group by round and format readably
        const logByRound = filteredEntries.reduce(
            (acc, entry) => {
                if (!acc[entry.round]) {
                    acc[entry.round] = [];
                }
                acc[entry.round].push(entry);
                return acc;
            },
            {} as Record<number, GameLogEntry[]>,
        );

        const formattedRounds = Object.entries(logByRound)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([round, entries]) => {
                const roundNumber = parseInt(round);
                const roundEntries = entries.map((entry) => `  ${entry.playerName}: ${entry.content}`).join("\n");

                // Add clarification when we're only showing this player's entries (earlier rounds)
                const isFilteredRound = roundNumber < previousRound;
                const roundHeader = isFilteredRound
                    ? `Round ${round} (only showing ${this.name}):`
                    : `Round ${round}:`;

                return `${roundHeader}\n${roundEntries}`;
            });

        return formattedRounds.join("\n\n");
    }
}
