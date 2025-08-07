// Lords of Doomspire Random Player

import { GameState } from "@/game/GameState";
import { BuildingDecision, DiceAction } from "@/lib/actionTypes";
import { TraderCard } from "@/lib/cards";
import { TraderContext, TraderDecision } from "@/lib/traderTypes";
import { AdventureThemeType, Decision, DecisionContext, GameLogEntry, PlayerType, TurnContext } from "@/lib/types";
import { PlayerAgent } from "./PlayerAgent";
import {
  generateRandomChampionActions,
  generateRandomBoatActions,
  generateRandomHarvestAction,
  generateRandomTileAction,
  makeRandomTraderDecision,
  makeRandomBuildingDecision,
  randomChoice,
  randomDiceValue,
} from "./RandomPlayerUtils";

export class RandomPlayerAgent implements PlayerAgent {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  getType(): PlayerType {
    return "random";
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
    // Random players don't provide strategic assessments
    return undefined;
  }

  async decideDiceAction(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<DiceAction> {
    const player = gameState.getCurrentPlayer();
    const remainingDice = turnContext.remainingDiceValues;

    if (remainingDice.length === 0) {
      throw new Error("No dice remaining for action");
    }

    // Choose a random die value
    const dieValue = randomDiceValue(remainingDice);

    // Generate random actions based on what's available
    const actions: DiceAction[] = [];

    // Try champion actions
    if (player.champions.length > 0) {
      const championActions = generateRandomChampionActions(gameState, player.name, dieValue);
      actions.push(...championActions);
    }

    // Try boat actions  
    if (player.boats.length > 0) {
      const boatActions = generateRandomBoatActions(gameState, player.name, dieValue);
      actions.push(...boatActions);
    }

    // Try harvest actions
    const harvestAction = generateRandomHarvestAction(gameState, player.name, dieValue);
    if (harvestAction) {
      actions.push(harvestAction);
    }

    // If no actions are possible, default to a simple champion action
    if (actions.length === 0 && player.champions.length > 0) {
      actions.push({
        actionType: "championAction",
        championAction: {
          diceValueUsed: dieValue,
          championId: player.champions[0].id,
          movementPathIncludingStartPosition: [player.champions[0].position], // Stay in place
          tileAction: generateRandomTileAction(player),
        },
      });
    }

    if (actions.length === 0) {
      throw new Error("No valid actions available");
    }

    const chosenAction = randomChoice(actions);

    if (thinkingLogger) {
      thinkingLogger(`Will do ${chosenAction.actionType} with die ${dieValue}`);
    }

    return chosenAction;
  }

  async makeDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<Decision> {
    // Random selection from available options
    const randomOption = randomChoice(decisionContext.options);

    if (thinkingLogger) {
      thinkingLogger(`Random player ${this.name} randomly chose: ${randomOption.id}`);
    }

    return { choice: randomOption.id };
  }

  async makeTraderDecision(
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    traderContext: TraderContext,
    thinkingLogger?: (content: string) => void,
  ): Promise<TraderDecision> {
    const decision = makeRandomTraderDecision(traderContext);

    if (thinkingLogger) {
      thinkingLogger(`Random player ${this.name} trader decision: ${decision.actions.length > 0 ? 'buying spear' : 'buying nothing'}`);
    }

    return decision;
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

    const result = makeRandomBuildingDecision(player);

    if (thinkingLogger) {
      const hasUsage = result.buildingUsageDecision && Object.keys(result.buildingUsageDecision).length > 0;
      thinkingLogger(`Random player ${this.name} building decision: ${hasUsage ? 'using buildings' : 'no building usage'}, ${result.buildAction ? `building ${result.buildAction}` : 'no build action'}`);
    }

    return result;
  }

}
