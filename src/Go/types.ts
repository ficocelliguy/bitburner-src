export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export enum validityReason {
  pointNotEmpty = "That point is already occupied by a piece",
  boardRepeated = "It is illegal to repeat prior board states",
  valid = "Valid move",
}

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

export type Board = PointState[][];

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
