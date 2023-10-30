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
} from "../boardState/goConstants";
import { endGoGame, findNeighbors, floor, isDefined, isNotNull, passTurn } from "../boardState/boardState";
import {
  evaluateIfMoveIsValid,
  evaluateMoveResult,
  findChainLibertiesForPoint,
  findClaimedTerritory,
  getAllChains,
  getAllEyes,
  getAllValidMoves,
} from "./boardAnalysis";
import { findAnyMatchedPatterns } from "./patternMatching";
import { WHRNG } from "../../Casino/RNG";
import { Player } from "@player";

/*
  Basic GO AIs, each with some personality and weaknesses

  The basic logic is pulled from https://archive.org/details/byte-magazine-1981-04/page/n101/mode/2up?view=theater

  In addition, knowledge of claimed territory and eyes has been added, to aid in narrowing down which spaces to play on
 */

/**
 * Finds an array of potential moves based on the current board state, then chooses one
 * based on the given opponent's personality and preferences. If no preference is given by the AI,
 * will choose one from the reasonable moves at random.
 *
 * @returns a promise that will resolve with a move (or pass) from the designated AI opponent.
 */
export async function getMove(boardState: BoardState, player: PlayerColor, opponent: opponents) {
  const rng = new WHRNG(Player.totalPlaytime).random();
  const moves = await getMoveOptions(boardState, player, rng);

  const priorityMove = getFactionMove(moves, opponent, rng);
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

  const chosenMove = moveOptions[floor(rng * moveOptions.length)];

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

/**
 * Detects if the AI is merely passing their turn, or if the game should end.
 *
 * Ends the game if the player passed on the previous turn before the AI passes,
 *   or if the player will be forced to pass their next turn after the AI passes.
 */
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

/**
 * Given a group of move options, chooses one based on the given opponent's personality (if any fit their priorities)
 */
function getFactionMove(moves: MoveOptions, faction: opponents, rng: number): PointState | null {
  if (faction === opponents.Netburners) {
    return getNetburnersPriorityMove(moves, rng);
  }
  if (faction === opponents.SlumSnakes) {
    return getSlumSnakesPriorityMove(moves, rng);
  }
  if (faction === opponents.TheBlackHand) {
    return getBlackHandPriorityMove(moves, rng);
  }
  if (faction === opponents.Daedalus) {
    return getDaedalusPriorityMove(moves, rng);
  }

  return getIlluminatiPriorityMove(moves);
}

/**
 * Netburners mostly just put random points around the board, but occasionally have a smart move
 */
function getNetburnersPriorityMove(moves: MoveOptions, rng: number): PointState | null {
  if (rng < 0.2) {
    return getIlluminatiPriorityMove(moves);
  } else if (rng < 0.5 && moves.expansion) {
    return moves.expansion.point;
  } else if (rng < 0.65) {
    return moves.random;
  }

  return null;
}

/**
 * Slum snakes prioritize defending their pieces and building chains that snake around as much of the bord as possible.
 */
function getSlumSnakesPriorityMove(moves: MoveOptions, rng: number): PointState | null {
  if (moves.defendCapture) {
    console.log("defend capture: defend move chosen");
    return moves.defendCapture.point;
  }

  if (rng < 0.2) {
    return getIlluminatiPriorityMove(moves);
  } else if (rng < 0.6 && moves.growth) {
    return moves.growth.point;
  } else if (rng < 0.65) {
    return moves.random;
  }

  return null;
}

/**
 * Black hand just wants to smOrk. They always capture or smother the opponent if possible.
 */
function getBlackHandPriorityMove(moves: MoveOptions, rng: number): PointState | null {
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

  if (rng < 0.3) {
    return getIlluminatiPriorityMove(moves);
  } else if (rng < 0.75 && moves.surround) {
    return moves.surround.point;
  } else if (rng < 0.8) {
    return moves.random;
  }

  return null;
}

/**
 * Daedalus almost always picks the Illuminati move, but very occasionally gets distracted.
 */
function getDaedalusPriorityMove(moves: MoveOptions, rng: number): PointState | null {
  if (rng < 0.9) {
    return getIlluminatiPriorityMove(moves);
  }

  return null;
}

/**
 * First prioritizes capturing of opponent pieces.
 * Then, preventing capture of their own pieces.
 * Then, creating "eyes" to solidify their control over the board
 * Then, finding opportunities to capture on their next move
 * Then, blocking the opponent's attempts to create eyes
 * Finally, will match any of the predefined local patterns indicating a strong move.
 */
function getIlluminatiPriorityMove(moves: MoveOptions): PointState | null {
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

/**
 * Finds a move in an open area to expand influence and later build on
 */
export function getExpansionMoveArray(
  boardState: BoardState,
  player: PlayerColor,
  availableSpaces: PointState[],
  moveCount = 1,
): Move[] {
  const emptySpaces = availableSpaces.filter((space) => {
    const neighbors = findNeighbors(boardState, space.x, space.y);
    return (
      [neighbors.north, neighbors.east, neighbors.south, neighbors.west].filter(
        (point) => point && point.player === playerColors.empty,
      ).length === 4
    );
  });

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

/**
 * Finds all moves that increases the liberties of the player's pieces, making them harder to capture and occupy more space on the board.
 */
async function getLibertyGrowthMoves(boardState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const friendlyEyes = getAllEyes(boardState, player).flat().flat();
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
      const stateAfterMove = evaluateMoveResult(boardState, point.libertyPoint.x, point.libertyPoint.y, player);
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

/**
 * Find a move that increases the player's liberties by the maximum amount
 */
async function getGrowthMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const growthMoves = await getLibertyGrowthMoves(initialState, player, availableSpaces);
  const libertyIncreases = growthMoves?.filter((move) => move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 2) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

/**
 * Find a move that specifically increases a chain's liberties from 1 to more than 1, preventing capture
 */
async function getDefendMove(initialState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const growthMoves = await getLibertyGrowthMoves(initialState, player, availableSpaces);
  const libertyIncreases =
    growthMoves?.filter((move) => move.oldLibertyCount <= 1 && move.newLibertyCount >= move.oldLibertyCount) ?? [];

  const maxLibertyCount = Math.max(...libertyIncreases.map((l) => l.newLibertyCount));

  if (maxLibertyCount <= 1) {
    return null;
  }

  const moveCandidates = libertyIncreases.filter((l) => l.newLibertyCount === maxLibertyCount);
  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

/**
 * Find a move that reduces the opponent's liberties as much as possible,
 *   capturing (or making it easier to capture) their pieces
 */
async function getSurroundMove(boardState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const opposingPlayer = player === playerColors.black ? playerColors.white : playerColors.black;
  const enemyChains = getAllChains(boardState).filter((chain) => chain[0].player === opposingPlayer);

  if (!enemyChains.length) {
    return null;
  }

  // Get a point from each enemy chain to use as a reference point later
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
      const stateAfterMove = evaluateMoveResult(boardState, point.liberty.x, point.liberty.y, player);
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
    .filter((libertyDecrease) =>
      availableSpaces.find(
        (availablePoint) =>
          availablePoint.x === libertyDecrease.point.x && availablePoint.y === libertyDecrease.point.y,
      ),
    );
  if (!libertyDecreases.length) {
    return null;
  }

  const minLibertyCount = Math.min(...libertyDecreases.map((l) => l.newLibertyCount));
  const moveCandidates = libertyDecreases.filter((l) => l.newLibertyCount === minLibertyCount);

  return moveCandidates[floor(Math.random() * moveCandidates.length)];
}

/**
 * Finds all moves that would create an eye for the given player.
 *
 * An "eye" is empty point(s) completely surrounded by a single player's connected pieces.
 * If a chain has multiple eyes, it cannot be captured by the opponent (since they can only fill one eye at a time,
 *  and suiciding your own pieces is not legal unless it captures the opponents' first)
 */
function getEyeCreationMoves(boardState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  const currentEyes = getAllEyes(boardState, player);
  const currentLivingGroupsCount = currentEyes.filter((eye) => eye.length >= 2);
  const currentEyeCount = currentEyes.filter((eye) => eye.length);

  const chains = getAllChains(boardState);
  const friendlyLiberties = chains
    .filter((chain) => chain[0].player === player)
    .map((chain) => chain[0].liberties)
    .flat()
    .filter(isNotNull)
    .filter((point) =>
      availableSpaces.find((availablePoint) => availablePoint.x === point.x && availablePoint.y === point.y),
    );

  const eyeCreationMoves = friendlyLiberties.reduce((moveOptions: EyeMove[], point: PointState) => {
    const evaluationBoard = evaluateMoveResult(boardState, point.x, point.y, player);
    const newEyes = getAllEyes(evaluationBoard, player);
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

function getEyeCreationMove(boardState: BoardState, player: PlayerColor, availableSpaces: PointState[]) {
  return getEyeCreationMoves(boardState, player, availableSpaces)[0];
}

/**
 * If there is only one move that would create two eyes for the opponent, it should be blocked if possible
 */
function getEyeBlockingMove(boardState: BoardState, player: PlayerColor, availablePoints: PointState[]) {
  const opposingPlayer = player === playerColors.white ? playerColors.black : playerColors.white;
  const opponentEyeMoves = getEyeCreationMoves(boardState, opposingPlayer, availablePoints);
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

/**
 * Gets a group of reasonable moves based on the current board state, to be passed to the factions' AI to decide on
 */
async function getMoveOptions(boardState: BoardState, player: PlayerColor, rng: number): Promise<MoveOptions> {
  const validMoves = getAllValidMoves(boardState, player);
  const eyePoints = findClaimedTerritory(boardState);
  const availableSpaces = validMoves.filter(
    (move) => !eyePoints.find((point) => point.x === move.x && point.y === move.y),
  );

  const growthMove = await getGrowthMove(boardState, player, availableSpaces);
  await sleep(80);
  const expansionMove = await getExpansionMove(boardState, player, availableSpaces);
  await sleep(80);
  const defendMove = await getDefendMove(boardState, player, availableSpaces);
  await sleep(80);
  const surroundMove = await getSurroundMove(boardState, player, availableSpaces);
  await sleep(80);
  const eyeMove = getEyeCreationMove(boardState, player, availableSpaces);
  await sleep(80);
  const eyeBlock = getEyeBlockingMove(boardState, player, availableSpaces);
  await sleep(80);
  const pattern = await findAnyMatchedPatterns(boardState, player, availableSpaces);
  const random = availableSpaces[floor(rng * availableSpaces.length)];

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
  console.log("Random: ", expansionMove?.point?.x, expansionMove?.point?.y);

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
    random: random,
  };
}

/**
 * Gets the starting score for white.
 */
export function getKomi(opponent: opponents) {
  return opponentDetails[opponent].komi;
}

/**
 * Allows time to pass
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
