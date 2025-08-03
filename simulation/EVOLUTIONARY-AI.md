# Lords of Doomspire - Evolutionary AI Player

This document explains how to use and experiment with the Evolutionary AI player system.

## Overview

The Evolutionary AI uses genetic algorithms to evolve simple heuristics-based players. Each AI player has a "genome" that defines their strategic preferences and behavior patterns. Through repeated games and mutation, successful strategies emerge naturally.

## Quick Start

### Testing Individual Evolutionary Players

You can use evolutionary players in any game by specifying the player type:

```bash
# Single turn with evolutionary players
node run-test.js --single-turn --p1 evolutionary --p2 evolutionary

# Complete game with mixed player types
node run-test.js --p1 evolutionary --p2 random --p3 claude --p4 evolutionary

# Specific number of turns
node run-test.js --turns 5 --p1 evolutionary --p2 evolutionary --p3 evolutionary --p4 evolutionary

# Use evolved player from saved genome file
node run-test.js --p1 evolved:best-genome-2024-01-01T12-00-00.json --p2 random

# Use latest evolved player (auto-loads newest genome file)
node run-test.js --p1 evolved --p2 claude
```

### Additional CLI Options

You can customize games with these additional options:

```bash
# Starting resources (useful for testing late-game scenarios)
node run-test.js --single-turn --gold 10 --fame 5 --might 3 --food 2 --wood 2 --ore 2

# Claude AI instructions
node run-test.js --single-turn --p1 claude --claude-instructions "Focus on aggressive expansion"

# Combined options
node run-test.js --turns 10 --p1 evolved --p2 claude --gold 5 --claude-instructions "Hoard gold"
```

### Running Evolution

To run the full evolutionary process and evolve better players over time:

```bash
# Basic evolution (10 generations, 20 population size, 25 games per generation)
node run-evolution.js

# Fast evolution for testing (fewer games per generation)
node run-evolution.js --fast

# Larger population
node run-evolution.js --large

# Custom number of generations
node run-evolution.js --generations=20

# Combined options
node run-evolution.js --fast --generations=5
```

## How It Works

### Genome Structure

Each evolutionary player has a genome with these parameters (all values 0-1):

- **combatRiskTolerance**: Willingness to engage in combat (0 = avoid, 1 = always fight)
- **economicFocus**: Priority for resource collection and management
- **territorialAggression**: Desire to claim and expand territory
- **explorationAggression**: Willingness to explore higher-tier areas
- **Victory Path Weights**: Focus distribution across different victory conditions
  - famePathWeight: Fame-based victory focus
  - goldPathWeight: Wealth accumulation focus
  - territorialPathWeight: Territorial control focus
  - combatPathWeight: Military dominance focus
- **defensivePosture**: Balance between protection and expansion
- **Dragon-Seeking Behavior**: Smart endgame behavior
  - dragonTimingAggression: How quickly to attempt dragon when victory conditions are met
  - safetyMarginPreference: Preference for exceeding victory thresholds before attempting

### Evolution Process

1. **Population**: Start with 20-50 random genomes
2. **Games**: Each generation plays 25+ four-player games with random genome combinations
3. **Fitness**: Players scored on placement, win rate, and final game state
4. **Selection**: Best performers are kept for next generation
5. **Mutation**: Remaining spots filled by mutating successful genomes
6. **Crossover**: Some new genomes created by combining two successful parents

### Fitness Calculation

Players are evaluated on multiple criteria:

- **Placement bonus**: Better final ranking = higher score
- **Win rate**: Percentage of games won
- **Final resources**: Fame, gold, might, and total resources
- **Resource efficiency**: Economic performance

## Observing Results

### Strategic Assessments

Evolutionary players provide strategic assessments showing their current focus:

```
Alice assessment: Strategic Focus: gold | Territorial control: 1.0 | Combat readiness: 1.0 | Economic strength: 2.0
```

When victory conditions are met, you'll see dragon-seeking behavior:

```
Alice assessment: Strategic Focus: gold | Territorial control: 1.0 | Combat readiness: 1.0 | Economic strength: 27.0 | DRAGON READY (fame, gold) - SEEKING DOOMSPIRE
```

### Movement Reasoning

Each action includes reasoning based on the player's heuristics:

```
Alice movement: Champion1 moved from (0, 0) to (1, 0) | Reason: Moving towards resource tile
```

When seeking the dragon, you'll see prioritized movement toward central tiles:

```
Alice movement: Champion1 moved from (0, 0) to (2, 0) | Reason: Moving towards doomspire tile
```

### Evolution Statistics

The evolution process shows progress:

```
=== Generation 3 ===
Best Fitness: 45.23
Average Fitness: 32.15
Population Diversity: 0.425

Top 3 Genomes:
1. Fitness: 45.23, Win Rate: 35.0%, Avg Placement: 2.1
   Combat: 0.34, Economic: 0.78, Territorial: 0.56, Exploration: 0.23
   Victory Focus - Fame: 0.15, Gold: 0.45, Territorial: 0.25, Combat: 0.15
   Dragon Timing: 0.67, Safety Margin: 0.23, Defensive: 0.45
```

