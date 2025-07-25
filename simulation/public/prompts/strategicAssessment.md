<player-context>
You are player {{playerName}}.
</player-context>

<current-board-state>
{{boardState}}
</current-board-state>

<game-log>
{{gameLog}}
</game-log>

<dice-context>
You have rolled dice: {{diceRolls}}
</dice-context>

<strategic-assessment-request>
Think deeply about these three areas:

1. **Situation Analysis**: What's the current state of the game, at a high level? How are you progressing towards a win? What have other players been doing recently that affects your position?

2. **Strategic Direction**: What is your strategy for winning the game, or improving your situation? If you have an existing strategy from before, is it still valid? Or should it be tweaked or completely changed?

3. **Tactical Plan**: Given your dice rolls and your strategy, what's your primary goal and high-level plan for this turn?

Then write a single-paragraph strategic assessment. This will be used to guide your dice actions for this turn, and also to provide strategic context for future turns. Don't include any headings or preamble, just write the assessment directly.

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
