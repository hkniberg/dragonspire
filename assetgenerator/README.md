# Doomspire Asset Generator

A collection of CLI utilities for generating game assets using AI.

## Scripts

### 1. Basic Image Generator (`generate-image.js`)

Simple CLI utility for generating images using OpenAI's DALL-E.

### 2. Monster Image Generator (`generate-monster-image.js`)

Advanced script that uses Claude to create detailed prompts and DALL-E to generate monster images in landscape format.

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
node generate-monster-image.js "Monster Name"
```

**Examples:**

```bash
node generate-monster-image.js "Fire Dragon"
node generate-monster-image.js "Shadow Wolf"
node generate-monster-image.js "Crystal Golem"
```

**Process:**

1. Uses Claude AI to create a detailed image prompt based on the monster name and `image-style.md`
2. Prints the generated prompt to console
3. Uses OpenAI DALL-E to generate a landscape image (1792x1024)
4. Saves to `output/monster-{name}-{id}.png`

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
# Generate monster cards for the game
node generate-monster-image.js "Flame Serpent"
node generate-monster-image.js "Ice Troll"
node generate-monster-image.js "Lightning Drake"
```

## Files

- `image-style.md` - Style template used by the monster generator
- `output/` - Directory where generated images are saved
- `.env` - Your API keys (create from .env.example)

## Output

- **Basic generator**: Square images (1024x1024) saved as PNG
- **Monster generator**: Landscape images (1792x1024) saved as PNG with monster name in filename
- All images use "standard" quality for faster generation

## Requirements

- Node.js 18+
- OpenAI API key with access to DALL-E
- Anthropic API key with access to Claude (for monster generator only)
- Internet connection
