import {
  BoardState,
  EyeMove,
  Move,
  MoveOptions,
  opponentDetails,
  opponents,
  PlayerColor,
  playerColors,
  playTypes,
  PointState,
  validityReason,
} from "../boardState/goConstants";
import {
  endGoGame,
  findNeighbors,
  floor,
  getStateCopy,
  isDefined,
  isNotNull,
  makeMove,
  passTurn,
  updateCaptures,
} from "../boardState/boardState";
import {
  evaluateIfMoveIsValid,
  findChainLibertiesForPoint,
  getAllChains,
  getAllEyes,
  getAllValidMoves,
} from "./boardAnalysis";
import { findAnyMatchedPatterns } from "./patternMatching";

/*
  Basic GO AIs, each with some personality and weaknesses

  The basic logic is pulled from https://archive.org/details/byte-magazine-1981-04/page/n101/mode/2up?view=theater

  In addition, knowledge of claimed territory and eyes has been added, to aid in narrowing down which spaces to play on
 */

export async function getMove(boardState: BoardState, player: PlayerColor, opponent: opponents = opponents.Daedalus) {
  const moves = await getMoveOptions(boardState, player);

  const priorityMove = getFactionMove(moves, opponent);
  if (priorityMove) {
    return {
      type: playTypes.move,
      x: priorityMove.x,
      y: priorityMove.y,
    };
  }

  // If no priority move is chosen, pick one of the reasonable moves
  const moveOptions = [
    moves.growth?.point,
    moves.surround?.point,
    moves.defend?.point,
    moves.expansion?.point,
    moves.pattern,
    moves.eyeMove?.point,
    moves.eyeBlock?.point,
  ]
    .filter(isNotNull)
    .filter(isDefined);

  const chosenMove = moveOptions[floor(Math.random() * moveOptions.length)];

  if (chosenMove) {
    console.log(`Non-priority move chosen: ${chosenMove.x} ${chosenMove.y}`);
    return {
      type: playTypes.move,
      x: chosenMove.x,
      y: chosenMove.y,
    };
  } else {
    console.log("No valid moves found");
    return handleNoMoveFound(boardState);
  }
}

function handleNoMoveFound(boardState: BoardState) {
  passTurn(boardState);
  const remainingTerritory = getAllValidMoves(boardState, playerColors.black).length;
  if (remainingTerritory > 0 && boardState.passCount < 2) {
    return {
      type: playTypes.pass,
      x: -1,
      y: -1,
    };
  } else {
    endGoGame(boardState);
    return {
      type: playTypes.gameOver,
      x: -1,
      y: -1,
    };
  }
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

  if (moves.eyeMove) {
    console.log("Create eye move chosen");
    return moves.eyeMove.point;
  }

  if (moves.surround && moves.surround.point && (moves.surround?.newLibertyCount ?? 9) <= 1) {
    console.log("surround move chosen");
    return moves.surround.point;
  }

  if (moves.eyeBlock) {
    console.log("Block eye move chosen");
    return moves.eyeBlock.point;
  }

  if (moves.pattern) {
    console.log("pattern match move chosen");
    return moves.pattern;
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
  const friendlyEyes = getAllEyes(initialState, player).flat().flat();
  const growableSpaces = availableSpaces.filter(
    (point) => !friendlyEyes.find((eye) => eye.x === point.x && eye.y == point.y),
  );

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
      growableSpaces.find((point) => liberty.libertyPoint.x === point.x && liberty.libertyPoint.y === point.y),
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
    .filter((newLiberty) => newLiberty.newLibertyCount > 1)
    .filter((newLiberty) => evaluateIfMoveIsValid(boardState, newLiberty.point.x, newLiberty.point.y, player));
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
// TODO: eliminate move options with only one liberty
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
        return null;
      }

      const newEnemyLibertyCount = findChainLibertiesForPoint(
        stateAfterMove,
        point.examplePoint.x,
        point.examplePoint.y,
      ).length;
      const newMoveLibertyCount = findChainLibertiesForPoint(stateAfterMove, point.liberty.x, point.liberty.y).length;
      if (newEnemyLibertyCount > 0 && newMoveLibertyCount < 2) {
        return null;
      }

      return {
        point: point.liberty,
        oldLibertyCount: -1,
        newLibertyCount: newEnemyLibertyCount,
      };
    })
    .filter(isNotNull)
    .filter(
      (libertyDecrease) =>
        evaluateIfMoveIsValid(boardState, libertyDecrease.point.x, libertyDecrease.point.y, player) ===
        validityReason.valid,
    );
  if (!libertyDecreases.length) {
    return null;
  }

  const minLibertyCount = Math.min(...libertyDecreases.map((l) => l.newLibertyCount));
  const moveCandidates = libertyDecreases.filter((l) => l.newLibertyCount === minLibertyCount);

  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

