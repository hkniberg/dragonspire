// Lords of Doomspire Claude AI Player

import { getTraderItemById } from "@/content/traderItems";
import { GameStateStringifier } from "@/game/gameStateStringifier";
import { DiceAction } from "@/lib/actionTypes";
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
    ): Promise<string | undefined> {
        try {
            const userMessage = await this.prepareAssessmentMessage(gameState, gameLog, diceValues);

            // Get text response for strategic assessment
            const strategicAssessment = await this.claude.useClaude(userMessage, undefined, 1024, 2000);

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
    ): Promise<DiceAction> {
        // Prepare the user message with current context
        const userMessage = await this.prepareDiceActionMessage(gameState, gameLog, turnContext);

        // Get LLM response with structured JSON
        const response = await this.claude.useClaude(userMessage, diceActionSchema, 1024, 1500);

        // Convert the nested response to flat GameAction format
        return response as DiceAction;
    }

    async makeDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext,
    ): Promise<Decision> {
        try {
            // Prepare decision context message
            const userMessage = await this.prepareDecisionMessage(gameState, gameLog, decisionContext);

            // Get structured JSON response for decision
            const response = await this.claude.useClaude(userMessage, decisionSchema, 0, 200);

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
    ): Promise<TraderDecision> {
        try {
            // Prepare trader decision context message
            const userMessage = await this.prepareTraderDecisionMessage(gameState, gameLog, traderContext);

            // Get structured JSON response for trader decision
            const response = await this.claude.useClaude(userMessage, traderDecisionSchema, 0, 500);

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

    private async prepareAssessmentMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls: number[],
    ): Promise<string> {
        const boardState = GameStateStringifier.stringify(gameState);
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
        const boardState = GameStateStringifier.stringify(gameState);

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
        const boardState = GameStateStringifier.stringify(gameState);

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
        const boardState = GameStateStringifier.stringify(gameState);

        // Format player resources
        const resourcesText = Object.entries(traderContext.playerResources)
            .map(([resource, amount]) => `${resource}: ${amount}`)
            .join(", ");

        // Format available items
        const itemsText = traderContext.availableItems
            .map((traderCard, i) => {
                const item = getTraderItemById(traderCard.id);
                if (!item) {
                    return `${i + 1}. Unknown item (ID: ${traderCard.id})`;
                }
                return `${i + 1}. ${item.name} (ID: ${item.id}) - Cost: ${item.cost} gold - ${item.description}`;
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

        // Group by round and format readably
        const logByRound = gameLog.reduce(
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
                const roundEntries = entries.map((entry) => `  ${entry.playerName}: ${entry.content}`).join("\n");
                return `Round ${round}:\n${roundEntries}`;
            });

        return formattedRounds.join("\n\n");
    }
}
