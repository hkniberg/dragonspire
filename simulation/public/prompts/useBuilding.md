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

MARKET:

- Cost: Free to use (building already constructed)
- Benefit: Sell any resources for Gold at 2:1 rate (2 resources = 1 Gold)
- Limitations: Can be used multiple times per harvest phase
- Available resources to sell: Food, Wood, Ore

Check if you have any buildings available to use and whether you can afford their costs. Consider your current strategic situation and resource needs.

Respond with a JSON object containing info about whether you want to use the blacksmith or market, and which resources to sell in that case.

Remember that building usage happens after all dice actions are complete, so this is your final opportunity to spend resources this turn.
</building-usage-decision-request>

{{extraInstructions}}
