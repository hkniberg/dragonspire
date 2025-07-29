// Lords of Doomspire Claude AI Player

import { getTraderItemById } from "@/content/traderItems";
import { stringifyGameState, stringifyPlayer } from "@/game/gameStateStringifier";
import { BuildingUsageDecision, DiceAction } from "@/lib/actionTypes";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { Decision, DecisionContext, GameLogEntry, Player, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";
import { buildingUsageSchema, decisionSchema, diceActionSchema, traderDecisionSchema } from "../lib/claudeSchemas";
import { TemplateProcessor, TemplateVariables } from "../lib/templateProcessor";
import { Claude } from "../llm/claude";
import { PlayerAgent } from "./PlayerAgent";
import { getUsableBuildings } from "./PlayerUtils";

export class ClaudePlayerAgent implements PlayerAgent {
    private name: string;
    private claude: Claude;
    private templateProcessor: TemplateProcessor;

    constructor(name: string, claude: Claude, templateProcessor: TemplateProcessor) {
        this.name = name;
        this.claude = claude;
        this.templateProcessor = templateProcessor;
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
        turnNumber: number,
        thinkingLogger?: (content: string) => void,
    ): Promise<string | undefined> {
        const userMessage = await this.prepareAssessmentMessage(gameState, gameLog, diceValues, turnNumber);

        // Get text response for strategic assessment
        const strategicAssessment = await this.claude.useClaude(userMessage, undefined, 2000, 4000, thinkingLogger);

        return strategicAssessment.trim() || undefined;
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
        // Prepare decision context message
        const userMessage = await this.prepareDecisionMessage(gameState, gameLog, decisionContext);

        // Get structured JSON response for decision
        const response = await this.claude.useClaude(userMessage, decisionSchema, 0, 400, thinkingLogger);

        // Validate that the chosen option is valid
        const validChoices = decisionContext.options.map(opt => opt.id);
        if (!validChoices.includes(response.choice)) {
            throw new Error(`Invalid choice: ${response.choice}. Valid options: ${validChoices.join(', ')}`);
        }

        return response as Decision;
    }

    async makeTraderDecision(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        traderContext: TraderContext,
        thinkingLogger?: (content: string) => void,
    ): Promise<TraderDecision> {
        // Prepare trader decision context message
        const userMessage = await this.prepareTraderDecisionMessage(gameState, gameLog, traderContext);

        // Get structured JSON response for trader decision
        const response = await this.claude.useClaude(userMessage, traderDecisionSchema, 0, 500, thinkingLogger);

        return response as TraderDecision;
    }

    async useBuilding(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
        thinkingLogger?: (content: string) => void,
    ): Promise<BuildingUsageDecision> {
        const player = gameState.getPlayer(playerName);
        if (!player) {
            throw new Error(`Player with name ${playerName} not found`);
        }

        // Check for usable buildings early
        const usableBuildings = getUsableBuildings(player);
        if (usableBuildings.length === 0) {
            // No buildings can be used, return empty decision
            return {};
        }

        const userMessage = await this.prepareBuildingUsageMessage(gameState, gameLog, playerName, usableBuildings);

        // Get structured JSON response for building usage decision
        const response = await this.claude.useClaude(userMessage, buildingUsageSchema, 0, 300, thinkingLogger);

        return response as BuildingUsageDecision;

    }

    private async prepareAssessmentMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls: number[],
        turnNumber: number,
    ): Promise<string> {
        const boardState = stringifyGameState(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog, false, false);

        const variables: TemplateVariables = {
            playerName: this.name,
            boardState: boardState,
            gameLog: gameLogText,
            diceValues: diceRolls.join(", "),
            turnNumber: turnNumber,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await this.templateProcessor.processTemplate("strategicAssessment", variables);
    }

    private async prepareDiceActionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        turnContext: TurnContext,
    ): Promise<string> {

        // Use the readable stringified game state
        const boardState = stringifyGameState(gameState);

        // Format the game log into readable text
        const gameLogText = this.formatGameLogForPrompt(gameLog, true, true);

        const variables: TemplateVariables = {
            playerName: this.name,
            gameLog: gameLogText,
            boardState: boardState,
            turnNumber: turnContext.turnNumber,
            remainingDice: turnContext.remainingDiceValues.join(", "),
            availableBuildActions: this.buildAvailableBuildActionsSummary(gameState.getCurrentPlayer()),
            extraInstructions: this.getExtraInstructionsSection(gameState)
        };

        return await this.templateProcessor.processTemplate("diceAction", variables);
    }

    private async prepareDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        decisionContext: DecisionContext,
    ): Promise<string> {
        const player = gameState.getCurrentPlayer();
        const gameLogText = this.formatGameLogForPrompt(gameLog, true, true);
        const boardState = stringifyGameState(gameState);

        const optionsText = decisionContext.options.map((option, i) => `${i + 1}. ${option.id} - ${option.description}`).join("\n");

        const variables: TemplateVariables = {
            playerName: player.name,
            description: decisionContext.description,
            options: optionsText,
            boardState: boardState,
            gameLog: gameLogText,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await this.templateProcessor.processTemplate("makeDecision", variables);
    }

    private async prepareTraderDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        traderContext: TraderContext,
    ): Promise<string> {
        const player = gameState.getCurrentPlayer();
        const gameLogText = this.formatGameLogForPrompt(gameLog, true, true);
        const playerStatus = stringifyPlayer(player, gameState);

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
            playerStatus: playerStatus,
            gameLog: gameLogText,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await this.templateProcessor.processTemplate("traderDecision", variables);
    }

    private async prepareBuildingUsageMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
        usableBuildings: string[],
    ): Promise<string> {
        const player = gameState.getPlayer(playerName);
        if (!player) {
            throw new Error(`Player with name ${playerName} not found`);
        }

        const boardState = stringifyGameState(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog, true, true);
        const playerStatus = stringifyPlayer(player, gameState);

        // Build available buildings summary
        const availableBuildings = this.buildAvailableBuildingsSummary(player, usableBuildings);

        const variables: TemplateVariables = {
            playerName: player.name,
            boardState: boardState,
            gameLog: gameLogText,
            playerStatus: playerStatus,
            availableBuildings: availableBuildings,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await this.templateProcessor.processTemplate("useBuilding", variables);
    }

    private buildAvailableBuildingsSummary(player: Player, usableBuildings: string[]): string {
        const buildingSummaries: string[] = [];

        // Check for Blacksmith
        const hasBlacksmith = player.buildings.some((building: any) => building.type === "blacksmith");
        if (hasBlacksmith) {
            const canUseBlacksmith = usableBuildings.includes("blacksmith");
            const status = canUseBlacksmith ? "Available" : "Cannot use (need 1 Gold + 2 Ore)";
            buildingSummaries.push(`- Blacksmith: ${status} - Buy 1 Might for 1 Gold + 2 Ore`);
        }

        // Check for Market
        const hasMarket = player.buildings.some((building: any) => building.type === "market");
        if (hasMarket) {
            const canUseMarket = usableBuildings.includes("market");
            const status = canUseMarket ? "Available" : "Cannot use (no resources to sell)";
            buildingSummaries.push(`- Market: ${status} - Sell resources for Gold (earn 1 gold for every 2 resources)`);
        }

        if (buildingSummaries.length === 0) {
            return "You have no buildings that can be used after your turn.";
        }

        return buildingSummaries.join("\n");
    }

    private buildAvailableBuildActionsSummary(player: Player): string {
        const availableActions: string[] = [];
        const { resources } = player;

        // Check Blacksmith (2 Food + 2 Ore, max 1 per player)
        const hasBlacksmith = player.buildings.includes("blacksmith");
        if (!hasBlacksmith && resources.food >= 2 && resources.ore >= 2) {
            availableActions.push("blacksmith");
        }

        // Check Market (2 Food + 2 Wood, max 1 per player)
        const hasMarket = player.buildings.includes("market");
        if (!hasMarket && resources.food >= 2 && resources.wood >= 2) {
            availableActions.push("market");
        }

        // Check Chapel (3 Wood + 4 Gold, only once per player)
        const hasChapel = player.buildings.includes("chapel");
        const hasMonastery = player.buildings.includes("monastery");
        if (!hasChapel && !hasMonastery && resources.wood >= 3 && resources.gold >= 4) {
            availableActions.push("chapel");
        }

        // Check Monastery upgrade (4 Wood + 5 Gold + 2 Ore, requires chapel)
        if (hasChapel && !hasMonastery && resources.wood >= 4 && resources.gold >= 5 && resources.ore >= 2) {
            availableActions.push("upgradeChapelToMonastery");
        }

        // Check Champion recruitment (max 3 total)
        const currentChampionCount = player.champions.length;
        if (currentChampionCount < 3) {
            if (currentChampionCount === 1 && resources.food >= 3 && resources.gold >= 3 && resources.ore >= 1) {
                availableActions.push("recruitChampion");
            } else if (currentChampionCount === 2 && resources.food >= 6 && resources.gold >= 6 && resources.ore >= 3) {
                availableActions.push("recruitChampion");
            }
        }

        // Check Boat building (max 2 boats total)
        const currentBoatCount = player.boats.length;
        if (currentBoatCount < 2 && resources.wood >= 2 && resources.gold >= 2) {
            availableActions.push("buildBoat");
        }

        // Check Warship upgrade (2 Wood + 1 Ore + 1 Gold, max 1 per player)
        const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
        if (!hasWarshipUpgrade && resources.wood >= 2 && resources.ore >= 1 && resources.gold >= 1) {
            availableActions.push("warshipUpgrade");
        }

        if (availableActions.length === 0) {
            return "You cannot afford any build actions yet.";
        }

        return `You can currently afford build actions: ${availableActions.join(", ")}.`;
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


    private formatGameLogForPrompt(gameLog: readonly GameLogEntry[], onlyThisRound: boolean = false, onlyMe: boolean = false): string {
        if (gameLog.length === 0) {
            return "No game events yet.";
        }

        // Determine current round
        const currentRound = Math.max(...gameLog.map(entry => entry.round));
        const previousRound = currentRound - 1;

        // Filter entries based on the rules and new parameters:
        const filteredEntries = gameLog.filter(entry => {
            // Always exclude thinking entries
            if (entry.type === "thinking") {
                return false;
            }

            // Always exclude other players' assessments
            if (entry.type === "assessment" && entry.playerName !== this.name) {
                return false;
            }

            // If onlyMe is true, only include this player's entries
            if (onlyMe && entry.playerName !== this.name) {
                return false;
            }

            // If onlyThisRound is true, only include current round
            if (onlyThisRound && entry.round !== currentRound) {
                return false;
            }

            // Original filtering logic (when not overridden by new parameters)
            if (!onlyThisRound) {
                if (entry.round >= previousRound) {
                    // Recent rounds: include all entries (assessments already filtered above)
                    return true;
                } else {
                    // Earlier rounds: only include this player's entries
                    return entry.playerName === this.name;
                }
            }

            return true;
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

                // Add clarification when we're only showing this player's entries (earlier rounds or onlyMe mode)
                const isFilteredRound = roundNumber < previousRound || onlyMe;
                const roundHeader = isFilteredRound
                    ? `Round ${round} (only showing ${this.name}):`
                    : `Round ${round}:`;

                return `${roundHeader}\n${roundEntries}`;
            });

        return formattedRounds.join("\n\n");
    }
}
