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
What do you want to do with your dice rolls of {{diceRolls}}?

Please analyze the board state and explain your strategic reasoning. Consider:

1. **Current Position & Opportunities:** What tiles are within reach? What actions are available at your current location?

2. **Resource Strategy:** Which resource tiles could you claim? How do they fit into your economic strategy?

3. **Exploration Opportunities:** What unexplored tiles offer potential rewards? What's the risk/reward ratio?

4. **Victory Path Analysis:** Are you pursuing combat victory (defeat dragon), diplomatic victory (10 Fame + reach Doomspire), or economic victory (control starred resource tiles)?

5. **Dice Efficiency:** How can you use each die roll most effectively? Should you split actions or focus on one major move?

6. **Risk Assessment:** What are the potential consequences of each action? Are there safer alternatives that still advance your strategy?

Provide a detailed plan for your turn, explaining your reasoning for each action.
</decision-prompt>
