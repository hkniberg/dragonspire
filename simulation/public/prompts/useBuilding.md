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

Respond with a JSON object containing:

- useBlacksmith: Boolean indicating whether to use your blacksmith (if you have one)
- sellAtMarket: Object with resource amounts to sell at market (only if you have a market)
  - food: Number of food to sell
  - wood: Number of wood to sell
  - ore: Number of ore to sell
  - gold: Number of gold to sell (should be 0, you can't sell gold)
- reasoning: Your explanation for this decision

Remember that building usage happens after all dice actions are complete, so this is your final opportunity to spend resources this turn.
</building-usage-decision-request>

{{extraInstructions}}
