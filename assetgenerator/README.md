# Doomspire Asset Generator

A collection of CLI utilities for generating game assets using AI.

## Scripts

### 1. Basic Image Generator (`generate-image.js`)

Simple CLI utility for generating images using OpenAI's DALL-E.

### 2. Monster Image Generator (`generate-monster-images.js`)

Advanced script that uses Claude to create detailed prompts and DALL-E to generate monster images in landscape format.

### 3. Event Image Generator (`generate-event-images.js`)

Advanced script that generates event card images by loading events from `eventCards.ts`, using both the event name and description to create detailed prompts with Claude, then generating images with DALL-E.

### 4. Treasure Image Generator (`generate-treasure-images.js`)

Advanced script that generates treasure card images by loading treasures from `treasureCards.ts`, using both the treasure name and description to create detailed prompts with Claude, then generating images with DALL-E.

### 5. Encounter Image Generator (`generate-encounter-images.js`)

Advanced script that generates encounter card images by loading encounters from `encounterCards.ts`, using both the encounter name and description to create detailed prompts with Claude, then generating images with DALL-E.

### 6. Trader Item Image Generator (`generate-traderItem-images.js`)

Advanced script that generates trader item card images by loading trader items from `traderItems.ts`, using both the item name and description to create detailed prompts with Claude, then generating images with DALL-E.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your API keys:

```bash
cp .env.example .env
# Edit .env and add your actual API keys:
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here  (required for monster generator)
```

## Usage

### Basic Image Generator

```bash
node generate-image.js "your image prompt here"
node generate-image.js "your prompt" --output custom-name.png
```

### Monster Image Generator

```bash
node generate-monster-images.js "Monster Name"
node generate-monster-images.js --all    # Generate all missing monsters
```

**Examples:**

```bash
node generate-monster-images.js "Fire Dragon"
node generate-monster-images.js "Shadow Wolf"
node generate-monster-images.js "Crystal Golem"
node generate-monster-images.js --all
```

**Process:**

1. Uses Claude AI to create a detailed image prompt based on the monster name and `image-style.md`
2. Prints the generated prompt to console
3. Uses OpenAI DALL-E to generate images (1024x1024)
4. Saves to `simulation/public/monsters/{monster-name}.png`

### Event Image Generator

```bash
node generate-event-images.js "Event Name"
node generate-event-images.js --all    # Generate all missing events
```

**Examples:**

```bash
node generate-event-images.js "Market day"
node generate-event-images.js "Thug Ambush"
node generate-event-images.js "Dragon raid"
node generate-event-images.js --all
```

**Process:**

1. Loads event data from `simulation/src/content/eventCards.ts`
2. Uses Claude AI to create detailed prompts based on event name, description, and tier
3. Prints the generated prompt to console
4. Uses OpenAI DALL-E to generate square images (1024x1024)
5. Saves to `simulation/public/events/{event-name}.png`

### Treasure Image Generator

```bash
node generate-treasure-images.js "Treasure Name"
node generate-treasure-images.js --all    # Generate all missing treasures
```

**Examples:**

```bash
node generate-treasure-images.js "Broken Shield"
node generate-treasure-images.js "A rusty sword"
node generate-treasure-images.js "Mysterious Ring"
node generate-treasure-images.js --all
```

**Process:**

1. Loads treasure data from `simulation/src/content/treasureCards.ts`
2. Uses Claude AI to create detailed prompts based on treasure name, description, and tier
3. Prints the generated prompt to console
4. Uses OpenAI DALL-E to generate square images (1024x1024)
5. Saves to `simulation/public/treasures/{treasure-name}.png`

### Encounter Image Generator

```bash
node generate-encounter-images.js "Encounter Name"
node generate-encounter-images.js --all    # Generate all missing encounters
```

**Examples:**

```bash
node generate-encounter-images.js "Angry dog"
node generate-encounter-images.js "Proud Mercenary"
node generate-encounter-images.js "Witch"
node generate-encounter-images.js --all
```

**Process:**

1. Loads encounter data from `simulation/src/content/encounterCards.ts`
2. Uses Claude AI to create detailed prompts based on encounter name, description, and tier
3. Prints the generated prompt to console
4. Uses OpenAI DALL-E to generate square images (1024x1024)
5. Saves to `simulation/public/encounters/{encounter-name}.png`

### Trader Item Image Generator

```bash
node generate-traderItem-images.js "Item Name"
node generate-traderItem-images.js --all    # Generate all missing trader items
```

**Examples:**

```bash
node generate-traderItem-images.js "Spear"
node generate-traderItem-images.js "Padded Helmet"
node generate-traderItem-images.js "Backpack"
node generate-traderItem-images.js --all
```

**Process:**

1. Loads trader item data from `simulation/src/content/traderItems.ts`
2. Uses Claude AI to create detailed prompts based on item name, description, and cost
3. Prints the generated prompt to console
4. Uses OpenAI DALL-E to generate square images (1024x1024)
5. Saves to `simulation/public/traderItems/{item-name}.png`

### Examples for Game Assets

#### Basic Generator

```bash
# Generate tile assets
node generate-image.js "medieval stone tile texture, top-down view, seamless pattern" --output stone-tile.png

# Generate character assets
node generate-image.js "fantasy warrior champion, pixel art style, top-down view" --output warrior-champion.png

# Generate resource icons
node generate-image.js "pile of gold coins, game icon, simple design, transparent background" --output gold-icon.png
```

#### Monster Generator

```bash
# Generate all missing monster cards for the game
node generate-monster-images.js --all

# Generate specific monster
node generate-monster-images.js "Troll Lord"
```

#### Event Generator

```bash
# Generate all missing event cards for the game
node generate-event-images.js --all

# Generate specific event
node generate-event-images.js "Market day"
```

#### Treasure Generator

```bash
# Generate all missing treasure cards for the game
node generate-treasure-images.js --all

# Generate specific treasure
node generate-treasure-images.js "Broken Shield"
```

#### Encounter Generator

```bash
# Generate all missing encounter cards for the game
node generate-encounter-images.js --all

# Generate specific encounter
node generate-encounter-images.js "Angry dog"
```

#### Trader Item Generator

```bash
# Generate all missing trader item cards for the game
node generate-traderItem-images.js --all

# Generate specific trader item
node generate-traderItem-images.js "Spear"
```

## Files

- `image-style.md` - Style template used by the monster generator
- `output/` - Directory where generated images are saved
- `.env` - Your API keys (create from .env.example)

## Output

- **Basic generator**: Square images (1024x1024) saved to `output/` directory
- **Monster generator**: Square images (1024x1024) saved to `simulation/public/monsters/` with kebab-case filenames
- **Event generator**: Square images (1024x1024) saved to `simulation/public/events/` with kebab-case filenames
- **Treasure generator**: Square images (1024x1024) saved to `simulation/public/treasures/` with kebab-case filenames
- **Encounter generator**: Square images (1024x1024) saved to `simulation/public/encounters/` with kebab-case filenames
- **Trader item generator**: Square images (1024x1024) saved to `simulation/public/traderItems/` with kebab-case filenames
- All images use "medium" quality for balance between speed and quality

## Requirements

- Node.js 18+
- OpenAI API key with access to DALL-E
- Anthropic API key with access to Claude (for monster, event, treasure, encounter, and trader item generators)
- Internet connection
