# LORDS OF DOOMSPIRE

## Player Rulebook

---

## Overview

You are a lord commanding knights from your island castle to explore a dangerous neighboring island. Compete with other players to accumulate fame, might, and resources while seeking to reach the dragon at **Doomspire**.

Explore tiles, fight monsters and other players, claim resources, and buy knights/boats/buildings to achieve victory through combat, diplomacy, economics, or wealth.

---

## Starting Resources

Each player starts with:

- 2 Gold
- One home tile in the corner of the board (providing 1 food and 1 wood when harvested)

---

## Victory Conditions

Win immediately by reaching **Doomspire** (one of the center 4 tiles) with any of these:

- **Combat Victory**: Defeat the dragon in battle
- **Diplomatic Victory**: Have +15 Fame (dragon becomes your advisor)
- **Economic Victory**: Own 4+ starred resource tiles (dragon accepts tribute)
- **Gold Victory**: Have 15+ Gold (dragon shares treasures)

---

## Board structure

The board is an 8x8 grid of land tiles surrounded by 4 L-shaped ocean tiles in the corners. Knights move around on land tiles, while boats move around on ocean tiles and can transport knights between coastal land tiles.

The board has four key areas: Ocean, Tier 1, Tier 2, and Tier 3. Higher tier means higher risk and higher reward.

- **Ocean zones**: The surrounding ocean is divided into 4 ocean zones - northwest, northeast, southwest, southeast.
- **Tier 1**: These are the outer 2 layers of the 8x8 grid. The outermost tiles are coastal tiles.
- **Tier 2**: This is the second innermost layer of tiles, a ring of tiles surrounding the center.
- **Tier 3**: These are the center 4 tiles, containing dragonspire and 3 adventure tiles with high risk/reward.

All Tier 2 and Tier 3 tiles start unexplored (face down).

---

## Turn Structure

Each round has 3 phases:

1. **Roll Phase** (Parallel): Move the first player token clockwise, then all players roll dice simultaneously.
2. **Move Phase** (Sequential): One player at a time, use dice for movement and tile actions
3. **Harvest Phase** (Parallel): Use remaining dice for harvest and build actions

---

## Roll phase

Move the first player token to the next player clockwise.

Then everyone does this simultaneously:

- **Decide how many dice to roll**: Default is 2 dice. You get 1 die for your castle, and 1 die for each knight.
  - For each die after the first two, you must pay 2 food in **dice tax**. If you can't, you don't get to roll those dice.
- **Roll dice**: Roll all your dice at once. These are your **action dice** for this round. They are used for moving and harvesting.

---

## Movement phase

Movement phase is done one player at a time, starting from the player with the first player token.

Use your pre-rolled action dice to move and do things with your knights and boats. You may use all your dice for movement, or save some for the harvest phase.

### Move knight (dice action)

Use a dice to move one knight up to that number of steps, and interact with the tile you land on.

**Knight movement rules**:

- Only horizontal/vertical movement, no diagonal
- Can only use one knight per die action
- Can move fewer steps than the die value, or even move zero steps to interact with your current tile.
- Stop when entering unexplored tiles or tile with monster on it.
- Can pass through opposing knights, but opposing player may force you to stop and fight.
- Cannot stop in the same tile as another knight, except in special tiles (see Special Tiles).

**Multiple movements**:

- You can use another action die to move the same knight again, as long as the knight has not interacted with a tile.

**Tile interaction rules**:

- When a knight ends a movement, they may interact with the tile they ended on (or be forced to interact in some cases).
- See Tile Interaction below.

### Move boat (dice action)

Use a dice to move one boat up to die value steps, and optionally transport a knight between coastal tiles.

**Boat movement rules**:

- The boat moves between the four ocean zones - northwest, northeast, southwest, southeast.
- A boat can move fewer steps than the die value, or even move zero steps to transport a knight between coastal tiles in the same ocean zone.
- An ocean zone can contain any number of boats.

**Transporting knights via boat**:

- After moving the boat, you can optionally tranport a knight from one eligible coastal tile to another.
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

When a knight is moved (or uses a knight movement action without moving), a Tile Interaction may happen. This is the same whether they walked or were transported by boat.

**Forced interactions** (in priority order):

- **Explore**: If you enter an unexplored tile you will explore it, flipping it to reveal the contents.
  - Earn 1 fame for exploring any tile.
  - If it is a bear's den or a resource tile, add a Bear to it. Tier 2 resource tiles are always guarded by a bear.
- **Combat**: If a monster or opposing knight is on the tile, combat will happen. See Combat section below. Note that dragon combat is voluntary.
- **Adventure**: If you enter an adventure tile that has remaining adventure tokens, you must draw a card. See Adventure Cards section below.

