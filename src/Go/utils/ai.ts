import { PointState } from "../types";
import { getEmptySpaces } from "./boardState";

export function getRandomMove(boardState: PointState[][]) {
  const emptySpaces = getEmptySpaces(boardState);

  const randomIndex = Math.floor(Math.random() * emptySpaces.length);
  const move = emptySpaces[randomIndex];

  return move;
}