function getEyeCreationMoves(boardState: BoardState, player: PlayerColor) {
  const currentEyes = getAllEyes(boardState, player);
  const currentLivingGroupsCount = currentEyes.filter((eye) => eye.length >= 2);
  const currentEyeCount = currentEyes.filter((eye) => eye.length);

  const chains = getAllChains(boardState);
  const friendlyLiberties = chains
    .filter((chain) => chain[0].player === player)
    .map((chain) => chain[0].liberties)
    .flat()
    .filter(isNotNull)
    .filter((point) => evaluateIfMoveIsValid(boardState, point.x, point.y, player));

  const eyeCreationMoves = friendlyLiberties.reduce((moveOptions: EyeMove[], point: PointState) => {
    const evaluationBoard = getStateCopy(boardState);
    evaluationBoard.board[point.x][point.y].player = player;
    const newEyes = getAllEyes(updateCaptures(evaluationBoard, player), player);
    const newLivingGroupsCount = newEyes.filter((eye) => eye.length >= 2);
    const newEyeCount = newEyes.filter((eye) => eye.length);
    if (
      newLivingGroupsCount > currentLivingGroupsCount ||
      (newEyeCount > currentEyeCount && newLivingGroupsCount === currentLivingGroupsCount)
    ) {
      moveOptions.push({
        point: point,
        createsLife: newLivingGroupsCount > currentLivingGroupsCount,
      });
    }
    return moveOptions;
  }, []);

  return eyeCreationMoves.sort((moveA, moveB) => +moveB.createsLife - +moveA.createsLife);
}

function getEyeCreationMove(boardState: BoardState, player: PlayerColor) {
  return getEyeCreationMoves(boardState, player)[0];
}

function getEyeBlockingMove(boardState: BoardState, player: PlayerColor) {
  const opposingPlayer = player === playerColors.white ? playerColors.black : playerColors.white;
  const opponentEyeMoves = getEyeCreationMoves(boardState, opposingPlayer);
  const twoEyeMoves = opponentEyeMoves.filter((move) => move.createsLife);
  const oneEyeMoves = opponentEyeMoves.filter((move) => !move.createsLife);

  if (twoEyeMoves.length === 1) {
    return twoEyeMoves[0];
  }
  if (!twoEyeMoves.length && oneEyeMoves.length === 1) {
    return oneEyeMoves[0];
  }
  return null;
}

async function getMoveOptions(boardState: BoardState, player: PlayerColor): Promise<MoveOptions> {
  const availableSpaces = getAllValidMoves(boardState, player);

  const growthMove = await getGrowthMove(boardState, player, availableSpaces);
  await sleep(50);
  const expansionMove = await getExpansionMove(boardState, player, availableSpaces);
  await sleep(50);
  const defendMove = await getDefendMove(boardState, player, availableSpaces);
  await sleep(50);
  const surroundMove = await getSurroundMove(boardState, player, availableSpaces);
  await sleep(50);
  const eyeMove = getEyeCreationMove(boardState, player);
  await sleep(50);
  const eyeBlock = getEyeBlockingMove(boardState, player);
  await sleep(50);
  const pattern = await findAnyMatchedPatterns(boardState, player);

  const captureMove = surroundMove && surroundMove?.newLibertyCount === 0 ? surroundMove : null;
  const defendCaptureMove =
    defendMove && defendMove.oldLibertyCount == 1 && defendMove?.newLibertyCount > 1 ? defendMove : null;

  console.log("---------------------");
  console.log("capture: ", captureMove?.point?.x, captureMove?.point?.y);
  console.log("defendCapture: ", defendCaptureMove?.point?.x, defendCaptureMove?.point?.y);
  console.log("eyeMove: ", eyeMove?.point?.x, eyeMove?.point?.y);
  console.log("eyeBlock: ", eyeBlock?.point?.x, eyeBlock?.point?.y);
  console.log("pattern: ", pattern?.x, pattern?.y);
  console.log("surround: ", surroundMove?.point?.x, surroundMove?.point?.y);
  console.log("defend: ", defendMove?.point?.x, defendMove?.point?.y);
  console.log("Growth: ", growthMove?.point?.x, growthMove?.point?.y);
  console.log("Expansion: ", expansionMove?.point?.x, expansionMove?.point?.y);

  return {
    capture: captureMove,
    defendCapture: defendCaptureMove,
    eyeMove: eyeMove,
    eyeBlock: eyeBlock,
    pattern: pattern,
    growth: growthMove,
    expansion: expansionMove,
    defend: defendMove,
    surround: surroundMove,
  };
}

export function getKomi(opponent: opponents) {
  return opponentDetails[opponent].komi;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
