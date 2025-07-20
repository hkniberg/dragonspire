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
What do you want to do with your dice rolls {{diceRolls}}?

Please analyze the board state and then **use the available tool functions** to execute your dice actions.

<analysis>
Provide your strategic reasoning here. Consider:

1. **Current Position & Opportunities:** What tiles are within reach? What actions are available at your current location?

2. **Resource Strategy:** Which resource tiles could you claim? How do they fit into your economic strategy?

3. **Exploration Opportunities:** What unexplored tiles offer potential rewards? What's the risk/reward ratio?

4. **Victory Path Analysis:** Are you pursuing combat victory (defeat dragon), diplomatic victory (10 Fame + reach Doomspire), or economic victory (control starred resource tiles)?

5. **Dice Efficiency:** How can you use your dice rolls most effectively?

6. **Risk Assessment:** What are the potential consequences of these actions? Are there safer alternatives that still advance your strategy?

7. **Action Plan:** Plan out how you'll use both dice rolls efficiently.
   </analysis>

<actions>
Execute your planned actions using the available tool functions:

- **moveChampion**: Move a champion along a path of tiles
- **moveBoat**: Move a boat with optional champion pickup/dropoff
- **harvest**: Harvest resources from claimed tiles

Use these tools to execute actions for your dice rolls {{diceRolls}}. You should typically use both dice rolls, either for two separate actions or for a single complex action that benefits from multiple dice.

**Important:** Use the tool functions directly - do not provide JSON responses. Call the appropriate tool functions to execute your planned actions.
</actions>
</decision-prompt>
