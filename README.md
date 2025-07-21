# Lords of Doomspire

A strategic board game design project with digital simulation for playtesting and AI-powered gameplay.

## What is this?

**Lords of Doomspire** is a 4-player strategic board game where players command champions to explore a dangerous island, gather resources, and ultimately defeat a dragon. This repository contains the complete game design and a TypeScript simulation system that supports both web UI and headless CLI execution for AI-powered playtesting.

## Key Documentation

- **[Game Overview](docs/game-overview.md)** - Core game concept and mechanics
- **[Game Rules](docs/game-rules.md)** - Complete rulebook (source of truth)
- **[Architecture](docs/architecture.md)** - Simulation system design
- **[Development Plan](docs/plan.md)** - Current progress and roadmap

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI features)

### Installation

```bash
git clone <repository-url>
cd doomspire/simulation
npm install
```

### Running the Web UI

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Enter your Anthropic API key when prompted (stays local in browser).

### Running CLI Simulation

```bash
# Run a headless game simulation
node run-test.js
```

The CLI mode supports automated playtesting with AI players for game balance analysis.

## Live Demo

The simulation is deployed at: https://doomspire.vercel.app/
