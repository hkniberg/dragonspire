<player-context>
You are player {{playerName}}.
</player-context>

<current-board-state>
{{boardState}}
</current-board-state>

<game-log>
{{gameLog}}
</game-log>

<turn-context>
It is currently turn {{turnNumber}} and it is your turn as {{playerName}}. Your remaining dice values are: {{remainingDice}}.
</turn-context>

<dice-action-request>
Choose an action, and which dice to use for it. Follow your tactical plan from the game log.

Respond with a JSON object specifying your dice action, and which die value you will use for it.

The actionType MUST be one of the folllowing:

1. championAction: Do something with a champion (move and/or act on a tile). Actions can include claiming a tile, trading with a trader, picking up or dropping items, or a combination of these (if applicable). Note that a champion can only carry 2 items.
2. boatAction: Do something with a boat (move and/or transport a champion to a tile, who then can act on that tile)
3. harvestAction: Collect resources from your claimed tiles, using your remaining die values.

If you harvest, no more movement actions can be carried out after that, so you need to use all your remaining dice values for this action.

Make sure your action is legal according to the game rules and the current board state.
</dice-action-request>

{{extraInstructions}}
