// TODO: This document

# Programming a basic IPvGO script

IPvGO (accessible from DefComm in New Tokyo, or the CIA in Sector-12) is a strategic territory control minigame. Form networks of routers on a grid to control open space and gain stat rewards or favor, but make sure the opposing faction does not surround and destroy your network! For basic instructions on how to play, go to DefComm or CIA to access the current subnet, and look through the "How to Play" section. This document is focused on building scripts to automate subnet takeover, which will make more sense once you have played a few subnets.

### Overview

The rules of Go, at their heart, are very simple. Because of this, they can be used to make a very simple script to automatically collect node power from IPvGO subnets.

This script can be iteratively improved upon, gradually giving it more tools and types of move to look for, and becoming more consistent at staking out territory on the current subnet.

## Script outline: Starting with the basics

### Testing Validity

The `ns.go` API provides a number of useful tools to understand the current subnet state.

`ns.go.analysis.getValidMoves()` returns a 2D array of true/false, indicating if you can place a router on the current square.

You can test if a given move `x,y` is valid with a test like this:

```js
const validMoves = ns.go.analysis.getValidMoves();

if (validMoves[x][y] === true) {
  // Do something
}
```

### Choosing a random move

The simplest move type, and the fallback if no other move can be found, is to pick a random valid move.

The `validMoves` grid can be retrieved using `getValidMoves()` as mentioned above. `board` comes from `ns.go.getBoardState()`, more on that later.

It would be a problem to fill in every single node on the board, however. If networks ever lose contact with any empty nodes, they will be destroyed! So, leave some "airspace" by excluding certain moves from the random ones we select.

One way to do this is to exclude nodes with both even X coordinate and even y coordinate:

```js
/**
 * Choose one of the empty points on the board at random to play
 */
const getRandomMove = (board, validMoves) => {
  const moveOptions = [];
  const size = board[0].length;

  // Look through all the points on the board
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      // Make sure the point is a valid move
      const isValidMove = validMoves[x][y] === true;
      // Leave some spaces to make it harder to capture our pieces
      const isNotReservedSpace = x % 2 === 1 || y % 2 === 1;

      if (isValidMove && isNotReservedSpace) {
        moveOptions.push([x, y]);
      }
    }
  }

  // Choose one of the found moves at random
  const randomIndex = Math.floor(Math.random() * moveOptions.length);
  return moveOptions[randomIndex] ?? [];
};
```

### Playing moves

Now that a simple move type is available, it can be used to play on the current subnet!

`await ns.go.makeMove(x, y)` can be used to play a chosen move `x,y`. Note that it returns a `Promise`, meaning it needs to be used with `await`.

`await ns.go.passTurn()` can be used if no moves are found. This will end the game if the AI also passes (or just passed previously).

Both `makeMove()` and `passTurn()` , when awaited, return an object that tells you if your move was valid and successfully played, and what the AI's response is.

```js
{
  // If your move was successfully applied to the subnet
  success: boolean;
  // If the opponent moved or passed, or if the game is now over, or if your move was invalid
  type: "invalid" | "move" | "pass" | "gameOver";
  x: number; // Opponent move's x coord (if applicable)
  y: number; // Opponent move's y coord (if applicable)
}
```

When used together with the `getRandomMove()` implemented above, the framework of the script is ready. An example `main()` that implements this is below. Search for a new subnet using the UI, then launch the script you have been working on, and watch it play!

```js
/** @param {NS} ns */
export async function main(ns) {
  let result, x, y;

  do {
    const board = ns.go.getBoardState();
    const validMoves = ns.go.analysis.getValidMoves();

    const [randX, randY] = getRandomMove(board, validMoves);
    // TODO: more move options

    // Choose a move from our options (currently just "random move")
    x = randX;
    y = randY;

    if (x === undefined) {
      // Pass turn if no moves are found
      result = await ns.go.passTurn();
    } else {
      // Play the selected move
      result = await ns.go.makeMove(x, y);
    }

    await ns.sleep(200);

    // Keep looping as long as the opponent is playing moves
  } while (result?.type !== "gameOver");

  // After the opponent passes, end the game by passing as well
  await ns.go.passTurn();

  // TODO: add a loop to keep playing
  // TODO: reset board, e.g. `ns.go.resetBoardState("Netburners", 7)`
}
```

## Adding network expansion moves

Just playing random moves is not very effective, though. The next step is to use the board state to try and take over territory.

`ns.go.getBoardState()` returns a simple grid representing what the current board looks like. The player's routers are marked with X, and the opponents with O.

Example 5x5 board state, with a number of networks for each player:

```js
["XX.O.", "X..OO", ".XO..", "XXO..", ".XOO."];
```

The board state can be used to look at all the nodes touching a given point, by looking at an adjacent pair of coordinates. For example, this returns a list of all the nodes connected to the current point:

```js
/**
 * Find all adjacent points in the four connected directions
 */
const getNeighbors = (board, x, y) => {
  const north = board[x + 1]?.[y];
  const east = board[x][y + 1];
  const south = board[x - 1]?.[y];
  const west = board[x]?.[y - 1];

  return [north, east, south, west];
};
```

That info can be used to make decisions about where to place routers.

In order to expand the area that is controlled by the player's networks, connecting to friendly routers (when possible) is a strong move. This can be done with a very similar implementation to `getRandomMove()`, with the additional check of looking for a neighboring friendly router. For each point on the board:

```js
// make sure the move is valid
const isValidMove = validMoves[x][y];
// Leave some open spaces to make it harder to capture our pieces
const isNotReservedSpace = x % 2 || y % 2;

// Make sure we are connected to a friendly piece
const neighbors = getNeighbors(board, x, y);
const hasFriendlyNeighbor = neighbors.includes("X");

if (isValidMove && isNotReservedSpace && hasFriendlyNeighbor) {
  // add to valid moves list
}
```

When possible, an expansion move like this should be used over a random move. When neither can be found, pass turn.

After implementing this, the script will consistently get points on the subnet against most opponents (at least on the larger boards), and will sometimes even get lucky and win against the easiest factions. However, there is a lot we can still do to improve the script.

## Killing duplicate scripts

Because there is only one subnet active at any time, you do not want multiple copies of your scripts running and competing with each other.

This snippet can be added to any script, and will kill any other scripts with the same file name on the current server. Put this code into your script and call it at the top of main() using `killDuplicates(ns)`

```js
/** @param {NS} ns */
function killDuplicates(ns) {
  const scriptInfo = ns.getRunningScript();
  ns.ps()
    .filter((script) => script.filename === scriptInfo.filename && script.pid !== scriptInfo.pid)
    .forEach((script) => ns.kill(script.pid));
}
```

## Capturing the opponent's networks

## Defending your networks from capture

## Smothering the opponent's networks

## Expanding your networks' connections to empty nodes

## Encircling space to control empty nodes

## Other moves

- jumps and knights' moves
- pattern matching for cuts and hane
- surround and then invade opponent territory
