import {
  BoardState,
  Move,
  MoveOptions,
  opponents,
  PlayerColor,
  playerColors,
  PointState,
  validityReason,
} from "./goConstants";
import { findNeighbors, floor, getEmptySpaces, getStateCopy, isDefined, isNotNull, makeMove } from "./boardState";
import { evaluateIfMoveIsValid, findChainLibertiesForPoint, findClaimedTerritory, getAllChains } from "./boardAnalysis";

/*
  Basic GO AIs, each with some personality and weaknesses

  The basic logic is pulled from https://archive.org/details/byte-magazine-1981-04/page/n101/mode/2up?view=theater

  In addition, knowledge of claimed territory and eyes has been added, to aid in narrowing down spaces to play on

 */

export async function getMove(
  boardState: BoardState,
  player: PlayerColor,
  opponent: opponents = opponents.Daedalus,
): Promise<PointState> {
  const moves = await getMoveOptions(boardState, player);

  const priorityMove = getFactionMove(moves, opponent);
  if (
    priorityMove &&
    evaluateIfMoveIsValid(boardState, priorityMove.x, priorityMove.y, player) === validityReason.valid
  ) {
    return priorityMove;
  }

  // If no priority move is chosen, pick one of the reasonable moves
  const moveOptions = [moves.growth?.point, moves.surround?.point, moves.defend?.point, moves.expansion?.point]
    .filter(isNotNull)
    .filter(isDefined)
    .filter((move) => evaluateIfMoveIsValid(boardState, move.x, move.y, player) === validityReason.valid);

  const chosenMove = moveOptions[floor(Math.random() * moveOptions.length)];
  console.log(chosenMove ? `Non-priority move chosen: ${chosenMove.x} ${chosenMove.y}` : "No valid moves found");

  return chosenMove;
}

function getFactionMove(moves: MoveOptions, faction: opponents): PointState | null {
  if (faction === opponents.Netburners) {
    return getNetburnersPriorityMove(moves);
  }
  if (faction === opponents.SlumSnakes) {
    return getSlumSnakesPriorityMove(moves);
  }
  if (faction === opponents.TheBlackHand) {
    return getBlackHandPriorityMove(moves);
  }

  return getDaedalusPriorityMove(moves);
}

function getNetburnersPriorityMove(moves: MoveOptions): PointState | null {
  const rng = Math.random();
  if (rng < 0.2) {
    return getDaedalusPriorityMove(moves);
  } else if (rng < 0.5 && moves.expansion) {
    return moves.expansion.point;
  }

  return null;
}

function getSlumSnakesPriorityMove(moves: MoveOptions): PointState | null {
  if (moves.defendCapture) {
    console.log("defend capture: defend move chosen");
    return moves.defendCapture.point;
  }

  const rng = Math.random();
  if (rng < 0.2) {
    return getDaedalusPriorityMove(moves);
  } else if (rng < 0.6 && moves.growth) {
    return moves.growth.point;
  }

  return null;
}

function getBlackHandPriorityMove(moves: MoveOptions): PointState | null {
  if (moves.capture) {
    console.log("capture: capture move chosen");
    return moves.capture.point;
  }

  if (moves.surround && moves.surround.point && (moves.surround?.newLibertyCount ?? 999) <= 1) {
    console.log("surround move chosen");
    return moves.surround.point;
  }

  if (moves.defendCapture) {
    console.log("defend capture: defend move chosen");
    return moves.defendCapture.point;
  }

  const rng = Math.random();
  if (rng < 0.3) {
    return getDaedalusPriorityMove(moves);
  } else if (rng < 0.75 && moves.surround) {
    return moves.surround.point;
  }

  return null;
}

function getDaedalusPriorityMove(moves: MoveOptions): PointState | null {
  if (moves.capture) {
    console.log("capture: capture move chosen");
    return moves.capture.point;
  }

  if (moves.defendCapture) {
    console.log("defend capture: defend move chosen");
    return moves.defendCapture.point;
  }

  if (moves.surround && moves.surround.point && (moves.surround?.newLibertyCount ?? 999) <= 1) {
    console.log("surround move chosen");
    return moves.surround.point;
  }

  return null;
}

function getExpansionMove(boardState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  return getExpansionMoveArray(boardState, player, availableSpaces)?.[0] ?? null;
}

export function getExpansionMoveArray(
  boardState: BoardState,
  player: PlayerColor,
  availableSpaces: PointState[],
  moveCount = 1,
): Move[] {
  const emptySpaces = availableSpaces
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

  const boardSize = boardState.board[0].length;
  return new Array(moveCount).fill(null).map((_, index) => {
    const spaceIndex = Math.floor(randomIndex + (boardSize / 3) * index) % emptySpaces.length;
    return {
      point: emptySpaces[spaceIndex],
      newLibertyCount: -1,
      oldLibertyCount: -1,
    };
  });
}

