<player-name>
You are player {{playerName}}.
</player-name>

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

The actionType MUST be one of the following:

1. championAction: Do something with a champion (move and/or act on a tile).
2. boatAction: Do something with a boat (move and/or transport a champion to a tile, who then can act on that tile)
3. harvestAction: Collect resources from your claimed tiles, using one or more die values. Harvest from one tile per die value.

If you harvest, no more championAction or boatAction actions can be carried out after that. Build actions (using buildings, constructing buildings, recruiting champions, etc.) happen at the end of your turn, after all action dice are used.

Make sure your action is legal according to the game rules and the current board state.
</dice-action-request>

{{extraInstructions}}
