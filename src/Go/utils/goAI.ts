import { BoardState, Move, MoveOptions, PlayerColor, playerColors, PointState, validityReason } from "../types";
import {
  evaluateIfMoveIsValid,
  findChainLibertiesForPoint,
  findNeighbors,
  floor,
  getAllChains,
  getEmptySpaces,
  getStateClone,
  isDefined,
  isNotNull,
  makeMove,
} from "./boardState";

export async function getMove(boardState: BoardState, player: PlayerColor): Promise<PointState> {
  const moves = await getMoveOptions(boardState, player);

  if (moves.surround && moves.surround.point && moves.surround?.newLibertyCount === 0) {
    console.log("capture: surround move forced");
    return moves.surround.point;
  }

  if (
    moves.defend &&
    moves.defend.point &&
    moves.defend.oldLibertyCount == 1 &&
    (moves.defend?.newLibertyCount ?? 0) > 1
  ) {
    console.log("defend capture: defend move forced");
    return moves.defend.point;
  }

  if (moves.surround && moves.surround.point && (moves.surround?.newLibertyCount ?? 999) <= 1) {
    console.log("surround move chosen");
    return moves.surround.point;
  }

  const moveOptions = [
    moves.growth?.point,
    moves.surround?.point,
    moves.defend?.point,
    moves.expansion?.point,
    moves.random?.point,
  ]
    .filter(isNotNull)
    .filter(isDefined)
    .filter((move) => evaluateIfMoveIsValid(boardState, move.x, move.y, player) === validityReason.valid);

  const chosenMove = moveOptions[floor(Math.random() * moveOptions.length)];
  console.log(chosenMove ? `Random move chosen: ${chosenMove.x} ${chosenMove.y}` : "No valid moves found");

  return chosenMove;
}

// function getNetburnersPriorityMove(moves) {
//
// }

async function getRandomMove(boardState: BoardState, player: PlayerColor): Promise<Move> {
  const emptySpaces = getEmptySpaces(boardState).filter(
    (space) => evaluateIfMoveIsValid(boardState, space.x, space.y, player) === validityReason.valid,
  );

  const randomIndex = floor(Math.random() * emptySpaces.length);
  return {
    point: emptySpaces[randomIndex],
    newLibertyCount: -1,
    oldLibertyCount: -1,
  };
}

async function getExpansionMove(boardState: BoardState, player: PlayerColor): Promise<Move> {
  const emptySpaces = getEmptySpaces(boardState)
    .filter((space) => {
      const neighbors = findNeighbors(boardState, space.x, space.y);
      return (
        [neighbors.north, neighbors.east, neighbors.south, neighbors.west].filter(
          (point) => point && point.player === playerColors.empty,
        ).length === 4
      );
    })
    .filter((space) => evaluateIfMoveIsValid(boardState, space.x, space.y, player) === validityReason.valid);

  const randomIndex = floor(Math.random() * emptySpaces.length);
  return {
    point: emptySpaces[randomIndex],
    newLibertyCount: -1,
    oldLibertyCount: -1,
  };
}

async function getLibertyGrowthMove(initialState: BoardState, player: PlayerColor) {
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
  const libertyIncreases = liberties
    .map((point) => {
      const stateAfterMove = makeMove(getStateClone(boardState), point?.x, point?.y, player);
      const oldLibertyCount = point.liberties?.length ?? 0;
      const newLibertyCount = stateAfterMove ? findChainLibertiesForPoint(stateAfterMove, point.x, point.y).length : -1;
      return {
        point,
        oldLibertyCount,
        newLibertyCount,
      };
    })
    .filter((newLiberty) => newLiberty.newLibertyCount > 1);

  return libertyIncreases;
}

