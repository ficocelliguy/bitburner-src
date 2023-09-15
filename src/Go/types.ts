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
  Netburners = "Netburners (Easy AI)",
  SlumSnakes = "Slum Snakes (Spread AI)",
  TheBlackHand = "The Black Hand (Aggro AI)",
  Illuminati = "Illuminati (Intermediate AI)",
}

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

export type Board = PointState[][];

export type MoveOptions = {
  capture: Move | null;
  defendCapture: Move | null;
  growth: Move | null;
  expansion: Move | null;
  defend: Move | null;
  surround: Move | null;
  random: Move | null;
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
