export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export enum validityReason {
  pointNotEmpty = "That point is already occupied by a piece",
  boardRepeated = "It is illegal to repeat prior board states",
  noSuicide = "It is illegal to cause your own pieces to be captured",
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
  growth: Move | null;
  expansion: Move | null;
  defend: Move | null;
  surround: Move | null;
};

export type Move = {
  point: PointState | null;
  oldLibertyCount: number | null;
  newLibertyCount: number | null;
};

export type BoardState = {
  board: Board;
  previousPlayer: PlayerColor;
  history: Board[];
};

export type PointState = {
  player: PlayerColor;
  chain: number | null;
  liberties: (PointState | null)[] | null;
  x: number;
  y: number;
};

export type Play = {
  x: number;
  y: number;
};

export type Neighbor = {
  north: PointState | null;
  east: PointState | null;
  south: PointState | null;
  west: PointState | null;
};
