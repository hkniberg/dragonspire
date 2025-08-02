// Lords of Doomspire Claude AI Player

import { getTraderItemById } from "@/content/traderItems";
import { formatBuildingInfo, stringifyGameState, stringifyPlayer } from "@/game/gameStateStringifier";
import { BuildingDecision, DiceAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, Player, PlayerType, TurnContext } from "@/lib/types";
import { GameState } from "../game/GameState";
import { buildingDecisionSchema, decisionSchema, diceActionSchema, traderDecisionSchema } from "../lib/claudeSchemas";
import { GameSettings } from "../lib/GameSettings";
import { TemplateProcessor, TemplateVariables } from "../lib/templateProcessor";
import { Claude } from "../llm/claude";
import { PlayerAgent } from "./PlayerAgent";
import { getUsableBuildings, canAfford } from "./PlayerUtils";

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
        traderItems: readonly TraderCard[],
        adventureDeckThemes: [AdventureThemeType, AdventureThemeType, AdventureThemeType],
        thinkingLogger?: (content: string) => void,
    ): Promise<string | undefined> {
        const userMessage = await this.prepareAssessmentMessage(gameState, gameLog, diceValues, turnNumber, traderItems, adventureDeckThemes);

        // Get text response for strategic assessment
        const strategicAssessment = await this.claude.useClaude(userMessage, undefined, 3000, 6000, thinkingLogger);

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
        // If there's only one option, choose it automatically without AI
        if (decisionContext.options.length === 1) {
            return { choice: decisionContext.options[0].id };
        }

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
        const response = await this.claude.useClaude(userMessage, traderDecisionSchema, 1024, 3000, thinkingLogger);

        return response as TraderDecision;
    }

    async useBuilding(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
        thinkingLogger?: (content: string) => void,
    ): Promise<BuildingDecision> {
        const player = gameState.getPlayer(playerName);
        if (!player) {
            throw new Error(`Player with name ${playerName} not found`);
        }

        // Check for usable buildings and available build actions early
        const usableBuildings = getUsableBuildings(player);
        const availableBuildActions = this.getAvailableBuildActions(player);

        if (usableBuildings.length === 0 && availableBuildActions.length === 0) {
            // No buildings can be used and no build actions available, return empty decision
            return {};
        }

        const userMessage = await this.prepareBuildingDecisionMessage(gameState, gameLog, playerName, usableBuildings, availableBuildActions);

        // Get structured JSON response for building decision
        const response = await this.claude.useClaude(userMessage, buildingDecisionSchema, 1024, 3000, thinkingLogger);

        return response as BuildingDecision;
    }

    private async prepareAssessmentMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        diceRolls: number[],
        turnNumber: number,
        traderItems: readonly TraderCard[],
        adventureDeckThemes: [AdventureThemeType, AdventureThemeType, AdventureThemeType],
    ): Promise<string> {
        const boardState = stringifyGameState(gameState);
        const gameLogText = this.formatGameLogForPrompt(gameLog, false, false);

        // Format trader items for the template
        const itemCounts = traderItems.reduce((acc, traderCard) => {
            acc[traderCard.id] = (acc[traderCard.id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const traderItemsText = Object.entries(itemCounts)
            .map(([itemId, quantity], i) => {
                const item = getTraderItemById(itemId);
                if (!item) {
                    return `${i + 1}. Unknown item (ID: ${itemId}) - Quantity: ${quantity}`;
                }
                return `${i + 1}. ${item.name} (${item.cost} gold) - ${item.description}`;
            })
            .join("\n");

        const traderItemsSection = traderItemsText
            ? `\nTrader Items Available:\n${traderItemsText}`
            : "\nTrader Items Available: None";

        // Format adventure deck themes
        const getThemeDescription = (theme: AdventureThemeType): string => {
            switch (theme) {
                case "beast":
                    return "Beast theme. Higher chance of food loot.";
                case "grove":
                    return "Grove theme. Higher chance of wood loot.";
                case "cave":
                    return "Cave theme. Higher chance of ore loot.";
            }
        };

        const adventureDecksText = adventureDeckThemes
            .map((theme, index) => `- Tier ${index + 1} top card: ${getThemeDescription(theme)}`)
            .join("\n");

        const variables: TemplateVariables = {
            playerName: this.name,
            boardState: boardState,
            gameLog: gameLogText,
            diceValues: diceRolls.join(", "),
            turnNumber: turnNumber,
            extraInstructions: this.getExtraInstructionsSection(gameState),
            traderItems: traderItemsSection,
            adventureCards: `\nAdventure decks:\n${adventureDecksText}`,
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

    private async prepareBuildingDecisionMessage(
        gameState: GameState,
        gameLog: readonly GameLogEntry[],
        playerName: string,
        usableBuildings: string[],
        availableBuildActions: string[],
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

        // Build available build actions summary
        const buildActionsText = availableBuildActions.length > 0
            ? `You can currently afford these build actions: ${availableBuildActions.join(", ")}.`
            : "You cannot afford any build actions yet.";

        const variables: TemplateVariables = {
            playerName: player.name,
            boardState: boardState,
            gameLog: gameLogText,
            playerStatus: playerStatus,
            availableBuildings: availableBuildings,
            availableBuildActions: buildActionsText,
            extraInstructions: this.getExtraInstructionsSection(gameState),
        };

        return await this.templateProcessor.processTemplate("useBuilding", variables);
    }

    private buildAvailableBuildingsSummary(player: Player, usableBuildings: string[]): string {
        const buildingSummaries: string[] = [];

        // Check for Blacksmith
        if (player.buildings.includes("blacksmith")) {
            const canUseBlacksmith = usableBuildings.includes("blacksmith");
            const status = canUseBlacksmith ? "Available" : "Cannot use (need 1 Gold + 2 Ore)";
            buildingSummaries.push(`- ${formatBuildingInfo("blacksmith")}: ${status}`);
        }

        // Check for Market
        if (player.buildings.includes("market")) {
            const canUseMarket = usableBuildings.includes("market");
            const status = canUseMarket ? "Available" : "Cannot use (no resources to sell)";
            buildingSummaries.push(`- ${formatBuildingInfo("market")}: ${status}`);
        }

        // Check for Fletcher
        if (player.buildings.includes("fletcher")) {
            const canUseFletcher = usableBuildings.includes("fletcher");
            const status = canUseFletcher ? "Available" : "Cannot use (need 3 Wood + 1 Ore)";
            buildingSummaries.push(`- ${formatBuildingInfo("fletcher")}: ${status}`);
        }

        if (buildingSummaries.length === 0) {
            return "You have no buildings.";
        }

        return buildingSummaries.join("\n");
    }

    private getAvailableBuildActions(player: Player): string[] {
        const availableActions: string[] = [];
        const { resources } = player;

        // Check Blacksmith (2 Food + 2 Ore, max 1 per player)
        const hasBlacksmith = player.buildings.includes("blacksmith");
        if (!hasBlacksmith && canAfford(player, GameSettings.BLACKSMITH_COST)) {
            availableActions.push("blacksmith");
        }

        // Check Market (2 Food + 2 Wood, max 1 per player)
        const hasMarket = player.buildings.includes("market");
        if (!hasMarket && canAfford(player, GameSettings.MARKET_COST)) {
            availableActions.push("market");
        }

        // Check Fletcher (1 Wood + 1 Food + 1 Gold + 1 Ore, max 1 per player)
        const hasFletcher = player.buildings.includes("fletcher");
        if (!hasFletcher && canAfford(player, GameSettings.FLETCHER_COST)) {
            availableActions.push("fletcher");
        }

        // Check Chapel (6 Wood + 2 Gold, only once per player)
        const hasChapel = player.buildings.includes("chapel");
        const hasMonastery = player.buildings.includes("monastery");
        if (!hasChapel && !hasMonastery && canAfford(player, GameSettings.CHAPEL_COST)) {
            availableActions.push("chapel");
        }

        // Check Monastery upgrade (8 Wood + 3 Gold + 1 Ore, requires chapel)
        if (hasChapel && !hasMonastery && canAfford(player, GameSettings.MONASTERY_COST)) {
            availableActions.push("upgradeChapelToMonastery");
        }

        // Check Champion recruitment (max 3 total)
        const currentChampionCount = player.champions.length;
        if (currentChampionCount < GameSettings.MAX_CHAMPIONS_PER_PLAYER) {
            if (canAfford(player, GameSettings.CHAMPION_COST)) {
                availableActions.push("recruitChampion");
            }
        }

        // Check Boat building (max 2 boats total)
        const currentBoatCount = player.boats.length;
        if (currentBoatCount < GameSettings.MAX_BOATS_PER_PLAYER && canAfford(player, GameSettings.BOAT_COST)) {
            availableActions.push("buildBoat");
        }

        // Check Warship upgrade (2 Wood + 1 Ore + 1 Gold, max 1 per player)
        const hasWarshipUpgrade = player.buildings.includes("warshipUpgrade");
        if (!hasWarshipUpgrade && canAfford(player, GameSettings.WARSHIP_UPGRADE_COST)) {
            availableActions.push("warshipUpgrade");
        }

        return availableActions;
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
