// Lords of Doomspire Game Master

import { HarvestAction, MoveBoatAction, MoveChampionAction } from "@/lib/actionTypes";
import { DecisionContext, GameLogEntry, GameLogEntryType, Monster, NON_COMBAT_TILES, OceanPosition, Player, Tile, TurnContext } from "@/lib/types";
import { formatPosition, formatResources } from "@/lib/utils";
import { getEventCardById } from "../content/eventCards";
import { getMonsterCardById } from "../content/monsterCards";
import { GameState } from "../game/GameState";
import { CARDS, GameDecks } from "../lib/cards";
import { GameSettings } from "../lib/GameSettings";
import { PlayerAgent } from "../players/PlayerAgent";
import { resolveChampionBattle, resolveDragonBattle, resolveMonsterBattle } from "./actions/battleCalculator";
import { calculateHarvest } from "./actions/harvestCalculator";
import { calculateBoatMove, calculateChampionMove } from "./actions/moveCalculator";
import { checkVictory } from "./actions/victoryChecker";
import { DiceRoller, RandomDiceRoller } from "./DiceRoller";

export type GameMasterState = "setup" | "playing" | "finished";

export interface GameMasterConfig {
  players: PlayerAgent[];
  maxRounds?: number; // Optional limit for testing
  startingValues?: { fame?: number; might?: number }; // Optional starting fame and might
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
    this.gameState = GameState.createWithPlayerNames(playerNames, config.startingValues);
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
    const diceRolls = this.diceRoller.rollMultipleD3(diceCount);

    this.addGameLogEntry("dice", `Rolled dice: ${diceRolls.join(", ")}`);

    // Step 2: Ask player for strategic assessment (strategic reflection) - now with dice context
    const strategicAssessment = await currentPlayerAgent.makeStrategicAssessment(this.gameState, this.gameLog, diceRolls);
    if (strategicAssessment) {
      this.addGameLogEntry("assessment", strategicAssessment);
    }

    // Step 3: Ask the player to execute actions until they run out of dice.
    let remainingDice = [...diceRolls];
    let currentState = this.gameState;

