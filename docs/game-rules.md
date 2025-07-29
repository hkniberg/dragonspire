# LORDS OF DOOMSPIRE

## Player Rulebook

---

## Overview

You are a lord commanding knights from your island castle to explore a dangerous neighboring island. Compete with other players to accumulate fame, might, and resources while seeking to reach the dragon at **Doomspire**.

Explore tiles, fight monsters and other players, claim resources, and buy knights/boats/buildings to achieve victory through combat, diplomacy, economics, or wealth.

---

## Victory Conditions

Win immediately by reaching **Doomspire** (one of the center 4 tiles) with any of these:

- **Combat Victory**: Defeat the dragon in battle
- **Diplomatic Victory**: Have 12+ Fame (dragon becomes your advisor)
- **Economic Victory**: Control 4+ starred resource tiles (dragon accepts tribute)
- **Gold Victory**: Have 20+ Gold (dragon shares treasures)

---

## Board structure

The board is an 8x8 grid of land tiles surrounded by 4 L-shaped ocean tiles in the corners. Knights move around on land tiles, while boats move around on ocean tiles and can transport knights between coastal land tiles.

The board has four key areas: Ocean, Tier 1, Tier 2, and Tier 3. Higher tier means higher risk and higher reward.

- Ocean zones. The surrounding ocean is divided into 4 ocean zones - northwest, northeast, southwest, southeast.
- Tier 1. These are the outer 2 layers of the 8x8 grid. The outermost tiles are coastal tiles.
- Tier 2. This is the second innermost layer of tiles, a ring of tiles surrounding the center.
- Tier 3. These are the center 4 tiles, containing dragonspire and 3 adventure tiles with high risk/reward.

All Tier 2 and Tier 3 tiles start unexplored (face down).

## Turn Structure

Each round has 3 phases:

1. **Roll Phase** (Parallel): Move the first player token clockwise, then all players roll dice simultaneously.
2. **Move Phase** (Sequential): One player at a time, use dice for movement and tile actions
3. **Harvest Phase** (Parallel): Use remaining dice for harvest and build actions

Pass Starting Player token clockwise after each round.

---

## Roll phase

First move the first player token to the next player clockwise.

Then everyone does this simultaneously:

- Collect dice. You get 1 die for your castle, and 1 die for each knight.
- For each die after the first two, you must pay 2 food in **dice tax**. If you can't, you don't get to roll those dice.
- Roll all your dice at once. These are your **action dice** for this round. They are used to do things like moving, harvesting, and building.

## Movement phase

Movement phase is done one player at a time, starting from the player who has the first player token.

During this phase the player can use their pre-rolled action dice to move and do things with their knights and boats. They may use all their dice, or save some for the harvest phase.

### Move knight (dice action)

Use a dice to move one knight up to that number of steps, and interact with the tile you land on.

Knight movement rules:

- Only horizontal/vertical movement, no diagonal
- Can only use one knight per die action
- Can move fewer steps than the die value, or even move zero steps to interact with your current tile.
- Stop when entering unexplored tiles or tile with monster on it.
- Can pass through opposing knights, but opposing player may force you to stop and fight.
- Cannot stop in the same tile as another knight, except in non-combat tiles (trader/mercenary/temple).

Multiple movements:

- You can use another action die to move the same knight again, as long as the knight has not interacted with a tile. This is a separate dice action.

Tile interaction rules:

- When a knight ends a movement, they may interact with the tile they ended on (or be forced to interact in some cases).
- See Tile Interaction below.

### Move boat (dice action)

Use a dice to move one boat up to die value steps, and optionally transport a knight between coastal tiles.

Boat movement rules:

- The boat moves between the four ocean zones - northwest, northeast, southwest, southeast.
- A boat can move fewer steps than the die value, or even move zero steps to transport a knight between coastal tiles in the same ocean zone.
- An ocean zone can contain any number of boats - no interaction happens between boats.

Knight transport rules:

- After moving the boat, you can optionally move a knight from one eligible coastal tile to another.
- Eligible tile = adjacent to any ocean zone the boat has passed through during the movement (including the starting ocean zone).
- A knight cannot stay on a boat between turns or dice actions. They get too seasick. They can only be transported between coastal tiles if both the start and end tiles are eligible as part of the same boat movement.