**Voluntary interactions**:

- Use a **special location** - trader/mercenary/temple. See Special Locations section.
- Interact with a **resource tile** - claim, blockade, conquer, or incite revolt. See Resource System section.
- Attack the **dragon** at Doomspire
- Pick up or drop **items** in a tile

**Multiple interactions**:

- Normally you can only be forced to interact once. For example if you enter an adventure tile with a monster already present, you will be forced to fight the monster but not draw another adventure card after.
- Exception: when exploring a tile, you may be forced to interact with the revealed tile.
- You can perform multiple voluntary interactions in the same tile, for example picking up two items and interacting with the trader. Special locations have specific rules around multiple use, see Special Locations section.
- No adventure card can be drawn after combat.

Once any forced interactions are done, the player can perform any voluntary interactions.

> Example:
>
> - Alice's knight enters an unexplored tile.
> - She explores it (forced interaction), gains 1 fame, flips the tile. It is an adventure card.
> - She flips the adventure card (forced interaction), and draws a monster.
> - She fights the monster (as part of the same interaction) and wins, gaining further fame and resources.
> - The knight cannot move again this turn, since it has interacted with a tile.

> Example:
>
> - Bob's knight enters an adventure tile which has two adventure tokens.
> - He draws a card (removing one token) and it is a bear. He loses the fight, knight is sent home and the bear stays. So that tile now contains a bear and one remaining adventure token.
> - Next turn, Alice's knight enter the same tile. She is forced to fight the bear (since combat is higher prio than adventure cards). She wins, gains fame and loot from the bear, but cannot draw an adventure card until next turn (which would require a knight movement action of 0 steps).

---

## Harvest phase

When all players are done with their movement phase, the harvest phase begins. All players can harvest (if they have any remaining action dice), use any castle buildings they already have, and buy a new building/boat/champion if they can afford it.

The harvest phase is done simultaneously rather than one player at a time.

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

### Use buildings

During the harvest phase you can use your blacksmith to build your might, or use your market to sell resources for gold. See Buildings section.

### Build

During the harvest phase you end by performing one build action (construct a building, recruit a knight, buy a boat, etc). No dice is used for this. See Buildings section.

Build happens last, after using buildings. So you can't use a building the same turn you built it.

---

## Adventure cards

Adventure cards are drawn when a knight enters an adventure tile or oasis tile that has remaining adventure tokens. This is a forced interaction. The only time a knight would NOT draw an adventure card is if they are forced to fight a monster or knight who was already present in the tile.

### Choosing which deck to draw from

Adventure cards are organized into 6 decks, 2 decks per tier. The tile shows which tier of adventure cards you should draw from, and player can choose which of the 2 decks within that tier to draw from.

Each adventure card has a theme which decides which kinds of monsters and resources may show up:

- **Beast adventure cards**: More likely to provide food resources, and monsters are more likely to be beasts (relevant to some items)
- **Cave adventure cards**: More likely to provide ore resources and cave-dwelling monsters.
- **Grove adventure cards**: More likely to provide wood resources and forest creatures.

All cards within each tier are randomly shuffled into 2 decks at game setup, so you may not always have access to all themes.

> Example:
>
> - Alice needs wood. She looks at the 6 adventure decks.
> - The two Tier 1 decks have top card Beast, Cave respectively.
> - The two Tier 2 decks have top card Cave, Grove.
> - Alice needs wood, so she decides to take the risk and goes to Tier 2 adventure tile and draws the Grove card.
> - Beneath Cave card is another Cave card, so the next player going to a Tier 2 adventure tile must draw one of the two available Cave cards.

### Adventure card types

Each adventure deck (regardless of theme/tier) contains a mix of:

- **Monster cards**: Fight the monster or flee, earn fame and resources if you win. See Combat section.
- **Event cards**: Could lead to earning items, gaining fame, moving yourself or other players, and all kinds of things depending on the event.
- **Treasure cards**: Often contain items. See Items section.
- **Encounter cards**: Often contain followers. See Followers section.

---

## Combat

Combat happens when:

- A knight enters a tile with a monster or opposing knight
- A knight draws a monster adventure card
- A knight enters doomspire and chooses to fight the dragon
- A knight attempts to pass through another knight's tile, and that knight forces a fight

### Fleeing combat

