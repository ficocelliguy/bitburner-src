// Inspired by https://github.com/pasky/michi/blob/master/michi.py
import { BoardState, PlayerColor, playerColors, PointState } from "./goConstants";
import { sleep } from "./goAI";
import { getStateCopy, updateCaptures } from "./boardState";

export const threeByThreePatterns = [
  // 3x3 piece patterns; X,O are color pieces; x,o are any state except the opposite color piece;
  // " " is off the edge of the board; "?" is any state (even off the board)
  [
    "XOX", // hane pattern - enclosing hane
    "...",
    "???",
  ],
  [
    "XO.", // hane pattern - non-cutting hane
    "...",
    "?.?",
  ],
  [
    "XO?", // hane pattern - magari
    "X..",
    "o.?",
  ],
  [
    ".O.", // generic pattern - katatsuke or diagonal attachment; similar to magari
    "X..",
    "...",
  ],
  [
    "XO?", // cut1 pattern (kiri] - unprotected cut
    "O.x",
    "?x?",
  ],
  [
    "XO?", // cut1 pattern (kiri] - peeped cut
    "O.X",
    "???",
  ],
  [
    "?X?", // cut2 pattern (de]
    "O.O",
    "xxx",
  ],
  [
    "OX?", // cut keima
    "x.O",
    "???",
  ],
  [
    "X.?", // side pattern - chase
    "O.?",
    "   ",
  ],
  [
    "OX?", // side pattern - block side cut
    "X.O",
    "   ",
  ],
  [
    "?X?", // side pattern - block side connection
    "o.O",
    "   ",
  ],
  [
    "?XO", // side pattern - sagari
    "o.o",
    "   ",
  ],
  [
    "?OX", // side pattern - cut
    "X.O",
    "   ",
  ],
];

export async function findAnyMatchedPatterns(boardState: BoardState, player: PlayerColor) {
  const board = boardState.board;
  const boardSize = board[0].length;
  const patterns = expandAllThreeByThreePatterns();
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const neighborhood = getNeighborhood(boardState, x, y);
      const matchedPattern = patterns.find((pattern) => checkMatch(neighborhood, pattern, player));
      if (matchedPattern) {
        const evaluationBoard = getStateCopy(boardState);
        evaluationBoard.board[x][y].player = player;
        const updatedBoard = updateCaptures(evaluationBoard, player);

        if ((updatedBoard.board[x][y].liberties?.length ?? 0) > 1) {
          return board[x][y];
        }
      }
    }
    await sleep(10);
  }
  return null;
}

/*
  Returns false if any point does not match the pattern, and true if it matches fully.
 */
function checkMatch(neighborhood: PointState[][], pattern: string[], player: PlayerColor) {
  const patternArr = `${pattern[0]}${pattern[1]}${pattern[2]}`.split("");
  const neighborhoodArray = [...neighborhood[0], ...neighborhood[1], ...neighborhood[2]];
  const mismatch = patternArr.find((str, index) => !matches(str, neighborhoodArray[index], player));
  return !mismatch;
}

function getNeighborhood(boardState: BoardState, x: number, y: number) {
  const board = boardState.board;
  return [
    [board[x - 1]?.[y + 1], board[x]?.[y + 1], board[x + 1]?.[y + 1]],
    [board[x - 1]?.[y], board[x]?.[y], board[x + 1]?.[y]],
    [board[x - 1]?.[y - 1], board[x]?.[y - 1], board[x + 1]?.[y - 1]],
  ];
}

function matches(stringPoint: string, point: PointState | null, player: PlayerColor) {
  const opponent = player === playerColors.white ? playerColors.black : playerColors.white;
  switch (stringPoint) {
    case "X": {
      return point?.player === player;
    }
    case "O": {
      return point?.player === opponent;
    }
    case "x": {
      return point?.player !== opponent;
    }
    case "o": {
      return point?.player !== player;
    }
    case ".": {
      return point?.player === playerColors.empty;
    }
    case " ": {
      return point === null;
    }
    case "?": {
      return true;
    }
  }
}

function expandAllThreeByThreePatterns() {
  const patterns1 = [...threeByThreePatterns, ...threeByThreePatterns.map(rotate90Degrees)];
  const patterns2 = [...patterns1, ...patterns1.map(verticalMirror)];
  return [...patterns2, ...patterns2.map(horizontalMirror)];
}

function rotate90Degrees(pattern: string[]) {
  return [
    `${pattern[2][0]}${pattern[1][0]}${pattern[0][0]}`,
    `${pattern[2][1]}${pattern[1][1]}${pattern[0][1]}`,
    `${pattern[2][2]}${pattern[1][2]}${pattern[0][2]}`,
  ];
}

function verticalMirror(pattern: string[]) {
  return [pattern[2], pattern[1], pattern[0]];
}

function horizontalMirror(pattern: string[]) {
  return [
    pattern[0].split("").reverse().join(),
    pattern[1].split("").reverse().join(),
    pattern[2].split("").reverse().join(),
  ];
}
