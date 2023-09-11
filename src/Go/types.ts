export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

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