    while (remainingDice.length > 0) {
      // Create turn context for this die
      const turnContext: TurnContext = {
        turnNumber: this.gameState.currentRound,
        diceRolled: diceRolls,
        remainingDiceValues: remainingDice,
      };

      // Ask player decide on a dice action
      const diceAction = await currentPlayerAgent.decideDiceAction(currentState, this.gameLog, turnContext);
      const diceValueUsed = diceAction.diceValueUsed;

      // Remove the first occurrence of the used dice value from remainingDice. If not present, throw error.
      const diceIndex = remainingDice.findIndex(v => v === diceValueUsed);
      if (diceIndex === -1) {
        throw new Error(
          `Dice value ${diceValueUsed} not found in remaining dice [${remainingDice.join(", ")}]`
        );
      }
      remainingDice.splice(diceIndex, 1);

      // Execute the action
      const actionType = diceAction.type;
      if (actionType == "moveChampion") {
        const moveChampionAction = diceAction.moveChampion!;
        await this.executeMoveChampion(currentPlayer, moveChampionAction, diceValueUsed);
      } else if (actionType === "moveBoat") {
        const moveBoatAction = diceAction.moveBoat!;
        await this.executeMoveBoat(currentPlayer, moveBoatAction, diceValueUsed);
      } else if (actionType === "harvest") {
        const harvestAction = diceAction.harvest!;
        await this.executeHarvest(currentPlayer, harvestAction, diceValueUsed);
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

  /**
   * Handle champion defeat - send home and apply healing costs
   */
  private handleChampionDefeat(player: Player, championId: number, defeatContext: string): void {
    this.gameState.moveChampionToHome(player.name, championId);

    // Pay 1 gold to heal, or lose 1 fame if no gold
    if (player.resources.gold > 0) {
      player.resources.gold -= 1;
      this.addGameLogEntry("combat", `${defeatContext}, went home, paid 1 gold to heal`);
    } else {
      player.fame = Math.max(0, player.fame - 1);
      this.addGameLogEntry("combat", `${defeatContext}, went home, had no gold to heal so lost 1 fame`);
    }
  }

  /**
   * Handle monster victory - award fame and resources, remove monster from tile
   */
  private handleMonsterVictory(player: Player, monster: Monster, tile: Tile, combatResult: any): void {
    const fameAwarded = monster.fame || 0;
    player.fame += fameAwarded;
    player.resources.food += monster.resources.food;
    player.resources.wood += monster.resources.wood;
    player.resources.ore += monster.resources.ore;
    player.resources.gold += monster.resources.gold;

    tile.monster = undefined;
    this.addGameLogEntry("combat", `Defeated ${monster.name} (${combatResult.championTotal} vs ${combatResult.monsterTotal}), gained ${fameAwarded} fame and got ${formatResources(monster.resources)}`);
  }

  private async executeMoveChampion(
    player: Player,
    action: MoveChampionAction,
    diceValueUsed: number,
  ): Promise<void> {

    // Execute the movement calculation
    const moveResult = calculateChampionMove(this.gameState, player.name, action.pathIncludingStartPosition, diceValueUsed);

    // Update champion position 
    const tile = this.gameState.updateChampionPosition(player.name, action.championId, moveResult.endPosition);
    this.addGameLogEntry("movement", `Champion${action.championId} moved to ${formatPosition(moveResult.endPosition)}`);

    await this.executeChampionArrivalAtTile(player, tile, action.championId, !!action.claimTile);
  }

  private async executeMoveBoat(player: Player, action: MoveBoatAction, diceValueUsed: number): Promise<void> {
    const championId = action.championId;
    const champion = championId ? this.gameState.getChampion(player.name, championId) : undefined;
    const championStartPosition = champion ? champion.position : undefined;
    const boatMoveResult = calculateBoatMove(action.pathIncludingStartPosition, diceValueUsed, championStartPosition, action.championDropPosition);
    if (boatMoveResult.championMoveResult === "championMoved") {
      const tile = this.gameState.updateChampionPosition(player.name, championId!, action.championDropPosition!);
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved to ${boatMoveResult.endPosition}, transporting champion ${championId} from ${formatPosition(championStartPosition!)} to ${formatPosition(action.championDropPosition!)}`);
      await this.executeChampionArrivalAtTile(player, tile, championId!, !!action.claimTile);
    } else if (boatMoveResult.championMoveResult === "championNotReachableByBoat") {
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved to ${boatMoveResult.endPosition} and tried to move champion ${championId} at ${formatPosition(championStartPosition!)} but the champion was not reachable by this boat`);
    } else if (boatMoveResult.championMoveResult === "targetPositionNotReachableByBoat") {
      this.addGameLogEntry("boat", `Boat ${action.boatId} moved to ${boatMoveResult.endPosition} and tried to move champion ${championId} to ${formatPosition(action.championDropPosition!)} but that position was not reachable by this boat`);
    } else {
      throw new Error(`Unknown boat move result: ${boatMoveResult.championMoveResult}`);
    }
  }

  private async executeChampionArrivalAtTile(player: Player, tile: Tile, championId: number, claimTile: boolean): Promise<void> {
    // Step 1: Exploration (if tile wasn't explored)
    if (!tile.explored) {
      tile.explored = true;
      if (tile.tileGroup) {
        this.gameState.board.setTileGroupToExplored(tile.tileGroup);
      }
      player.fame += GameSettings.FAME_AWARD_FOR_EXPLORATION;
      this.addGameLogEntry("exploration", `Explored new territory and got ${GameSettings.FAME_AWARD_FOR_EXPLORATION} fame`);
    }


    // Step 2: Champion combat (if opposing champion on tile)
    const opposingChampions = this.gameState.getOpposingChampionsAtPosition(player.name, tile.position);

    if (opposingChampions.length > 0 && tile.tileType && !NON_COMBAT_TILES.includes(tile.tileType)) {
      const opposingChampion = opposingChampions[0];
      const opposingPlayer = this.gameState.getPlayer(opposingChampion.playerName);
      if (!opposingPlayer) {
        throw new Error(`Opposing player ${opposingChampion.playerName} not found`);
      }

      const combatResult = resolveChampionBattle(player.might, opposingPlayer.might);

      if (combatResult.attackerWins) {
        // Attacker won, award fame and send defending champion home
        player.fame += 1; // Winner gains 1 fame

        // Send defending champion home and make them pay healing cost
        opposingChampion.position = opposingPlayer.homePosition;
        // Defender pays healing cost
        if (opposingPlayer.resources.gold > 0) {
          opposingPlayer.resources.gold -= 1;
          this.addGameLogEntry("combat", `Defeated ${opposingChampion.playerName}'s champion (${combatResult.attackerTotal} vs ${combatResult.defenderTotal}), who went home and paid 1 gold to heal`);
        } else {
          opposingPlayer.fame = Math.max(0, opposingPlayer.fame - 1);
          this.addGameLogEntry("combat", `Defeated ${opposingChampion.playerName}'s champion (${combatResult.attackerTotal} vs ${combatResult.defenderTotal}), who went home and had no gold to heal so lost 1 fame`);
        }
      } else {
        // Attacker lost, go home, pay healing cost
        this.handleChampionDefeat(player, championId, `was defeated by ${opposingChampion.playerName}'s champion (${combatResult.attackerTotal} vs ${combatResult.defenderTotal})`);
        return;
      }

    }

    // Step 3: Monster combat (if tile has monster)
    if (tile.monster) {
      const monster = tile.monster;
      const combatResult = resolveMonsterBattle(player.might, monster.might);

      if (combatResult.championWins) {
        this.handleMonsterVictory(player, monster, tile, combatResult);
      } else {
        // Champion lost, update position to home
        this.handleChampionDefeat(player, championId, `Fought ${monster.name}, but was defeated (${combatResult.championTotal} vs ${combatResult.monsterTotal})`);
        // Nothing more to do
        return;
      }
    }

    // Step 4: Doomspire tile (dragon)
    if (tile.tileType === "doomspire") {
      // Check alternative victory conditions first
      if (player.fame >= GameSettings.VICTORY_FAME_THRESHOLD) {
        this.addGameLogEntry("victory", `Fame Victory! ${player.name} reached ${GameSettings.VICTORY_FAME_THRESHOLD} fame and recruited the dragon with fame!`);
        this.endGame(player.name, "Fame Victory");
        return;
      }

      if (player.resources.gold >= GameSettings.VICTORY_GOLD_THRESHOLD) {
        this.addGameLogEntry("victory", `Gold Victory! ${player.name} reached ${GameSettings.VICTORY_GOLD_THRESHOLD} gold and bribed the dragon with gold!`);
        this.endGame(player.name, "Gold Victory");
        return;
      }

      const starredTileCount = this.gameState.getStarredTileCount(player.name);
      if (starredTileCount >= GameSettings.VICTORY_STARRED_TILES_THRESHOLD) {
        this.addGameLogEntry("victory", `Economic Victory! ${player.name} reached ${GameSettings.VICTORY_STARRED_TILES_THRESHOLD} starred tiles and impressed the dragon with their economic prowess!`);
        this.endGame(player.name, "Economic Victory");
        return;
      }

      // Must fight the dragon
      // TODO may choose to fight the dragon
      // TODO dragon might should be set when discovered, and then not change.
      const dragonResult = resolveDragonBattle(player.might);

      if (!dragonResult.championWins) {
        // Champion was eaten by dragon (removed from game). TODO implement this. For now, send champion home.
        this.handleChampionDefeat(player, championId, `was eaten by the dragon (${dragonResult.championTotal} vs ${dragonResult.dragonMight})! Actually, that's not implemented yet, so champion is just sent home.`);
        return;
      } else {
        // Champion won - COMBAT VICTORY!
        this.addGameLogEntry("victory", `Combat Victory! ${player.name} defeated the dragon (${dragonResult.championTotal} vs ${dragonResult.dragonMight})!`);
        this.endGame(player.name, "Combat Victory");
        return;
      }
    }

    // Step 4: Tile claiming (if requested and valid)
    if (claimTile && tile.tileType === "resource" && tile.claimedBy === undefined) {
      const currentClaimedCount = this.gameState.board.findTiles((tile) => tile.claimedBy === player.name).length;

      if (currentClaimedCount < player.maxClaims) {
        tile.claimedBy = player.name;
        this.addGameLogEntry("event", `Champion${championId} claimed resource tile (${tile.position.row}, ${tile.position.col}), which gives ${formatResources(tile.resources)}`);
      } else {
        this.addGameLogEntry("event", `Champion${championId} could not claim resource tile (${tile.position.row}, ${tile.position.col}) (max claims reached)`);
      }
    }

    // Step 6: Adventure/oasis tiles
    if ((tile.tileType === "adventure" || tile.tileType === "oasis") &&
      tile.adventureTokens && tile.adventureTokens > 0) {
      tile.adventureTokens = Math.max(0, tile.adventureTokens - 1);
      // TODO choose which pile to draw from.
      const adventureCard = this.gameDecks.drawCard(tile.tier!, 1);

      if (!adventureCard) {
        console.log(`No adventure card found for tier ${tile.tier}`);
      } else {
        await this.handleAdventureCard(player, tile, championId, adventureCard);
      }
    }

    // TODO chapel, mercenary camp, trader
  }

  /**
   * Handle event card effects
   */
  private async handleEventCard(eventCard: any, currentPlayer: Player, currentPlayerAgent: PlayerAgent): Promise<void> {
    if (eventCard.id === "sudden-storm") {
      this.addGameLogEntry("event", "Sudden Storm! All boats move into an adjacent sea. All oases gain +1 mystery card.");

      // Move all boats to adjacent ocean positions
      for (const player of this.gameState.players) {
        for (const boat of player.boats) {
          const newPosition = this.getAdjacentOceanPosition(boat.position);
          boat.position = newPosition;
          this.addGameLogEntry("event", `${player.name}'s boat moved from ocean to ${newPosition}`);
        }
      }

      // Add +1 adventure token to all oasis tiles
      let oasisCount = 0;
      this.gameState.board.forEachTile((tile) => {
        if (tile.tileType === "oasis") {
          tile.adventureTokens = (tile.adventureTokens || 0) + 1;
          oasisCount++;
        }
      });

      if (oasisCount > 0) {
        this.addGameLogEntry("event", `All ${oasisCount} oasis tiles gained +1 mystery card`);
      }
    } else if (eventCard.id === "hungry-pests") {
      this.addGameLogEntry("event", "Hungry Pests! Choose 1 player who loses 1 food to starved rats.");

      // Create decision context for choosing target player
      const availablePlayers = this.gameState.players.map(p => ({
        name: p.name,
        displayName: `${p.name} (${p.resources.food} food)`
      }));

      const decisionContext: DecisionContext = {
        type: "choose_target_player",
        description: "Choose which player loses 1 food to the hungry pests",
        options: availablePlayers
      };

      // Ask current player to make the decision
      const decision = await currentPlayerAgent.makeDecision(this.gameState, this.gameLog, decisionContext);
      const targetPlayerName = decision.choice.name;

      // Apply the food loss to the chosen player
      const targetPlayer = this.gameState.getPlayer(targetPlayerName);
      if (targetPlayer) {
        targetPlayer.resources.food = Math.max(0, targetPlayer.resources.food - 1);
        this.addGameLogEntry("event", `${currentPlayer.name} chose ${targetPlayerName} to lose 1 food to hungry pests`);
      } else {
        this.addGameLogEntry("event", `Error: Could not find target player ${targetPlayerName}`);
      }
    } else {
      // Other event cards not yet implemented
      this.addGameLogEntry("event", `Event card ${eventCard.name} drawn, but not yet implemented`);
    }
  }

  /**
   * Get an adjacent ocean position for sudden storm event
   */
  private getAdjacentOceanPosition(currentPosition: OceanPosition): OceanPosition {
    const adjacencyMap: Record<OceanPosition, OceanPosition[]> = {
      "nw": ["ne", "sw"],
      "ne": ["nw", "se"],
      "sw": ["nw", "se"],
      "se": ["ne", "sw"]
    };

    const adjacentPositions = adjacencyMap[currentPosition];
    const randomIndex = Math.floor(Math.random() * adjacentPositions.length);
    return adjacentPositions[randomIndex];
  }

  /**
   * Handle drawing and resolving an adventure card
   */
  private async handleAdventureCard(player: Player, tile: Tile, championId: number, adventureCard: any): Promise<void> {
    const cardType = adventureCard.type;
    const cardId = adventureCard.id;

    if (cardType === "monster") {
      // Look up the monster details
      const monsterCard = getMonsterCardById(cardId);
      if (!monsterCard) {
        this.addGameLogEntry("event", `Champion${championId} drew unknown monster card ${cardId}`);
        return;
      }

      // Create a Monster object and place it on the tile
      const monster: Monster = {
        id: monsterCard.id,
        name: monsterCard.name,
        tier: monsterCard.tier,
        icon: monsterCard.icon,
        might: monsterCard.might,
        fame: monsterCard.fame,
        resources: {
          food: monsterCard.resources.food || 0,
          wood: monsterCard.resources.wood || 0,
          ore: monsterCard.resources.ore || 0,
          gold: monsterCard.resources.gold || 0,
        },
      };

      tile.monster = monster;
      this.addGameLogEntry("event", `Champion${championId} drew monster card: ${monster.name}!`);

      // Now handle monster combat using the existing logic
      const combatResult = resolveMonsterBattle(player.might, monster.might);

      if (combatResult.championWins) {
        this.handleMonsterVictory(player, monster, tile, combatResult);
      } else {
        // Champion lost, monster stays on tile, champion goes home
        this.handleChampionDefeat(player, championId, `Fought ${monster.name}, but was defeated (${combatResult.championTotal} vs ${combatResult.monsterTotal}), returned home. ${monster.name} remains on the tile`);
      }
    } else if (cardType === "event") {
      const eventCard = getEventCardById(cardId);
      if (!eventCard) {
        this.addGameLogEntry("event", `Champion${championId} drew unknown event card ${cardId}`);
        return;
      }

      this.addGameLogEntry("event", `Champion${championId} drew event card: ${eventCard.name}!`);

      // Get the current player agent for decision making
      const currentPlayerAgent = this.playerAgents[this.gameState.currentPlayerIndex];
      await this.handleEventCard(eventCard, player, currentPlayerAgent);
    } else {
      // Other card types (event, treasure, encounter, follower) - not yet implemented
      this.addGameLogEntry("event", `Champion${championId} drew ${cardType} card ${cardId}, but ${cardType} cards aren't implemented yet.`);
    }
  }

  private async executeHarvest(player: Player, action: HarvestAction, diceValueUsed: number): Promise<void> {
    // Use the harvest calculator to determine the results
    const harvestResult = calculateHarvest(this.gameState, player.name, action.tilePositions, diceValueUsed);

    // Add the harvested resources to the player's pool
    player.resources.food += harvestResult.harvestedResources.food;
    player.resources.wood += harvestResult.harvestedResources.wood;
    player.resources.ore += harvestResult.harvestedResources.ore;
    player.resources.gold += harvestResult.harvestedResources.gold;

    // Log the harvest action
    if (harvestResult.harvestedTileCount > 0) {
      this.addGameLogEntry("harvest", `Harvested from ${harvestResult.harvestedTileCount} tiles and gained ${formatResources(harvestResult.harvestedResources)}`);
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
