<player-context>
You are player {{playerName}}.
</player-context>

<current-board-state>
{{boardState}}
</current-board-state>

<game-log>
{{gameLog}}
</game-log>

<trader-context>
{{description}}

Your current resources: {{playerResources}}

Available items for purchase:
{{availableItems}}
</trader-context>

<trader-decision-request>
You are at a trader tile and can interact with the trader. You can perform the following types of actions:

1. buyItem: Purchase an item using your resources. You must specify the itemId of the item you want to buy.
2. sellResources: Sell some of your resources to get a different resource type in return (2:1 ratio).

You can perform multiple actions in a single turn if you have enough resources. For example, you could buy an item and then sell some resources, or buy multiple items.

Respond with a JSON object containing:

- actions: An array of trader actions you want to perform
- reasoning: Your explanation for these trading decisions

Make sure you have enough resources for any purchases you make. Each trader item shows its cost requirements.
</trader-decision-request>

{{extraInstructions}}