- A knight can attempt to flee from combat. For example, to avoid a battle with impossible odds.
  - Exception: A player who actively chose to fight (for example by moving to another knight's tile) cannot flee.
- When fleeing, roll 1D3:
  - 1: Failure. Combat happens as normal.
  - 2: Partial success. Knight flees to home tile, without any loss.
  - 3: Success. Knight flees to closest unoccupied tile owned by that player. If none are available, flee home. If several are the same distance, player chooses which.

### Resolving knight to monster combat

When fighting a monster:

- Roll 1D3
- Add your Might
- Add +1 for each supporting knight or warship adjacent to the combat tile. Even from other players, if they choose to support you.
- Decide whether to use bonuses from items or followers (after seeing your dice roll)
- The resulting attack value must be greater than or equal to the monster's Might to win.

If you win, gain the fame and loot printed on the card.

If you lose, your knight must go home and heal.

- Move the knight back to your home tile
- Lose 1 resource of your choice. If you have none, then lose 1 fame (unless fame is already 0).

For dragon combat, see the Doomspire section.

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

This is similar to monster combat, with some differences:

- Both players roll 2D3
- Each knight applies their own combat bonuses: Might + supporting units + item/follower effects.
- Highest value wins. Ties are rerolled until someone wins.
- The winner gains 1 fame and gets to steal a resource or item of their choice from the loser (if available).
- The loser goes home, but doesn't need to pay for healing.

### Support from other players

- In combat, support can be received from other players' neighbouring knights/warships, if they choose to support you.
- Support from other players is announced after the combat dice roll. This opens up for collaboration, diplomacy, and treachery ("Hey, you said you would support me!". "Sorry, I lied.")
- Monsters cannot receive support.

---

## Doomspire - winning the game

All four victory conditions require you to interact with the dragon at Doomspire.

When you enter the doomspire tile, the following happens:

- If you have achieved a victory condition (15 fame, 15 gold, or 4 starred resource tiles), you win the game.
  - Starred resources count even if they are blockaded, as long as you own them.
- If not, the dragon will attack and you need to either fight or flee.
  - Fleeing always succeeds, but you will be chased all the way back to your home tile and lose 1 fame.

**Fighting the dragon**:

The dragon has might 8 + 1D3. Fighting the dragon is similar to monster combat, except that the dragon also gets a dice, and you get eaten if you lose.

- Pick another player to represent the dragon - ideally your biggest rival!
- Roll 1D3 and add your might, support bonus from adjacent knights, and any bonus from items or followers.
- Dragon rolls 1D3 and adds their might of 8
- If you match or exceed the dragon's total, you defeat the dragon and win the game.
- If you lose, your knight gets eaten and removed from the game (including their followers and items)

If you lose your last knight, you can choose whether to stay in the game and save up for a new knight (you still get one die every turn), or concede defeat. See Conceding defeat.

---

## Conceding defeat

A player can choose to concede defeat, for example if their situation is hopeless.

- Remove all boats and knights from the board (including items and followers)
- Claimed tiles (including the home tile) are considered owned by a neutral player, and can be blockaded or conquered using the normal rules.

---

## Items

A knight can carry up to 2 items, typically weapons or tools that give extra might or other advantages.

Items can be obtained by:

- Buying from the trader
- Attacking another knight and stealing their item
- Finding in adventure tiles
- Picking up items left by other players

Dropping items:

- An item can be dropped at any time, for example to make space for a new item.
- The dropped item is left in the tile (leave a marker), and can be picked up by another knight who ends their turn in that tile.

Some items and followers allow the knight to carry more items.

---

## Followers

A knight can have up to 2 followers, who give the knight various advantages.

- Followers can only be obtained throught adventure cards
- Followers cannot be bought, dropped in a tile, or stolen by another player.
- Followers can be dismissed at any time, in which case they are removed from the game.

---

## Resource System

The game has 4 types of resources: **gold**, **food**, **wood**, and **ore**. Resources are used to:

- Buy buildings, knights, and boats
- Use your blacksmith to increase your might
- Use your market to sell resources for gold
- Buy items from the trader
- Pay for healing after losing combat
- Pay food tax for rolling extra dice
- Trade with other players

**How to earn resources**:

- Claim (or blockade) resource tiles and use action dice to harvest from them
- Defeat monsters
- Some adventure cards give resources

Owning resource tiles let you build a sustainable economy. They can also be used to score an economic victory (own 4 starred resource tiles and visit the dragon)

**Types of resource tiles**:

- **Home tile**: This is resource tile provides 1 wood and 1 food. Opposing knights cannot enter this tile.
- **Normal resource tiles**: These provide 1 resource.
- **Starred resource tiles**: Resource tiles that provide more than one resource are considered starred resource tiles. All resource tiles in Tier 2 region are starred, and some in Tier 1. Only starred resource tiles count towards economic victory.

**Claiming a resource tile**:

- To claim a resource tile, move a knight to an unclaimed resource tile and place a flag on it. This is now considered your tile.

**Blockading a resource tile**:

- If a knight is on an unprotected resource tile owned by another player, that resource tile is blockaded.
- A blockaded tile is treated just as if it was owned by the blockading player, as long as the blocking knight is there. When blockaded, the owner cannot harvest from it, and the blockader can.

**Protecting a resource tile**:

- A claimed resource tile is protected if the owner has a knight in an adjacent tile, or a warship in the adjacent ocean zone (for coastal tiles)
- A protected tile cannot be conquered or blockaded by other players.
- If multiple players have warship(s) in the same ocean zone, they interfere with each other and stop each other from protecting tiles in that zone - as long as they have the same number of warships.

> Example:
>
> - Alice wants to protect her important coastal double-gold resource tile, so she buys the warship upgrade and places a warship in that ocean zone. The warship protects that tile and all other coastal tiles in that ocean zone.
> - Bob wants to conquer Alice's double-gold tile, but cannot do so as long as it is protected.
> - So Bob also buys the warship upgrade and moves his boat to that ocean zone. Those two warships effectively cancel each other out, and neither can protect coastal tiles any more. So bob is free to blockade, conquer, or incite revolt on that tile.
> - Later, Alice buys a second boat (which will automatically be a warship because of the warship upgrade), and moves it to that ocean zone. Now she has more warships than Bob in that zone, so her coastline is protected again.

**Inciting revolt on a resource tile**:

- You can incite revolt on another player's unprotected resource tile
- Pay 1 fame and remove the other player's claim (but don't take over the tile)
- Can also be done after combat
- This frees up the tile, so you can take it next turn by staying in the tile and using an action die.

