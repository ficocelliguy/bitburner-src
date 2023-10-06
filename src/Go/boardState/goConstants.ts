import { getNewBoardState } from "./boardState";

export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export enum validityReason {
  pointNotEmpty = "That point is already occupied by a piece",
  boardRepeated = "It is illegal to repeat prior board states",
  noSuicide = "It is illegal to cause your own pieces to be captured",
  notYourTurn = "It is not your turn to play",
  gameOver = "The game is over",
  invalid = "Invalid move",
  valid = "Valid move",
}

export enum opponents {
  none = "No AI",
  Netburners = "Netburners (Easy AI & +1.5 komi)",
  SlumSnakes = "Slum Snakes (Spread AI & +3.5 komi)",
  TheBlackHand = "The Black Hand (Aggro AI & +3.5 komi)",
  Daedalus = "Daedalus (Mid AI & +5.5 komi)",
  Illuminati = "Illuminati (+7.5 komi & 4 handicap)",
}

export const boardSizes = [5, 7, 9, 13];

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

export type Board = PointState[][];

export type MoveOptions = {
  capture: Move | null;
  defendCapture: Move | null;
  eyeMove: EyeMove | null;
  eyeBlock: EyeMove | null;
  pattern: PointState | null;
  growth: Move | null;
  expansion: Move | null;
  defend: Move | null;
  surround: Move | null;
};

export type Move = {
  point: PointState;
  oldLibertyCount: number | null;
  newLibertyCount: number | null;
};

export type EyeMove = {
  point: PointState;
  createsLife: boolean;
};

export type BoardState = {
  board: Board;
  previousPlayer: PlayerColor | null;
  history: Board[];
  ai: opponents;
  passCount: number;
};

export type PointState = {
  player: PlayerColor;
  chain: number;
  liberties: (PointState | null)[] | null;
  x: number;
  y: number;
};

export enum playTypes {
  move = "move",
  pass = "pass",
  gameOver = "gameOver",
}

export type Play = {
  type: playTypes;
  x: number | string;
  y: number;
};

export type Neighbor = {
  north: PointState | null;
  east: PointState | null;
  south: PointState | null;
  west: PointState | null;
};

export type goScore = {
  White: { pieces: number; territory: number; komi: number; sum: number };
  Black: { pieces: number; territory: number; komi: number; sum: number };
};

export const columnIndexes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getGoPlayerStartingState() {
  return {
    boardState: getNewBoardState(7),
    status: {
      [opponents.none]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Netburners]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.SlumSnakes]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.TheBlackHand]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Daedalus]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
      [opponents.Illuminati]: {
        wins: 0,
        losses: 0,
        nodes: 0,
        nodePower: 0,
        winStreak: 0,
        highestWinStreak: 0,
      },
    },
  };
}
