<player-context>
You are player {{playerName}}.
</player-context>

<current-board-state>
{{boardState}}
</current-board-state>

<game-log>
{{gameLog}}
</game-log>

<building-usage-decision-request>
You have finished using all your dice for this turn. Now you can use any buildings you have constructed.

BLACKSMITH:

- Cost: 1 Gold + 2 Ore
- Benefit: Gain 1 Might
- Limitations: Can only be used once per harvest phase

Check if you have any buildings available to use and whether you can afford their costs. Consider your current strategic situation and resource needs.

Respond with a JSON object containing:

- useBlacksmith: Boolean indicating whether to use your blacksmith (if you have one)
- reasoning: Your explanation for this decision

Remember that building usage happens after all dice actions are complete, so this is your final opportunity to spend resources this turn.
</building-usage-decision-request>

{{extraInstructions}}