async function getLibertyGrowthMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const boardState = getStateCopy(initialState);

  const friendlyChains = getAllChains(boardState).filter((chain) => chain[0].player === player);

  if (!friendlyChains.length) {
    return null;
  }

  const liberties = friendlyChains
    .map((chain) =>
      chain[0].liberties?.filter(isNotNull).map((liberty) => ({
        libertyPoint: liberty,
        oldLibertyCount: chain[0].liberties?.length,
      })),
    )
    .flat()
    .filter(isNotNull)
    .filter(isDefined)
    .filter((liberty) =>
      availableSpaces.find((point) => liberty.libertyPoint.x === point.x && liberty.libertyPoint.y === point.y),
    );

  // Find a liberty where playing a piece increases the liberty of the chain (aka expands or defends the chain)
  return liberties
    .map((point) => {
      const stateAfterMove = makeMove(getStateCopy(boardState), point.libertyPoint.x, point.libertyPoint.y, player);
      const oldLibertyCount = point?.oldLibertyCount ?? 0;
      const newLibertyCount = stateAfterMove
        ? findChainLibertiesForPoint(stateAfterMove, point.libertyPoint.x, point.libertyPoint.y).length
        : -1;
      return {
        point: point.libertyPoint,
        oldLibertyCount,
        newLibertyCount,
      };
    })
    .filter((newLiberty) => newLiberty.newLibertyCount > 1);
}

async function getGrowthMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const growthMoves = await getLibertyGrowthMove(initialState, player, availableSpaces);
  const libertyIncreases = growthMoves?.filter((move) => move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 2) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

async function getDefendMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const growthMoves = await getLibertyGrowthMove(initialState, player, availableSpaces);
  const libertyIncreases =
    growthMoves?.filter((move) => move.oldLibertyCount <= 1 && move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 1) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

// TODO: refactor for clarity
async function getSurroundMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const boardState = getStateCopy(initialState);

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
    .filter(isDefined)
    .filter((liberty) =>
      availableSpaces.find((point) => liberty.liberty.x === point.x && liberty.liberty.y === point.y),
    );

  // Find a liberty where playing a piece decreases the liberty of the enemy chain (aka smothers or captures the chain)
  const libertyDecreases = enemyChainRepresentatives
    .map((point) => {
      const stateAfterMove = makeMove(getStateCopy(boardState), point.liberty.x, point.liberty.y, player);
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
  const claimedTerritory = findClaimedTerritory(boardState);
  const availableSpaces = getEmptySpaces(boardState).filter(
    (point) => !claimedTerritory.find((claimedPoint) => claimedPoint.x === point.x && claimedPoint.y === point.y),
  );

  const growthMove = await getGrowthMove(boardState, player, availableSpaces);
  await sleep(50);
  const expansionMove = await getExpansionMove(boardState, player, availableSpaces);
  await sleep(50);
  const defendMove = await getDefendMove(boardState, player, availableSpaces);
  await sleep(50);
  const surroundMove = await getSurroundMove(boardState, player, availableSpaces);

  const captureMove = surroundMove && surroundMove?.newLibertyCount === 0 ? surroundMove : null;
  const defendCaptureMove =
    defendMove && defendMove.oldLibertyCount == 1 && defendMove?.newLibertyCount > 1 ? defendMove : null;

  console.log("capture: ", captureMove?.point?.x, captureMove?.point?.y);
  console.log("defendCapture: ", defendCaptureMove?.point?.x, defendCaptureMove?.point?.y);
  console.log("surround: ", surroundMove?.point?.x, surroundMove?.point?.y);
  console.log("defend: ", defendMove?.point?.x, defendMove?.point?.y);
  console.log("Growth: ", growthMove?.point?.x, growthMove?.point?.y);
  console.log("Expansion: ", expansionMove?.point?.x, expansionMove?.point?.y);

  return {
    capture: captureMove,
    defendCapture: defendCaptureMove,
    growth: growthMove,
    expansion: expansionMove,
    defend: defendMove,
    surround: surroundMove,
  };
}

export function getKomi(opponent: opponents) {
  switch (opponent) {
    case opponents.Netburners:
      return 1.5;
    case opponents.SlumSnakes:
    case opponents.TheBlackHand:
      return 3.5;
    case opponents.Illuminati:
      return 7.5;
    default:
      return 5.5;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
