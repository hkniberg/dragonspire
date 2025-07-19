# Lords of Doomspire

A work-in-progress strategic board game design project featuring digital simulation and AI-powered gameplay assistance.

## Overview

**Lords of Doomspire** is a 2-8 player (4 players for now) strategic board game where players command champions to explore a dangerous island, gather resources, and ultimately seek to defeat the ancient dragon at Doomspire. It is inspired by games like Talisman, Catan, Agricola, and Game of Thrones (the board game).

This repository contains both the complete game design documentation and a work-in-progress digital simulation for playtesting and development. Assets will be added as the game is developed.

### Game Features

- **Resource Management**: Collect Food, Wood, Ore, and Gold through exploration and trading
- **Champion-Based Exploration**: Deploy champions across an 8x8 grid to discover new territories
- **Combat System**: Fight monsters, other players, and ultimately face the dragon
- **Multiple Victory Paths**:
  - **Combat Victory**: Defeat the dragon in battle
  - **Diplomatic Victory**: Reach max Fame and recruit the dragon.
  - **Economic Victory**: Control all starred resource tiles and lure the dragon to your side.
- **Building & Expansion**: Construct buildings in your castle to gain strategic advantages

## Project Structure

```
doomspire/
├── docs/                          # Game Design Documentation│
└── simulation/                    # Digital Game Simulation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI features)

### Quick Start

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd doomspire
   ```

2. **Set up the simulation**:

   ```bash
   cd simulation
   npm install
   ```

3. **Configure AI integration** (optional):

   ```bash
   cp env.example .env.local
   # Add your ANTHROPIC_API_KEY to .env.local
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**: Navigate to [http://localhost:3000](http://localhost:3000)

## Game Rules

The complete game rules are documented in [`docs/game-rules.md`](./docs/game-rules.md). This serves as the authoritative source for all game mechanics.

**Note**: A Git pre-commit hook automatically copies the latest game rules to `simulation/public/templates/`, which is used by AI in the simulation.

## Simulation

The simulation is auto-deployed to https://doomspire.vercel.app/
