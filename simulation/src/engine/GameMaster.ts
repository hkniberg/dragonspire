// Lords of Doomspire Game Master

import { HarvestAction, MoveBoatAction, MoveChampionAction } from "@/lib/actionTypes";
import { GameLogEntry, GameLogEntryType, Player, Tile, TurnContext } from "@/lib/types";
import { formatPosition, formatResources } from "@/lib/utils";
import { GameState } from "../game/GameState";
import { CARDS, GameDecks } from "../lib/cards";
import { PlayerAgent } from "../players/PlayerAgent";
import { calculateHarvest } from "./actions/harvestCalculator";
import { calculateBoatMove, calculateChampionMove } from "./actions/moveCalculator";
import { checkVictory } from "./actions/victoryChecker";
import { DiceRoller, RandomDiceRoller } from "./DiceRoller";
import { DiceRolls } from "./DiceRolls";
import { handleAdventureCard } from "./handlers/adventureCardHandler";
import {
  handleChampionCombat,
  handleDoomspireTile,
  handleExploration,
  handleMonsterCombat,
  handleSpecialTiles,
  handleTileClaiming
} from "./handlers/tileArrivalHandler";

export type GameMasterState = "setup" | "playing" | "finished";

export interface GameMasterConfig {
  players: PlayerAgent[];
  maxRounds?: number; // Optional limit for testing
  startingValues?: { fame?: number; might?: number }; // Optional starting fame and might
  seed?: number; // Optional seed for board generation
}

export class GameMaster {
  private diceRoller: DiceRoller;
  private gameState: GameState;
  private playerAgents: PlayerAgent[];
  private masterState: GameMasterState;
  private maxRounds: number;
  private gameLog: GameLogEntry[];
  private gameDecks: GameDecks;

  constructor(config: GameMasterConfig) {
    // Create GameState with the correct player names from the start
    this.diceRoller = new RandomDiceRoller();
    const playerNames = config.players.map((player) => player.getName());
    this.gameState = GameState.createWithPlayerNames(playerNames, config.startingValues, config.seed);
    this.playerAgents = config.players;
    this.masterState = "setup";
    this.maxRounds = config.maxRounds || 100; // Default limit to prevent infinite games
    this.gameLog = [];
    this.gameDecks = new GameDecks(CARDS);
  }

  /**
   * Start the game session
   */
  public start(): void {
    if (this.masterState !== "setup") {
      throw new Error(`Cannot start game: session is in state ${this.masterState}`);
    }

    console.log("=== Lords of Doomspire Game Session Starting ===");
    console.log(`Players: ${this.playerAgents.map((p) => p.getName()).join(", ")}`);
    console.log("================================================");

    this.masterState = "playing";
  }

