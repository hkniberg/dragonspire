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
You are player {{playerName}}. The turn number is {{turnNumber}}. You have rolled dice: {{diceValues}}.
</turn-context>

<strategic-assessment-request>
Think deeply about these areas:

1. **Followup since last turn**: How did your last turn work out? What key events have happened since then?

2. **Situation Analysis**: What's the current state of the game, at a high level? How are you progressing towards a win?

3. **Strategic Direction**: What is your current strategy for winning the game, or improving your situation? If you have an existing strategy from before, is it still valid? Or should it be tweaked or completely changed?

4. **Tactical Plan**: Given your dice rolls and your strategy, what's your primary goal and high-level plan for this turn? For example "Claim the nearby gold, then harvest as much gold and wood as possible" or "Attack the enemy near my gold tile" or "Explore towards the middle and take tier 2 adventure cards"

Summmarize this in 1-2 paragraphs.
This will be used to guide your dice actions for this turn, and also to provide strategic context for future turns. Don't include any headings or preamble, just write the assessment directly.

</strategic-assessment-request>

<tips>
As an AI player, you should:
- Analyze the current game state carefully
- Consider multiple strategic paths to victory
- Make efficient use of your dice rolls
- Make sure you follow the rules of the game
- Balance risk and reward in your decisions
- Plan both short-term moves and long-term strategy
- Boats give you easy mobility between coastal tiles.
</tips>

{{extraInstructions}}
