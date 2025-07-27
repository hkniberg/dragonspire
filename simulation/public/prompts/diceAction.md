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

1. moveChampion: Move a champion along a path, optionally claiming the destination tile.
2. moveBoat: Move a boat, optionally transporting a champion.
3. harvest: Collect resources from your claimed tiles, using your remaining die values.

If you harvest, no more movement actions can be carried out after that, so you need to use all your remaining dice values for this action.

Make sure your action is legal according to the game rules and the current board state.
</dice-action-request>

{{extraInstructions}}
