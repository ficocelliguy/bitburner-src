// Inspired by https://github.com/pasky/michi/blob/master/michi.py
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
