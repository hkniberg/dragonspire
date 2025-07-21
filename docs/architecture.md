# Lords of Doomspire - Simulation Architecture

## Overview

This document outlines the target architecture for the Lords of Doomspire game simulation system. The primary purpose is to create a robust platform for playtesting the board game with AI players to analyze game balance, strategies, and rule effectiveness.

## Design Principles

1. **Separation of Concerns**: Complete isolation between game logic and presentation layers
2. **Player Abstraction**: Pluggable AI player system supporting multiple player types
3. **Interactive Turn Execution**: Players receive immediate feedback from actions to make informed decisions
4. **Immutable State**: Game state represented as immutable snapshots for easy replay and analysis
5. **Dual Mode Operation**: Single codebase supports both UI (Next.js) and headless (CLI) execution

## High-Level Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   CLI Layer     │    │   Game Engine   │
│   (Next.js)     │    │   (Node.js)     │    │     (Core)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Player System │
                    │   (Pluggable)   │
                    └─────────────────┘
```

## Component Details

### 1. Game Engine Layer

**GameSession**

- Manages complete game lifecycle (setup → playing → finished)
- Orchestrates turn execution between players
- Maintains game state and enforces rules
- Provides `ExecuteActionFunction` to players for interactive turns

**GameState**

- Immutable representation of current game state
- Contains board state, player positions, resources, scores
- Supports serialization for logging and replay

**ActionExecutor**

- Validates player actions against game rules
- Applies actions to generate new game states
- Calculates action results and generates summary descriptions
- Checks victory conditions

**MoveGenerator**

- Analyzes game state to determine valid actions for a player
- Used by RandomPlayer and as hints for AI players
- Ensures action validity before execution

### 2. Player System

**Player Interface**

```typescript
interface Player {
  getName(): string;
  getType(): PlayerType;

  executeTurn(
    gameState: GameState,
    diceRolls: number[],
    executeAction: ExecuteActionFunction
  ): Promise<void>;
}
```

**ExecuteActionFunction**

```typescript
type ExecuteActionFunction = (action: GameAction) => {
  newGameState: GameState;
  summary: string;
};
```

**Player Implementations**

- **RandomPlayer**: Selects random valid actions from available options
- **ClaudePlayer**: Uses LLM with tool calling to make strategic decisions
- **HumanPlayer**: Interfaces with UI for manual player input (future)

### 3. Action System

**GameAction Types**

- `MoveChampionAction`: Move champion along a path of tiles
- `MoveBoatAction`: Move boat with optional champion transport
- `HarvestAction`: Collect resources from claimed tiles
- Additional actions as game features expand

**Interactive Execution Flow**

1. Player receives current game state and dice rolls
2. Player submits action via `executeAction` function
3. Game engine validates action and applies changes
4. Player receives updated state and result summary
5. Player can make additional actions or end turn

### 4. Logging & Replay System

**GameLogger**

- Records all actions, state changes, and turn summaries
- Produces structured logs for analysis and replay
- Supports multiple output formats (JSON, CSV)

**ReplayEngine**

- Reconstructs game sessions from logs
- Enables step-by-step playback
- Useful for debugging and post-game analysis

## Directory Structure

```
simulation/
├── src/
│   ├── engine/
│   │   ├── GameSession.ts
│   │   ├── ActionExecutor.ts
│   │   └── ReplayEngine.ts
│   ├── game/
│   │   ├── GameState.ts
│   │   ├── MoveGenerator.ts
│   │   └── actions/
│   ├── players/
│   │   ├── Player.ts (interface)
│   │   ├── RandomPlayer.ts
│   │   ├── ClaudePlayer.ts
│   │   └── HumanPlayer.ts
│   ├── logging/
│   │   ├── GameLogger.ts
│   │   └── LogAnalyzer.ts
│   ├── components/ (UI components)
│   ├── pages/ (Next.js pages)
│   ├── cli/
│   │   └── CLIRunner.ts
│   └── lib/
│       ├── types.ts
│       ├── llm.ts
│       └── tools.ts
```

## Execution Flow

### UI Mode (Next.js)

1. User selects players and configuration via web interface
2. GameSession initialized with selected players
3. UI subscribes to game state changes and action results
4. User can execute turns step-by-step or enable autoplay
5. Game progress displayed visually with move animations
6. Complete game log available for export and analysis

### CLI Mode (Node.js)

1. Configuration loaded from file or command line parameters
2. GameSession runs headlessly with specified players
3. Progress reported to console with structured logging
4. Game log saved to file for later analysis
5. Supports batch execution of multiple games

### Turn Execution (All Modes)

1. GameSession calls `player.executeTurn()` with current state and dice
2. Player analyzes state and submits actions via `executeAction`
3. ActionExecutor validates and applies each action
4. Player receives immediate feedback and updated state
5. Player continues until all dice used or chooses to end turn
6. GameSession checks victory conditions and advances to next player

## AI Player Integration

### LLM Integration

- **ClaudePlayer** uses Anthropic's Claude via tool calling
- Tools correspond to game actions (moveChampion, harvest, etc.)
- LLM receives game state, executes tools, gets results, continues conversation
- System prompts include complete game rules and strategic guidance

### Tool Execution Loop

1. LLM analyzes game state and available dice
2. LLM calls tools to execute actions
3. Tool results (action summaries) fed back to LLM
4. LLM can make additional actions based on results
5. Process continues until LLM completes turn

## Configuration System

**SimulationConfig**

- Player selection and configuration
- Game variant settings
- Logging and output preferences
- UI display options

**Extensibility**

- Easy addition of new player types
- Configurable game rule variants
- Pluggable logging and analysis modules

## Benefits

1. **Testability**: Each component can be unit tested in isolation
2. **Extensibility**: Simple to add new AI players or game rule variants
3. **Debuggability**: Complete action logs enable thorough post-game analysis
4. **Performance**: Headless mode supports rapid batch simulation
5. **Maintainability**: Clear separation of concerns and well-defined interfaces
6. **Flexibility**: Same core engine powers both interactive UI and automated testing

## Future Extensions

- **Advanced AI Players**: Monte Carlo Tree Search, minimax, neural networks
- **Game Variants**: Rule modifications, different board sizes, player counts
- **Analysis Tools**: Statistical analysis, strategy pattern detection
- **Multiplayer**: Human vs AI games over network
- **Visualization**: Advanced game replay with move animations

This architecture provides a solid foundation for comprehensive game testing while maintaining flexibility for future enhancements and research.