  /**
   * Execute a single turn for the current player using the new Game Master pattern
   */
  public async executeTurn(): Promise<void> {
    if (this.masterState !== "playing") {
      throw new Error(`Cannot execute turn: session is in state ${this.masterState}`);
    }

    const currentPlayerAgent = this.playerAgents[this.gameState.currentPlayerIndex];
    const playerId = this.gameState.currentPlayerIndex; // Use index as player ID

    console.log(`\n--- ${currentPlayerAgent.getName()}'s Turn (Round ${this.gameState.currentRound}) ---`);

    // Step 1: Roll dice for player
    const currentPlayer = this.gameState.getCurrentPlayer();
    const championCount = currentPlayer.champions.length;
    const diceCount = 1 + championCount;
    const diceRollValues = this.diceRoller.rollMultipleD3(diceCount);
    const diceRolls = new DiceRolls(diceRollValues);

    this.addGameLogEntry("dice", `Rolled dice: ${diceRollValues.map(die => `[${die}]`).join(", ")}`);

    // Step 2: Ask player for strategic assessment (strategic reflection) - now with dice context
    const strategicAssessment = await currentPlayerAgent.makeStrategicAssessment(this.gameState, this.gameLog, diceRollValues);
    if (strategicAssessment) {
      this.addGameLogEntry("assessment", strategicAssessment);
    }

    // Step 3: Ask the player to execute actions until they run out of dice.
    let currentState = this.gameState;

    while (diceRolls.hasRemainingRolls()) {
      // Create turn context for this die
      const turnContext: TurnContext = {
        turnNumber: this.gameState.currentRound,
        diceRolled: diceRollValues,
        remainingDiceValues: diceRolls.getRemainingRolls(),
      };

      // Ask player decide on a dice action
      const diceAction = await currentPlayerAgent.decideDiceAction(currentState, this.gameLog, turnContext);

      // Execute the action and consume the appropriate dice
      const actionType = diceAction.actionType;
      if (actionType == "moveChampion") {
        const moveChampionAction = diceAction.moveChampion!;
        diceRolls.consumeDiceRoll(moveChampionAction.diceValueUsed);
        await this.executeMoveChampion(currentPlayer, moveChampionAction);
      } else if (actionType === "moveBoat") {
        const moveBoatAction = diceAction.moveBoat!;
        diceRolls.consumeDiceRoll(moveBoatAction.diceValueUsed);
        await this.executeMoveBoat(currentPlayer, moveBoatAction);
      } else if (actionType === "harvest") {
        const harvestAction = diceAction.harvest!;
        diceRolls.consumeMultipleDiceRolls(harvestAction.diceValuesUsed);
        await this.executeHarvest(currentPlayer, harvestAction);
      } else {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      // Step 4: Check for victory conditions
      const victoryCheck = checkVictory(this.gameState);
      if (victoryCheck.won) {
        this.endGame(victoryCheck.playerName, victoryCheck.condition);
        return;
      }

    }

    // Check for max rounds limit
    if (this.gameState.currentRound >= this.maxRounds) {
      console.log(`\nGame ended: Maximum rounds (${this.maxRounds}) reached`);
      this.endGame();
      return;
    }

    // Step 5: Advance to next player
    this.gameState = this.gameState.advanceToNextPlayer();
  }





  private async executeMoveChampion(
    player: Player,
    action: MoveChampionAction,
  ): Promise<void> {

    // Get the champion's current position before moving
    const champion = this.gameState.getChampion(player.name, action.championId);
    if (!champion) {
      throw new Error(`Champion ${action.championId} not found for player ${player.name}`);
    }
    const startPosition = champion.position;

    // Execute the movement calculation
    const moveResult = calculateChampionMove(this.gameState, player.name, action.pathIncludingStartPosition, action.diceValueUsed);

    // Update champion position 
    const tile = this.gameState.updateChampionPosition(player.name, action.championId, moveResult.endPosition);
    this.addGameLogEntry("movement", `Champion${action.championId} moved from ${formatPosition(startPosition)} to ${formatPosition(moveResult.endPosition)}, using dice value [${action.diceValueUsed}]`);

    await this.executeChampionArrivalAtTile(player, tile, action.championId, !!action.claimTile);
  }

  private async executeMoveBoat(player: Player, action: MoveBoatAction): Promise<void> {
    const championId = action.championId;
    const champion = championId ? this.gameState.getChampion(player.name, championId) : undefined;
    const championStartPosition = champion ? champion.position : undefined;
    const boatMoveResult = calculateBoatMove(action.pathIncludingStartPosition, action.diceValueUsed, championStartPosition, action.championDropPosition);

    // Get boat start position for logging
    const boatStartPosition = action.pathIncludingStartPosition[0];

    if (boatMoveResult.championMoveResult === "championMoved") {
      const tile = this.gameState.updateChampionPosition(player.name, championId!, action.championDropPosition!);
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved from ${boatStartPosition} to ${boatMoveResult.endPosition}, transporting champion ${championId} from ${formatPosition(championStartPosition!)} to ${formatPosition(action.championDropPosition!)}, using dice value [${action.diceValueUsed}]`);
      await this.executeChampionArrivalAtTile(player, tile, championId!, !!action.claimTile);
    } else if (boatMoveResult.championMoveResult === "championNotReachableByBoat") {
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved from ${boatStartPosition} to ${boatMoveResult.endPosition} and tried to move champion ${championId} at ${formatPosition(championStartPosition!)} but the champion was not reachable by this boat, using dice value [${action.diceValueUsed}]`);
    } else if (boatMoveResult.championMoveResult === "targetPositionNotReachableByBoat") {
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved from ${boatStartPosition} to ${boatMoveResult.endPosition} and tried to move champion ${championId} to ${formatPosition(action.championDropPosition!)} but that position was not reachable by this boat, using dice value [${action.diceValueUsed}]`);
    } else {
      throw new Error(`Unknown boat move result: ${boatMoveResult.championMoveResult}`);
    }
  }

  private async executeChampionArrivalAtTile(player: Player, tile: Tile, championId: number, claimTile: boolean): Promise<void> {
    // Create a logging wrapper that matches the handler's expected signature
    const logFn = (type: string, content: string) => this.addGameLogEntry(type as GameLogEntryType, content);

    // Step 1: Handle exploration
    const explorationResult = handleExploration(this.gameState, tile, player, logFn);

    // Step 2: Handle champion combat
    const championCombatResult = handleChampionCombat(this.gameState, tile, player, championId, logFn);
    if (championCombatResult.combatOccurred && !championCombatResult.attackerWon) {
      // Attacker lost, defeat effects already applied by combat handler
      return;
    }

    // Step 3: Handle monster combat (but only if not from an adventure card)
    let adventureCardCombatOccurred = false;

    // Step 4: Handle special tiles (adventure/oasis) - moved before monster combat
    const specialTileResult = handleSpecialTiles(tile, championId, logFn);
    if (specialTileResult.interactionOccurred && specialTileResult.adventureCardDrawn) {
      // Draw and handle adventure card
      const adventureCard = this.gameDecks.drawCard(tile.tier!, 1);

      if (!adventureCard) {
        console.log(`No adventure card found for tier ${tile.tier}`);
      } else {
        const currentPlayerAgent = this.playerAgents[this.gameState.currentPlayerIndex];
        const adventureResult = await handleAdventureCard(
          adventureCard,
          this.gameState,
          tile,
          player,
          currentPlayerAgent,
          championId,
          this.gameLog,
          logFn
        );

        // Handle results from adventure card
        if (adventureResult.cardProcessed && adventureResult.monsterPlaced?.combatOccurred) {
          adventureCardCombatOccurred = true;

          if (adventureResult.monsterPlaced.championDefeated) {
            // Champion was defeated by a monster from the adventure card, defeat effects already applied by combat handler
            return;
          }
        }
      }
    }

    // Only handle existing monster combat if no adventure card combat occurred
    if (!adventureCardCombatOccurred) {
      const monsterCombatResult = handleMonsterCombat(this.gameState, tile, player, championId, logFn);
      if (monsterCombatResult.combatOccurred && !monsterCombatResult.championWon) {
        // Champion lost to monster, defeat effects already applied by combat handler
        return;
      }
    }

    // Step 5: Handle Doomspire tile (dragon combat and victory conditions)
    const doomspireResult = handleDoomspireTile(this.gameState, tile, player, championId, logFn);
    if (doomspireResult.entered) {
      if (doomspireResult.alternativeVictory) {
        this.endGame(doomspireResult.alternativeVictory.playerName, doomspireResult.alternativeVictory.type);
        return;
      }
      if (doomspireResult.dragonCombat) {
        if (doomspireResult.dragonCombat.combatVictory) {
          this.endGame(doomspireResult.dragonCombat.combatVictory.playerName, "Combat Victory");
          return;
        } else if (doomspireResult.dragonCombat.championDefeated) {
          // Champion defeated by dragon, defeat effects already applied by combat handler
          return;
        }
      }
    }

    // Step 6: Handle tile claiming
    const claimingResult = handleTileClaiming(this.gameState, tile, player, championId, claimTile, logFn);

    // TODO: Handle other special tile types (temple, mercenary camp, trader)
  }



  private async executeHarvest(player: Player, action: HarvestAction): Promise<void> {
    // Use the harvest calculator to determine the results - sum the dice values to get harvest power
    const diceSum = action.diceValuesUsed.reduce((sum, diceValue) => sum + diceValue, 0);
    const harvestResult = calculateHarvest(this.gameState, player.name, action.tilePositions, diceSum);

    // Add the harvested resources to the player's pool
    player.resources.food += harvestResult.harvestedResources.food;
    player.resources.wood += harvestResult.harvestedResources.wood;
    player.resources.ore += harvestResult.harvestedResources.ore;
    player.resources.gold += harvestResult.harvestedResources.gold;

    // Log the harvest action
    if (harvestResult.harvestedTileCount > 0) {
      if (action.diceValuesUsed.length === 1) {
        this.addGameLogEntry(
          "harvest",
          `Harvested from ${harvestResult.harvestedTileCount} tile${harvestResult.harvestedTileCount > 1 ? "s" : ""} and gained ${formatResources(harvestResult.harvestedResources)}, using die value [${action.diceValuesUsed[0]}]`
        );
      } else {
        const diceString = action.diceValuesUsed.map(die => `[${die}]`).join("+");
        this.addGameLogEntry(
          "harvest",
          `Harvested from ${harvestResult.harvestedTileCount} tiles and gained ${formatResources(harvestResult.harvestedResources)}, using die values ${diceString}`
        );
      }
    } else {
      this.addGameLogEntry("harvest", "Attempted to harvest but no tiles were harvestable for some reason.");
    }
  }

  /**
   * Run the complete game session until finished
   */
  public async runToCompletion(): Promise<void> {
    this.start();

    while (this.masterState === "playing") {
      await this.executeTurn();
    }

    console.log("\n=== Game Session Complete ===");
    this.printGameSummary();
  }

  /**
   * Get the current game state
   */
  public getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get the master state
   */
  public getMasterState(): GameMasterState {
    return this.masterState;
  }

  /**
   * Get the game log
   */
  public getGameLog(): readonly GameLogEntry[] {
    return [...this.gameLog];
  }

  /**
   * Update the game state (useful for UI changes like extra instructions)
   */
  public updateGameState(newGameState: GameState): void {
    this.gameState = newGameState;
  }

  /**
   * Add an entry to the game log
   */
  private addGameLogEntry(type: GameLogEntryType, content: string): void {
    const entry: GameLogEntry = {
      round: this.gameState.currentRound,
      playerName: this.gameState.getCurrentPlayer().name,
      type: type,
      content: content,
    };
    console.log(`${entry.playerName} ${entry.type}: ${entry.content}`);
    this.gameLog.push(entry);
  }

  /**
 * Get the game decks for UI display
 */
  public getGameDecks(): GameDecks {
    return this.gameDecks;
  }

  private endGame(winnerName?: string, condition?: string): void {
    this.masterState = "finished";

    if (winnerName !== undefined) {
      const winner = this.playerAgents.find(agent => agent.getName() === winnerName);
      console.log(`\n🎉 GAME WON! 🎉`);
      console.log(`Winner: ${winner?.getName() || winnerName}`);
      if (condition) {
        console.log(`Victory Condition: ${condition}`);
      }

      this.addGameLogEntry("system", `VICTORY! ${condition || "Game won"}`);
    } else {
      console.log(`\nGame ended without a winner`);
      this.addGameLogEntry("system", "Game ended without a winner");
    }

    this.gameState.gameEnded = true;
    // Find the player index for the winner
    const winnerIndex = winnerName ? this.gameState.players.findIndex(p => p.name === winnerName) : undefined;
    this.gameState.winner = winnerIndex;
  }

  private printGameSummary(): void {
    console.log(`\nGame completed after ${this.gameState.currentRound} rounds`);
    console.log(`Total log entries: ${this.gameLog.length}`);

    // Print final player states
    console.log("\nFinal Player States:");
    for (const player of this.gameState.players) {
      console.log(`${player.name}: Fame=${player.fame}, Resources=${JSON.stringify(player.resources)}`);
    }

    // Print log entry statistics
    const logTypes = this.gameLog.reduce(
      (acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log(`\nLog Entry Statistics:`);
    Object.entries(logTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  }
}
