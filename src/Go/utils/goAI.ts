import { PlayerColor, playerColors, PointState } from "../types";
import {
  findChainLibertiesForPoint,
  floor,
  getAllChains,
  getEmptySpaces,
  getStateClone,
  isNotNull,
  makeMove,
} from "./boardState";

export function getRandomMove(boardState: PointState[][]) {
  const emptySpaces = getEmptySpaces(boardState);

  const randomIndex = floor(Math.random() * emptySpaces.length);
  return emptySpaces[randomIndex];
}

export function getGrowthMove(initialState: PointState[][], player: PlayerColor) {
  const boardState = getStateClone(initialState);

  const friendlyChains = getAllChains(boardState).filter((chain) => chain[0].player === player);

  if (!friendlyChains.length) {
    return null;
  }

  const liberties = friendlyChains
    .map((chain) => chain[0].liberties)
    .flat()
    .filter(isNotNull);

  // Find a liberty where playing a piece increases the liberty of the chain (aka expands or defends the chain)
  const libertyIncreases = liberties.map((point) => {
    const stateAfterMove = makeMove(getStateClone(boardState), point?.x, point?.y, player);
    const newLibertyCount = stateAfterMove ? findChainLibertiesForPoint(stateAfterMove, point.x, point.y).length : -1;
    return {
      point,
      newLibertyCount,
    };
  });
  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 2) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

export function getSurroundMove(initialState: PointState[][], player: PlayerColor) {
  const boardState = getStateClone(initialState);

  const opposingPlayer = player === playerColors.black ? playerColors.white : playerColors.black;
  const enemyChains = getAllChains(boardState).filter((chain) => chain[0].player === opposingPlayer);

  if (!enemyChains.length) {
    return null;
  }

  const liberties = enemyChains
    .map((chain) => chain[0].liberties)
    .flat()
    .filter(isNotNull);
  const exampleEnemyPiece = liberties[0];

  // Find a liberty where playing a piece decreases the liberty of the enemy chain (aka smothers or captures the chain)
  const libertyDecreases = liberties.map((point) => {
    const stateAfterMove = makeMove(getStateClone(boardState), point?.x, point?.y, player);
    if (!stateAfterMove) {
      return {
        point,
        newLibertyCount: Number.MAX_SAFE_INTEGER,
      };
    }

    // TODO: this count is wrong (usually returning 0). why?
    const newEnemyLibertyCount = findChainLibertiesForPoint(
      stateAfterMove,
      exampleEnemyPiece.x,
      exampleEnemyPiece.y,
    ).length;
    const newMoveLibertyCount = findChainLibertiesForPoint(stateAfterMove, point.x, point.y).length;
    if (newEnemyLibertyCount > 0 && newMoveLibertyCount === 0) {
      return {
        point,
        newLibertyCount: Number.MAX_SAFE_INTEGER,
      };
    }

    return {
      point,
      newLibertyCount: newEnemyLibertyCount,
    };
  });
  if (!libertyDecreases.length) {
    return null;
  }

  const minLibertyCount = Math.min(...libertyDecreases.map((l) => l.newLibertyCount));
  const moveCandidates = libertyDecreases.filter((l) => l.newLibertyCount === minLibertyCount);

  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

export function getMove(boardState: PointState[][], player: PlayerColor): PointState {
  const moveType = floor(Math.random() * 3);
  const randomMove = getRandomMove(boardState);
  const growthMove = getGrowthMove(boardState, player);
  const surroundMove = getSurroundMove(boardState, player);

  console.log("surround: ", surroundMove?.point?.x, surroundMove?.point?.y);
  console.log("Growth: ", growthMove?.point?.x, growthMove?.point?.y);
  console.log("Random: ", randomMove?.x, randomMove?.y);

  if (surroundMove && surroundMove?.newLibertyCount <= 1) {
    console.log("surround move chosen");
    return surroundMove.point;
  }

  if (growthMove && growthMove?.newLibertyCount <= 2) {
    console.log("growth move chosen");
    return growthMove.point;
  }

  if (moveType === 0 && growthMove) {
    console.log("growth move chosen");
    return growthMove.point;
  } else if (moveType === 1 && surroundMove) {
    console.log("surround move chosen");
    return surroundMove.point;
  } else {
    return randomMove;
  }
}