> Simple example:
>
> - Alice has a boat in the northwest ocean zone. She has a knight in her home tile at (0,0), and wants to move to a resource tile three steps east (0,3).
> - She only rolled two 1's in the roll phase, and can't reach that tile using knight movement.
> - So she uses one of the dice to do a boat movement of 0 steps. That makes all coastal tiles in the northwest ocean zone eligible for transport, so she moves the knight from (0,0) to (0,3) and claims the tile.

> Advanced example:
>
> - Alice has a boat in the northeast ocean zone. She has a knight at position (0,0), , and wants to attack a bear near at (0,6), near the northeast corner.
> - She only rolled a 1 and a 2 in the roll phase, which is not enough to get the knight to the target position using knight movement actions.
> - She uses the 2 to do a boat movement of 2 steps: northeast => northwest => back to northeast. The knight's starting position at (0,0) is a coastal tile in the northwest zone, and the target tile at (0,6) is a coastal tile in the northeast zone. Both are eligible for transport, so the boat can transport the knight from (0,0) to (0,6) and she can attack the bear.

### Tile interaction

When a knight is moved (or uses a knight movement action without moving), a Tile Interaction may happen.

Forced interactions (in priority order):

- Explore. If you enter an unexplored tile you gain 1 Fame, flip the tile, and check for further interactions.
- Combat. If a monster or opposing knight is on the tile, combat will happen. See Combat section below.
- Adventure. If you enter an adventure tile that has remaining adventure tokens, you must draw a card. See Adventure Cards section below.

Voluntary interactions:

Once any forced interactions are done, the player can perform any voluntary interactions.

- Using special locations - trader/mercenary/temple. See Special Locations section below.
- Claiming or conquering a resource tile. See resource system for details.
- Fighting the dragon at Doomspire
- Pick up or dropping items in a tile

Multiple interactions:

- Normally you can only be forced to interact once. For example if you enter an adventure tile with a monster already present, you will be forced to fight the monster but not draw another adventure card after.
- Exception: when exploring a tile, you may be forced to interact with the revealed tile again.
- You can perform multiple voluntary interactions in the same tile, for example picking up two items and interacting with the trader. Special locations have specific rules around multiple use, see Special Locations section below.
- You can not voluntarily draw an adventure card after combat.

> Example: Alice's knight enters an unexplored tile. She explores it (forced interaction), gains 1 fame, flips the tile. It is an adventure card. She flips the adventure card (forced interaction), and draws a monster. She fights the monster (as part of the same interaction) and wins, gaining further fame and resources. The knight cannot move again this turn, since it has interacted with a tile.

> Example:
>
> - Bob's knight enters an adventure tile which has two adventure tokens.
> - He draws a card (removing one token) and it is a bear. He loses the fight, knight is sent home and the bear stays. So that tile now contains a bear and one remaining adventure token.
> - Next turn, Alice's knight enter the same tile. She is forced to fight the bear (since combat is higher prio than adventure cards). She wins, gains fame and loot from the bear, but cannot draw an adventure card until next turn (which would require a knight movement action of 0 steps).

## Harvest phase

All players do their harvest phase at the same time.

If the player has any remaining action dice after the movement phase, they can use them to harvest resources or do building actions.

### Harvest (dice action)

Use one or more die to harvest resources from resource tiles.

- Total die value = number of different resource tiles you can harvest from
- You can harvest from any of your claimed resource tiles, as long as they aren't blockaded.
- You can harvest from opposing player's resource tiles that you are blockading.
- Gain ALL resources from each selected resource tile.
- Using harvest actions is the only way to obtain resources from resource tiles.

> Simple example:
>
> - This is the first round. Alice rolls 1,2 during the roll phase.
> - In the movement phase, Alice uses the 1 to claim a resource tile that provides 2 ore.
> - During the harvest phase, Alice uses the 2 to harvest. She owns 2 resource tiles - her home tile (providing 1 food and 1 wood), and the new tile she claimed (providing 2 ore). So she can harvest from both tiles and gains 1 food, 1 wood, and 2 ore.

> Advanced example (blockade):
>
> - Alice owns 4 resource tiles: her home tile (1 food, 1 wood), a gold tile (2 gold), a wood tile (1 wood), and an ore tile (2 ore).
> - Bob has 2 knights, one on Alice's gold tile and one on her wood tile, attempting to blockade them.
> - Alice has a knight adjacent to her gold tile, so it is automatically protected from blockade. But her wood tile is unprotected.
> - During the harvest phase, Alice uses a 2 to harvest. Her eligible resource tiles are her home tile, the gold tile, and the ore tile - but not the wood tile because it's blockaded. She chooses to harvest from the gold and ore tiles, gaining 2 gold and 2 ore.
> - Bob also harvests, using a 1. He doesn't own any resource tiles other than his home tile. His eligible resource tiles are his home tile and Alice's wood tile that he is blockading. He needs wood, so he chooses to harvest from the wood tile, gaining 2 wood.

