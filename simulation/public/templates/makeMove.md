# Turn {{currentRound}} - Make Your Move

<current-situation>
**Dice Rolled:** {{diceRolls}}
**Your Fame:** {{fame}}
**Your Might:** {{might}}
**Your Resources:** {{resources}}
**Champion Position:** Row {{championRow}}, Col {{championCol}}
</current-situation>

<board-state>
```json
{{boardState}}
```
</board-state>

<available-actions>
{{validActions}}
</available-actions>

<decision-prompt>
What do you want to do with one of your dice rolls from {{diceRolls}}?

Please analyze the board state and provide your decision in the following format:

<analysis>
Provide your strategic reasoning here. Consider:

1. **Current Position & Opportunities:** What tiles are within reach? What actions are available at your current location?

2. **Resource Strategy:** Which resource tiles could you claim? How do they fit into your economic strategy?

3. **Exploration Opportunities:** What unexplored tiles offer potential rewards? What's the risk/reward ratio?

4. **Victory Path Analysis:** Are you pursuing combat victory (defeat dragon), diplomatic victory (10 Fame + reach Doomspire), or economic victory (control starred resource tiles)?

5. **Dice Efficiency:** How can you use this die roll most effectively?

6. **Risk Assessment:** What are the potential consequences of this action? Are there safer alternatives that still advance your strategy?
   </analysis>

<action>
Provide a JSON formatted DiceAction for ONE of your dice. The action must follow one of these formats:

For moving a champion:

```json
{
  "type": "moveChampion",
  "playerId": {{playerId}},
  "championId": [champion ID number],
  "path": [{"row": [number], "col": [number]}, ...]
}
```

For moving a boat (with optional champion pickup/dropoff):

```json
{
  "type": "moveBoat",
  "playerId": {{playerId}},
  "boatId": [boat ID number],
  "path": ["ocean position strings"],
  "championId": [optional champion ID to pick up],
  "championDropPosition": {"row": [number], "col": [number]}
}
```

For harvesting resources:

```json
{
  "type": "harvest",
  "playerId": {{playerId}},
  "resources": {"food": [number], "wood": [number], "ore": [number], "gold": [number]}
}
```

</action>
</decision-prompt>
