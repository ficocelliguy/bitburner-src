<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [bitburner](./bitburner.md) &gt; [Go](./bitburner.go.md) &gt; [passTurn](./bitburner.go.passturn.md)

## Go.passTurn() method

Pass the player's turn rather than making a move, and await the opponent's response. This ends the game if the opponent passed on the previous turn, or if the opponent passes on their following turn.

This can also be used if you pick up the game in a state where the opponent needs to play next. For example: if BitBurner was closed while waiting for the opponent to make a move, you may need to call passTurn() to get them to play their move on game start.

**Signature:**

```typescript
passTurn(): Promise<Play>;
```
**Returns:**

Promise&lt;[Play](./bitburner.play.md)<!-- -->&gt;

## Remarks

RAM cost: 0 GB