### Build (dice action)

A build action requires a die, but the value on the die doesn't matter.

Use a build action to expand your capabilities. Construct castle buildings, recruit knights, buy boats, etc. See Buildings and Upgrades section for details.

## Adventure cards

Adventure cards are drawn when a knight enters an adventure tile or oasis tile that has remaining adventure tokens. This is a forced interaction. The only time a knight would NOT draw an adventure card is if they are forced to fight a monster or knight who was already present in the tile.

### Choosing which deck to draw from

Adventure cards are organized into 9 decks, 3 decks per tier. The tile shows which tier of adventure cards you should draw from, and player can choose which of the 3 decks within that tier to draw from.

Each adventure card has a theme which decides which kinds of monsters and resources may show up:

- Beast adventure cards: More likely to provide food resources, and monsters are more likely to be beasts (relevant to some items)
- Cave adventure cards: More likely to provide ore resources and cave-dwelling monsters.
- Grove adventure cards: More likely to provide wood resources and forest creatures.

Each cards within each tier are randomly shuffled into 3 decks, so you may not always have access to all themes.

> Example:
>
> - Alice needs wood. She looks at the 9 adventure decks.
> - The three Tier 1 decks have top card Beast, Cave, and Cave respectively.
> - The three Tier 2 decks have top card Cave, Cave, Grove.
> - Alice needs wood, so she decides to take the risk and goes to Tier 2 adventure tile and draws the Grove card.
> - Beneath that card is a Cave card, so the next player going to a Tier 2 adventure tile must draw one of the three available Cave cards.

### Adventure card types

Each adventure deck (regardless of theme/tier) contains a mix of:

- Monster cards. Fight the monster or flee, earn fame and resources if you win. See Combat section.
- Event cards: Follow instructions. Could lead to earning items, gaining fame, moving yourself or other players, and all kinds of things depending on the event.
- Treasure cards: May give your knight an powerful item. See Items section.
- Encounter cards: May give your knight a follower. See Followers section.

## Combat

Combat happens when:

- A knight enters a tile with a monster or opposing knight
- A knight draws an adventure card with a monster
- A knight enters doomspire and chooses to fight the dragon
- A knight attempts to pass through another knight's tile, and that knight forces a fight

### Fleeing combat

- A knight can attempt to flee from combat. For example if attacked by a stronger player, or if drawing an adventure with an unbeatable monster.
- Exception: A player who chose to fight cannot flee.
- When fleeing, roll 1D3:
  - 1: Failure. Combat happens as normal.
  - 2: Partial success. Knight flees to home tile, without any loss.
  - 3: Success. Knight flees to closest unoccupied tile owned by that player. If none are available, flee home. If several are the same distance, player chooses which.

### Resolving knight to monster combat

When fighting a monster (including the dragon):

- Roll 1D3
- Add your Might
- Add +1 for each supporting knight or warship adjacent to the combat tile. Even from other players, if they choose to support you.
- Add any other bonuses from items or followers
- The resulting attack value must be greater than or equal to the monster's Might to win.

> Example: Calculating the odds of winning
>
> Bob has 1 might and want to figure out if that bandit with 3 might is worth fighting.
>
> - 1D3 roll gives 1, 2, or 3.
> - +1 might gives 2, 3 or 4.
> - Bob needs 3 or more to win, so 67% chance (rolls of 2 or 3 succeed). Worth trying!

> Example: Support
>
> Alice has 1 might, 2 knights, and the warship upgrade. She wants to attack a bear with 5 might. The bear is in a coastal tile.
>
> - She moves knight 1 to a neighbouring tile, and uses her boat to transport knight 2 into the tile with the bear. Combat ensues, with support from both knight 1 and the warship.
> - Alice rolls 1D3 and gets a 2.
> - +1 might = 3.
> - +2 supporting units = 5.
> - She matches the bear's might, and wins.

### Resolving knight to knight combat

This is just like monster combat, but both players roll 2D3 and ties are rerolled until someone wins. Each knight applies their own combat bonuses: Might + supporting units + item/followers. Highest attack value wins.

