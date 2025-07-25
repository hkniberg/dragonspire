<player-context>
You are player {{playerName}}.
</player-context>

<game-log>
{{gameLog}}
</game-log>

<current-board-state>
{{boardState}}
</current-board-state>

<dice-action-request>
It is your turn as {{playerName}}. You have rolled dice: {{diceRolled}}.

You are now deciding what to do with a die showing {{dieValue}}{{remainingDiceText}}.

Respond with a JSON object specifying your dice action. You can choose from:

1. moveChampion: Move a champion along a path, optionally claiming the destination tile
2. moveBoat: Move a boat, optionally transporting a champion
3. harvest: Collect resources from your claimed tiles

Make sure your action is legal according to the game rules and the current board state.
</dice-action-request>{{extraInstructions}}
