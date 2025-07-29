# LORDS OF DOOMSPIRE - AI Player Reference

## Victory Conditions

Win immediately by successfully interacting with the Dragon at Doomspire tile (near center of board, initially hidden/unexplored):

- **Combat**: Defeat the dragon (8 + D3 Might)
- **Diplomatic**: Have 12+ Fame and visit dragon
- **Economic**: Control 4+ starred resource tiles and visit dragon
- **Gold**: Have 20+ Gold and visit dragon

## Turn Structure

1. **Roll Phase** Roll dice. Number of dice = 1 + number of knights.

- Food tax: Pay 2 food per die beyond first two, otherwise you can't use it.
- Rolled dice are used for knight/boat actions and harvest/build.

2. **Move Phase** Use dice for knight/boat actions
3. **Harvest Phase** Use remaining dice for harvest/build
4. **End Turn**: Pass starting player token

## Actions (spend 1 die each for each action)

**Move & Act**: Move knight up to die value (orthogonal only)

- Must stop when: entering unexplored tile, tile with monster, or ending on another knight
- Can pass through knights but opponent may force combat
- Cannot: enter opponent's home tile, pass through monster tiles
- Ending turn on a tile with a monster or knight causes combat
- After any tile interaction, knight cannot act further this turn

**Boat Travel**: Move boat between ocean zones and/or transport one knight between coastal tiles

- A boat action can move a knight between two coastal tiles anywhere along the boat's movement path
- Boat doesn't have to move, it can spend dice to transfer knights between coastal tiles in same ocean zone.

**Harvest**: Collect from die value number of your owned tiles (get ALL resources each tile produces)

- Cannot harvest from tile if blockaded by another knight
- Can harvest opponent's tile if you're blockading it
- Home tile = 1 wood + 1 food

**Build**: Construct building or recruit (die value irrelevant)

## Combat

**Knight vs Monster**: Knight rolls 1D3 + Might + support (+1 per adjacentknight/warship)

- Monster doesn't roll dice, it has only the fixed might value.
- Win (≥ monster might): Gain rewards
- Lose: Return home, pay 1 resource or lose 1 fame
- Simple combat calculation example:
  - Knight has 1 Might
  - Monster has 3 Might
  - Knight rolls 1D3, which gives possible values of 1, 2, or 3.
  - Adding the Knight's 1 might gives possible values of 2, 3, or 4.
  - Knight must achieve 3 or higher to win (>= Monster's might), so odds are 67%

**Knight vs Knight**: Both roll 2D3 + Might + support (+1 per adjacent knight/warship)

- Higher value wins. Reroll on tie.
- Winner: +1 Fame, stays, may take 1 resource OR 1 item from loser
- Loser: Returns home (no healing cost)
- Tie: Reroll

**Knight vs Dragon**: Knight roll 1D3 + Might + support (+1 per adjacent knight/warship)

- Dragon might = 8 + 1D3, determined when dragon is revealed
- Knight's roll + might + support must be >= dragon might to win
- Loss = knight removed from game
- Win = win the game

## Tile Types

- **Resource**: Claim with flag, harvest for resources. Some guarded by monsters. Each resource tile a specific set of resources that it can provide, if used during a harvest action.
- **Adventure**: Draw card if tokens remain (choose from 3 tier-appropriate decks by biome)
- **Oasis**: Like adventure but can be restocked via events
- **Home**: Starting tile, permanent ownership, non-combat zone
- **Special Locations** (non-combat zones):
  - Temple: Can pay 3 Fame to gain 1 Might, once per turn.
  - Trader: Exchange any resource for any other resource at 2:1 rate (pay 2 of one resource, get 1 of any other resource: Food, Wood, Ore, or Gold). Can execute multiple trades. Can also buy items for gold - weapons, shield, backpack, etc.
  - Mercenary Camp: Can pay 3 Gold to gain 1 Might, once per turn.
  - Doomspire: Dragon lives here. Victory location. Located in one of the 4 center tiles (4, 4), (4, 5), (5, 4), (5, 5).
- **Monster Lairs**: Wolf Den (pre-placed), Bear Cave (Tier 2, place on reveal)

## Knight Inventory

- Max 2 items, 2 followers per knight
- Items: Can drop/pick up, stolen in combat
- Followers: Cannot be stolen, dismissal permanent

## Build actions (Cost → Benefit)

- **Warship**: 2 Wood, 1 Ore, 1 Gold → All boats become warships (+1 combat support to adjacent coastal tiles)
- **Market**: 2 Food, 2 Wood → Sell resources 2:1 for Gold
- **Blacksmith**: 2 Food, 2 Ore → Buy 1 Might for 1 Gold + 2 Ore (1x/harvest)
- **Chapel**: 3 Wood, 4 Gold → +3 Fame immediately
- **Monastery**: 4 Wood, 5 Gold, 2 Ore → +5 Fame immediately (Chapel upgrade)
- **2nd Knight**: 3 Food, 3 Gold, 1 Ore → +1 action die and +1 more knight piece on board
- **3rd Knight**: 6 Food, 6 Gold, 3 Ore → +1 action die and +1 more knight piece on board
- **2nd Boat**: 2 Wood, 2 Gold → +1 more boat piece on board

## Blockading

- A resource tile is blockaded if unprotected, and opposing knight is on it.
- When harvesting, a blockaded tile counts as if belonging to the blockading player.

## Protection

- Knights protect 4 adjacent tiles automatically.
- Warships protect all coastal tiles in their zone automatically.
- Protected tiles cannot be conquered or blockaded.

## Adventure Cards

- Monster (fight), Event (follow text), Treasure (take if space)

## Conquering resource tiles

- If your knight ends move in an opposing unprotected resource tile, you can spend 1 Might or 1 Fame to take it over.
