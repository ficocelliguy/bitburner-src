export enum playerColors {
  white = "White",
  black = "Black",
  empty = "Empty",
}

export type PlayerColor = playerColors.white | playerColors.black | playerColors.empty;

export type PointState = {
  player: PlayerColor;
  chain: number | null;
  liberties: number | null;
};

export type Play = {
  x: number;
  y: number;
};