async function getGrowthMove(initialState: BoardState, player: PlayerColor) {
  const growthMoves = await getLibertyGrowthMove(initialState, player);
  const libertyIncreases = growthMoves?.filter((move) => move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 2) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

async function getDefendMove(initialState: BoardState, player: PlayerColor) {
  const growthMoves = await getLibertyGrowthMove(initialState, player);
  const libertyIncreases =
    growthMoves?.filter((move) => move.oldLibertyCount <= 1 && move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 2) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

// TODO: refactor for clarity
async function getSurroundMove(initialState: BoardState, player: PlayerColor) {
  const boardState = getStateClone(initialState);

  const opposingPlayer = player === playerColors.black ? playerColors.white : playerColors.black;
  const enemyChains = getAllChains(boardState).filter((chain) => chain[0].player === opposingPlayer);

  if (!enemyChains.length) {
    return null;
  }

  const enemyChainRepresentatives = enemyChains
    .map((chain) => chain[0])
    .map((point) =>
      point.liberties
        ?.filter(isNotNull)
        .filter(isDefined)
        .map((liberty) => ({
          liberty: liberty,
          examplePoint: point,
        })),
    )
    .flat()
    .filter(isDefined);

  // Find a liberty where playing a piece decreases the liberty of the enemy chain (aka smothers or captures the chain)
  const libertyDecreases = enemyChainRepresentatives
    .map((point) => {
      const stateAfterMove = makeMove(getStateClone(boardState), point.liberty.x, point.liberty.y, player);
      if (!stateAfterMove) {
        return {
          point: point.liberty,
          oldLibertyCount: Number.MAX_SAFE_INTEGER,
          newLibertyCount: Number.MAX_SAFE_INTEGER,
        };
      }

      // TODO: this count is wrong (usually returning 0). why?
      const newEnemyLibertyCount = findChainLibertiesForPoint(
        stateAfterMove,
        point.examplePoint.x,
        point.examplePoint.y,
      ).length;
      const newMoveLibertyCount = findChainLibertiesForPoint(stateAfterMove, point.liberty.x, point.liberty.y).length;
      if (newEnemyLibertyCount > 0 && newMoveLibertyCount === 0) {
        return {
          point: point.liberty,
          oldLibertyCount: Number.MAX_SAFE_INTEGER,
          newLibertyCount: Number.MAX_SAFE_INTEGER,
        };
      }

      return {
        point: point.liberty,
        oldLibertyCount: -1,
        newLibertyCount: newEnemyLibertyCount,
      };
    })
    .filter((option) => option.newLibertyCount < Number.MAX_SAFE_INTEGER);
  if (!libertyDecreases.length) {
    return null;
  }

  const minLibertyCount = Math.min(...libertyDecreases.map((l) => l.newLibertyCount));
  const moveCandidates = libertyDecreases.filter((l) => l.newLibertyCount === minLibertyCount);

  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

async function getMoveOptions(boardState: BoardState, player: PlayerColor): Promise<MoveOptions> {
  const randomMove = await getRandomMove(boardState, player);
  await sleep(50);
  const growthMove = await getGrowthMove(boardState, player);
  await sleep(50);
  const expansionMove = await getExpansionMove(boardState, player);
  await sleep(50);
  const defendMove = await getDefendMove(boardState, player);
  await sleep(50);
  const surroundMove = await getSurroundMove(boardState, player);

  console.log("surround: ", surroundMove?.point?.x, surroundMove?.point?.y);
  console.log("defend: ", defendMove?.point?.x, defendMove?.point?.y);
  console.log("Growth: ", growthMove?.point?.x, growthMove?.point?.y);
  console.log("Growth: ", growthMove?.point?.x, growthMove?.point?.y);
  console.log("Random: ", randomMove?.point?.x, randomMove?.point?.y);

  return {
    capture: surroundMove && surroundMove?.newLibertyCount === 0 ? surroundMove : null,
    defendCapture: defendMove && defendMove.oldLibertyCount == 1 && defendMove?.newLibertyCount > 1 ? defendMove : null,
    growth: growthMove,
    expansion: expansionMove,
    defend: defendMove,
    surround: surroundMove,
    random: randomMove,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