## Customization

### Modifying Heuristics

You can add new heuristics by editing `EvolutionaryPlayer.ts`:

1. Add new genome parameters to `PlayerGenome` interface
2. Update `generateRandomGenome()` and `mutateGenome()` functions
3. Implement decision logic that uses the new parameters

### Adjusting Evolution Parameters

Edit `EvolutionManager.ts` to change:

- Population size
- Mutation rate
- Selection pressure
- Fitness calculation weights

### Example Custom Heuristic

```typescript
// Add to PlayerGenome interface
mightBuildingPriority: number;

// Use in decision making
if (this.genome.mightBuildingPriority > 0.7 && player.might < 5) {
  // Prioritize building might-generating buildings
}
```

## Expected Results

After evolution, you should see:

1. **Multiple Archetypes**: Economic, military, balanced, and opportunistic players
2. **Strategic Adaptation**: Players that counter common strategies
3. **Improved Performance**: Higher win rates and better resource efficiency
4. **Emergent Behaviors**: Tactics not explicitly programmed

## Troubleshooting

### Common Issues

1. **All players look the same**: Increase mutation rate or population diversity
2. **No improvement**: Check fitness function rewards correct behaviors
3. **Crashes during games**: Individual players may have bugs in decision logic

### Performance Tips

1. Use `--fast` for initial testing
2. Run overnight for serious evolution experiments
3. Save best genomes and restart evolution from them
4. Monitor diversity to avoid convergence to single strategy

## Architecture

- `EvolutionaryPlayer.ts`: Individual AI player with genome-based decisions
- `EvolutionManager.ts`: Genetic algorithm implementation
- `run-evolution.js`: CLI script for running evolution experiments

The evolutionary system is designed to be:

- **Cost-effective**: No LLM costs during training
- **Fast**: Hundreds of games per hour
- **Interpretable**: Strategies based on understandable heuristics
- **Extensible**: Easy to add new behaviors and parameters

## Complete Workflow

Here's your complete evolutionary AI workflow:

### 1. **Run Initial Evolution**

```bash
# Start with basic evolution
node run-evolution.js --fast --generations=5

# After completion, you'll see:
# 💾 Evolution results saved to: evolution-results/evolution-2024-01-01T12-00-00.json
# 🏆 Best genome saved to: best-genomes/best-genome-2024-01-01T12-00-00.json
```

### 2. **Test Your Evolved Player**

```bash
# Test against random opponents
node test-evolved-player.js best-genome-2024-01-01T12-00-00.json

# Test against Claude
node test-evolved-player.js best-genome-2024-01-01T12-00-00.json --opponent=claude --games=3

# Use in regular simulation
node run-test.js --p1 evolved:best-genome-2024-01-01T12-00-00.json --p2 claude --p3 random --p4 tactical
```

### 3. **Continue Evolution**

```bash
# Continue evolving from your best results
node run-evolution.js --load=evolution-2024-01-01T12-00-00.json --generations=10

# This creates even better genomes building on previous success
```

### 4. **Iterative Improvement**

```bash
# Keep evolving in cycles
node run-evolution.js --load=evolution-2024-01-01T15-30-00.json --generations=20 --large
```

## File Structure

After running evolution, you'll have:

```
simulation/
├── evolution-results/     # Full population saves
│   ├── evolution-2024-01-01T12-00-00.json
│   └── evolution-2024-01-01T15-30-00.json
├── best-genomes/         # Individual best performers
│   ├── best-genome-2024-01-01T12-00-00.json
│   └── best-genome-2024-01-01T15-30-00.json
└── gamelogs/            # Individual game logs
```

## Success Measurement

The system uses a sophisticated fitness calculation that measures success through multiple criteria:

### Fitness Components

1. **Win Rate**: Direct wins are heavily rewarded
2. **Dragon Readiness**: Meeting victory conditions (fame, gold, territorial, combat paths)
3. **Victory Condition Proximity**: Progress toward each victory threshold
4. **Game Placement**: Consistent strong finishes across games
5. **Strategic Development**: Champion count, territorial control, resource efficiency

### Key Metrics Tracked

- **Win Rate**: Percentage of 1st place finishes
- **Average Placement**: Lower is better (1.0 = always wins, 4.0 = always loses)
- **Dragon Readiness**: How often victory conditions are met
- **Strategic Efficiency**: Economic performance and territorial control

## Next Steps

1. **Start Simple**: Run `node run-evolution.js --fast --generations=5`
2. **Test Results**: Use `node test-evolved-player.js <genome-file>`
3. **Iterate**: Continue evolution with `--load=<previous-results>`
4. **Compare**: Pit evolved players against Claude and other AIs
5. **Analyze**: Study successful genome parameters to understand winning strategies
6. **Scale Up**: Use `--large` and more generations for serious evolution runs

The system is designed for continuous improvement - each evolution cycle builds on the previous one!
