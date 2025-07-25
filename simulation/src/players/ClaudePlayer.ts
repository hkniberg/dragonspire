// Lords of Doomspire Claude AI Player

import { GameStateStringifier } from "@/game/gameStateStringifier";
import { Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";
import { DiceAction } from "../lib/actionTypes";
import { decisionSchema, diceActionSchema } from "../lib/claudeSchemas";
import { templateProcessor, TemplateVariables } from "../lib/templateProcessor";
import { Claude } from "../llm/claude";
import { PlayerAgent } from "./PlayerAgent";
export class ClaudePlayerAgent implements PlayerAgent {
    private name: string;
    private claude: Claude;
    private extraInstructions: string;

    constructor(name: string, claude: Claude) {
        this.name = name;
        this.claude = claude;
        this.extraInstructions = "";
    }

    getName(): string {
        return this.name;
    }

    getType(): PlayerType {
        return "claude";
    }

    async decideDiceAction(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext,
    ): Promise<DiceAction> {
        // Prepare the user message with current context
        const userMessage = await this.prepareDiceActionMessage(gameState, gameLog, turnContext);

        // Get LLM response with structured JSON
        const response = await this.claude.useClaude(userMessage, diceActionSchema, 2000, 3000);

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
            const response = await this.claude.useClaude(userMessage, decisionSchema, 2000, 3000);

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

    async makeStrategicAssessment(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls?: number[],
    ): Promise<string | undefined> {
        try {
            const userMessage = await this.prepareAssessmentMessage(gameState, gameLog, diceRolls);

            // Get text response for strategic assessment
            const strategicAssessment = await this.claude.useClaude(userMessage, undefined, 4000, 6000);

            return strategicAssessment.trim() || undefined;
        } catch (error) {
            console.error(`${this.name} encountered an error during strategic assessment:`, error);
            return undefined;
        }
    }

    private async prepareDiceActionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext,
    ): Promise<string> {
        const player = gameState.getPlayer(this.name);
        if (!player) {
            throw new Error(`Player with name ${this.name} not found`);
        }

        // Use the readable stringified game state
        const boardState = GameStateStringifier.stringify(gameState);

        // Format the game log into readable text
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        // Prepare extra instructions if they exist
        const extraInstructionsText = player.extraInstructions?.trim()
            ? `\n<additional-instructions-provided-by-player>\n${player.extraInstructions.trim()}\n</additional-instructions-provided-by-player>\n`
            : "";

        const dieValue = turnContext.remainingDiceValues[0];
        const remainingDiceText =
            turnContext.remainingDiceValues.length > 1
                ? ` (${turnContext.remainingDiceValues.length - 1} dice remaining after this one)`
                : " (last die)";

        const variables: TemplateVariables = {
            playerName: player.name,
            gameLog: gameLogText,
            boardState: boardState,
            diceRolled: turnContext.diceRolled.join(", "),
            dieValue: dieValue,
            remainingDiceText: remainingDiceText,
            extraInstructions: extraInstructionsText,
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

    private async prepareAssessmentMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls?: number[],
    ): Promise<string> {
        const player = gameState.getPlayer(this.name);
        if (!player) {
            throw new Error(`Player with name ${this.name} not found`);
        }

        const boardState = GameStateStringifier.stringify(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog);

        const variables: TemplateVariables = {
            playerName: player.name,
            boardState: boardState,
            gameLog: gameLogText,
            diceRolls: diceRolls ? diceRolls.join(", ") : "Not yet rolled",
        };

        return await templateProcessor.processTemplate("strategicAssessment", variables);
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