**Conquering a resource tile**:

- You can take over another player's unprotected resource tile
- Pay 1 might, and switch the other player's claim for your own
- Can also be done after combat

---

## Trading between players

- Freely trade resources (food, wood, ore, gold) with other players anytime
- Items cannot be directly traded (only indirectly via drop/pickup)
- Followers cannot be traded

---

## Buildings and build actions

- **Buy a 2nd Knight**
  - Costs 3 Food, 3 Gold, and 1 Ore
  - Gives you a second knight, place it on your home tile.
  - Also gives you 1 extra die at the start of every turn, if you can afford the food tax (2 food).
- **Buy a 3rd Knight**:
  - Costs 6 Food, 6 Gold, 3 Ore
  - Gives you a third knight and another extra die every turn (if you can pay the additional food tax).
- **Buy a 2nd Boat**:
  - Costs 2 Wood, 2 Gold
  - Gives you an additional boat. Place it outside your home tile
  - You can only have 2 boats in total at any given moment.
- **Warship upgrade**:
  - Costs 2 Wood, 1 Ore, 1 Gold
  - All boats become warships, allowing them to protect coastal tiles and support coastal battles.
  - Future boats automatically become warships.
- **Market**:
  - Costs 2 Food, 2 Wood
  - Allows you to sell any number of resources 2:1 for gold during the harvest phase.
  - Example: Sell 3 food and 1 wood for 2 gold.
- **Blacksmith**:
  - Costs 2 Food, 2 Ore
  - Allows you to buy 1 Might for 1 Gold + 2 Ore once per harvest phase
- **Fletcher**:
  - Costs 1 Wood, 1 Food, 1 Gold, 1 Ore
  - Allows you to buy 1 Might for 3 Wood + 1 Ore once per harvest phase
- **Chapel**:
  - Costs 6 Wood, 2 Gold
  - Upon construction, you gain 3 fame.
- **Monastery**:
  - Costs 8 Wood, 3 Gold, 1 Ore
  - This is a Chapel upgrade, so you must build a chapel first and then upgrade it.
  - Upon construction, you gain 5 fame
  - You cannot have both a chapel and a monastery.

---

## Special Tiles

These special locations provide additional interactions. Non-combat zones allow multiple knights to coexist, and no battle can happen.

- **Temple**:
  - Sacrifice 2 Fame to gain 1 Might (once per turn)
  - Non-combat zone.
- **Trader**:
  - Trade resources at a 2:1 rate. You can convert any resource into any other resource. For example trade 3 food + 1 wood for 2 ore.
  - Buy items for gold. The trader deck is open for anyone to look at during the game, and contains useful items to aid your journey.
  - Non-combat zone.
- **Mercenary Camp**:
  - Pay 3 Gold to gain 1 Might (once per turn)
  - Non-combat zone