### Support from other players

- Support can be received from other players' neighbouring knights/warships as well, allowing for collaboration and diplomacy.
- Support from your own units happens automatically, while support from other players is announced after the dice roll. This opens up for collaboration, diplomacy, and treachery ("Hey, you said you would support me!". "Sorry, I lied.")
- Monsters cannot receive support

### Result of winning

### Re

-

### Fighting Monsters

- **Flee**: Return home, lose 1 Fame
- **Fight**: Roll 1D3 + your Might + adjacent support
- **Support**: Adjacent knights/warships add +1 each (any player can support)
- **Win**: Attack ≥ Monster's Might, gain rewards
- **Lose**: Return home, pay 1 resource to heal OR lose 1 Fame

**Combat Example:**

- Knight has 1 Might, Monster has 3 Might
- Knight rolls 1D3 (possible: 1, 2, 3) + 1 Might = 2, 3, or 4 total
- Need ≥3 to win, so 67% chance (rolls of 2 or 3 succeed)

### Fighting Knights

- Both roll 2D3 + Might + adjacent support
- Highest wins (reroll ties)
- **Winner**: Gains 1 Fame, stays in tile, may loot (1 resource OR 1 item)
- **Loser**: Returns home (no healing cost)

### Dragon Combat

- Dragon has 8 + 1D3 Might (determined when first revealed)
- **Lose**: Knight is eaten (removed from game)
- **Win**: Instant victory

## Items

## Followers

---

## Resource System

### Claiming Tiles

- Place flag on unclaimed resource tiles
- **Conquer**: Pay 1 Might (military) or 1 Fame (treachery)
- **Protection**: Knights protect adjacent tiles from conquest/blockade

### Blockading

- Knight on enemy resource tile can harvest from it
- Owning player cannot harvest while blockaded
- Stop blockade by placing knight adjacent or attacking blockader

### Trading

- Freely trade resources with other players anytime
- Only current player can initiate trades
- Items cannot be directly traded (drop/pickup only)

### Buildings

**Cost** → **Benefit**

- **2nd Knight**: 3 Food, 3 Gold, 1 Ore → +1 die
- **3rd Knight**: 6 Food, 6 Gold, 3 Ore → +1 die
- **Boat**: 2 Wood, 2 Gold → Additional boat (max 2)
- **Warships**: 2 Wood, 1 Ore, 1 Gold → All boats become warships (+1 combat support)
- **Market**: 2 Food, 2 Wood → Sell resources 2:1 for gold
- **Blacksmith**: 2 Food, 2 Ore → Buy 1 Might for 1 Gold + 2 Ore (once per harvest)
- **Chapel**: 3 Wood, 4 Gold → +3 Fame (once per player)
- **Monastery**: 4 Wood, 5 Gold, 2 Ore → +5 Fame (requires Chapel, once per player)

---

## Special Locations

Non-combat zones where multiple knights can coexist:

- **Temple**: Sacrifice 3 Fame → 1 Might (once per turn)
- **Trader**: Exchange 2 any resources → 1 any resource; Purchase items
- **Mercenary Camp**: 3 Gold → 1 Might (once per turn)
- **Doomspire**: Dragon's lair, victory location

**Monster Lairs** (must defeat to use tile):

- **Wolf Den**: Starts with wolf monster
- **Bear Cave**: Bear appears when revealed

---

## Items & Advanced Rules

### Knight Inventory

- Each knight: max 2 items, max 2 followers
- **Drop items**: Anytime, place in current tile
- **Pick up items**: End move in tile with items
- **Followers**: Cannot be stolen, can be dismissed anytime

### Adventure Cards

Draw when landing on adventure tiles with tokens remaining.

**Choose from 3 decks by biome hint:**

- **Plains**: Often food
- **Woodlands**: Often wood
- **Mountains**: Often ore

**Card Types:**

- **Monster**: Fight or flee
- **Event**: Follow instructions
- **Treasure**: Gain item (drop if inventory full)

**Tiers match board areas:**

- **Tier 1**: Low risk/reward (outer layers)
- **Tier 2**: Medium risk/reward (middle layer)
- **Tier 3**: High risk/reward (center)

### Fame

- **Gain**: Explore (+1), defeat monsters, win combat (+1), buildings
- **Lose**: Flee (-1), treachery conquest (-1), certain events
- **Minimum**: 0

---

_Claim your destiny at Doomspire!_
