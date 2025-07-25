# AI Player Movement and Decision-Making Design

## Overview

This document outlines a comprehensive design for handling AI player movement and decision-making in Lords of Doomspire that works uniformly across three player types:

1. **Random Player** - Fast, random decisions for testing purposes
2. **Claude Player** - Uses Claude LLM as external brain, mimics real player behavior
3. **Human Player** - Real human player through UI (future implementation)

## Core Architecture

### Game Master Pattern

The system uses a **Game Master** metaphor, similar to a role-playing session where the GM controls game flow:

- **Game Master Object**: Controls turn flow, manages game state, asks players to make decisions
- **Player Objects**: Stateless, respond to GM requests with decisions
- **Game State Object**: Current board state (pieces, resources, etc.)
- **Game Log**: Sequential, write-only log of all game events

### Key Principles

- Game Master owns the board and executes all state changes
- Player objects are stateless - all context passed in method calls
- All player types use the same interface
- LLM calls minimized through intent declarations

## Data Structures

### Game State Object

Represents current board state:

- Piece positions
- Player resources
- Tile states
- Current turn information

### Game Log

Sequential array of tagged log entries:

- **Content**: High-level description of events ("Player 3 moved to forest tile, encountered troll, defeated it")
- **Tags**: Player ID, turn number, entry type (movement, combat, diary, etc.)
- **Purpose**: Context for AI decisions, debugging, match analysis

### Turn Context Object

Wraps turn-specific information:

- Current turn number
- Dice rolled for this turn
- Remaining dice values

### Dice Action Object (Intent)

Player's declared intent for dice usage:

- **Type**: `move_champion`, `move_boat`, `harvest`, `build`
- **Parameters**: Vary by type
  - Move Champion: path (array of positions), arrival intents
  - Move Boat: champion to transport, destination coastal tile
  - Harvest: which resources to collect
- **Arrival Intents**: What player plans to do upon arrival (claim tile, pick up object, etc.)

## Player Interface

All player types implement the same interface with these key methods:

### decideDiceAction(gameState, gameLog, turnContext) → DiceAction

Primary decision method called by Game Master for each dice usage.

### makeDecision(gameState, gameLog, decisionContext) → Decision

Generic decision method for runtime choices (fight/flee, card choices, etc.).

### writeDiaryEntry(gameState, gameLog) → String

Called at start of each turn for high-level reflection (AI players only).

## Execution Flow

### Turn Sequence

1. **Start Turn**: Game Master calls `writeDiaryEntry()` for reflection
2. **Roll Dice**: Game Master rolls dice for player
3. **For Each Die**:
   - Game Master calls `decideDiceAction()`
   - Player returns DiceAction intent
   - Game Master executes/resolves action
   - Game Master updates game state and log
   - If runtime decisions needed, call `makeDecision()`
4. **End Turn**: Pass to next player

### Action Resolution Examples

#### Simple Movement

- Player decides: Move to owned resource tile
- Game Master: Updates position, logs "Player 1 moved champion to resource tile at X"

#### Adventure Card

- Player decides: Move to adventure tile
- Game Master: Draws card ("Forest Fire - lose 1 wood")
- Game Master: Updates state (removes wood), logs event
- Next dice decision has updated context

#### Decision Required

- Player decides: Move to unexplored tile
- Game Master: Reveals tile, awards Reveals tile, awards fame
- Game Master: Encounters chest card requiring decision
- Game Master: Calls `makeDecision()` with card context
- Player decides: Open or ignore chest
- Game Master: Resolves consequence, updates state/log

## Claude Player Implementation

### decideDiceAction() Implementation

```
1. Build prompt:
   - System message: Static game rules
   - User message:
     * "You are Player X"
     * Current game state
     * Game log so far
     * "Your remaining dice values are: [values]"
     * "Decide on a dice action"

2. LLM call with JSON schema for DiceAction

3. Return parsed DiceAction object
```

### makeDecision() Implementation

```
1. Build similar prompt but ending with:
   * Description of situation requiring decision
   * Available options
   * "Choose your decision and explain why"

2. LLM call returning Decision object with:
   * Choice made
   * Brief reasoning (for debugging)

3. Return Decision object
```

### writeDiaryEntry() Implementation

```
1. Prompt for high-level strategic thinking:
   * Current situation analysis
   * High-level plan
   * Strategic reasoning

2. Return reflection string for game log
```

## Decision Types

### Action Intents (Declared Upfront)

- What to do upon arrival at destination
- Saves LLM calls by deciding everything at once
- Examples: claim tile, pick up object, fight monster

### Runtime Decisions (Dynamic)

- Choices that arise during action resolution
- Examples: fight/flee, card choices, target selection
- Use generic `makeDecision()` method

## Optimizations

### Game Log Caching

- Cache system message + game log portion of prompts
- Only regenerate when game log changes
- Reduces redundant prompt construction

### Context Efficiency

- Pass complete context each time (stateless players)
- But optimize prompt building and caching
- Clear debugging through complete context

## Benefits

### Unified Interface

- Same methods work for Random, Claude, and Human players
- Easy to test different player types against each other

### Debugging & Analysis

- Complete game log with reasoning
- Diary entries show AI strategic thinking
- Clear separation of decisions and execution

### Extensibility

- Easy to add new decision types
- Player implementations can be optimized independently
- Clear points to add UI integration for human players

### LLM Efficiency

- Minimize calls through intent declarations
- Stateless design allows context optimization
- Clear prompt structure for consistent results
