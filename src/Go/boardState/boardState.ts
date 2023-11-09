import {
  Board,
  BoardState,
  Move,
  Neighbor,
  opponents,
  PlayerColor,
  playerColors,
  PointState,
  validityReason,
} from "./goConstants";
import { getExpansionMoveArray } from "../boardAnalysis/goAI";
import {
  evaluateIfMoveIsValid,
  findAllCapturedChains,
  findLibertiesForChain,
  getAllChains,
} from "../boardAnalysis/boardAnalysis";
import { Player } from "@player";
import { getScore } from "../boardAnalysis/scoring";
import { getDifficultyMultiplier, getWinstreakMultiplier } from "../effects/effect";
import { cloneDeep } from "lodash";

/**
 * Generates a new BoardState object with the given opponent and size
 */
export function getNewBoardState(boardSize: number, ai?: opponents, boardToCopy?: Board): BoardState {
  const newBoardState = {
    history: [],
    previousPlayer: playerColors.white,
    ai: ai ?? opponents.Netburners,
    passCount: 0,
    board: Array.from({ length: boardSize }, (_, x) =>
      Array.from({ length: boardSize }, (_, y) => ({
        player: boardToCopy?.[x]?.[y]?.player ?? playerColors.empty,
        chain: "",
        liberties: null,
        x,
        y,
      })),
    ),
  };

  // Illuminati get a few starting routers
  if (ai === opponents.Illuminati) {
    applyHandicap(newBoardState, ceil(boardSize * 0.35));
  }
  return newBoardState;
}
/**
 * Make a new move on the given board, and update the board state accordingly
 */
export function makeMove(boardState: BoardState, x: number, y: number, player: PlayerColor, evaluateCaptures = true) {
  // Do not update on invalid moves
  const validity = evaluateIfMoveIsValid(boardState, x, y, player);
  if (validity !== validityReason.valid) {
    console.warn(`Invalid move attempted! ${x} ${y} ${player} : ${validity}`);
    return false;
  }

  boardState.history.push(getBoardCopy(boardState).board);
  boardState.history = boardState.history.slice(-4);
  boardState.board[x][y].player = player;
  boardState.previousPlayer = player;
  boardState.passCount = 0;

  if (evaluateCaptures) {
    return updateCaptures(boardState, player);
  }

  return boardState;
}

/**
 * Pass the current player's turn without making a move.
 * Ends the game if this is the second pass in a row.
 */
export function passTurn(boardState: BoardState) {
  if (boardState.previousPlayer === null) {
    return;
  }
  boardState.previousPlayer =
    boardState.previousPlayer === playerColors.black ? playerColors.white : playerColors.black;
  boardState.passCount++;

  if (boardState.passCount >= 2) {
    endGoGame(boardState);
  }
}

/**
 * Handles ending the game. Sets the previous player to null to prevent further moves, calculates score, and updates
 * player node count and power, and game history
 */
export function endGoGame(boardState: BoardState) {
  if (boardState.previousPlayer === null) {
    return;
  }
  boardState.previousPlayer = null;
  const statusToUpdate = Player.go.status[boardState.ai];
  const score = getScore(boardState);

  if (score[playerColors.black].sum < score[playerColors.white].sum) {
    resetWinstreak(boardState.ai);
    statusToUpdate.nodePower += floor(score[playerColors.black].sum * 0.25);
  } else {
    statusToUpdate.wins++;
    statusToUpdate.winStreak++;

    if (statusToUpdate.winStreak > statusToUpdate.highestWinStreak) {
      statusToUpdate.highestWinStreak = statusToUpdate.winStreak;
    }
  }

  statusToUpdate.nodePower +=
    score[playerColors.black].sum *
    getDifficultyMultiplier(score[playerColors.white].komi) *
    getWinstreakMultiplier(statusToUpdate.winStreak);

  statusToUpdate.nodes += score[playerColors.black].sum;
  Player.go.previousGameFinalBoardState = boardState;

  // Update multipliers with new bonuses, once at the end of the game
  Player.applyEntropy(Player.entropy);
}

/**
 * Sets the winstreak to zero for the given opponent, and adds a loss
 */
export function resetWinstreak(opponent: opponents) {
  const statusToUpdate = Player.go.status[opponent];
  statusToUpdate.losses++;
  statusToUpdate.winStreak = 0;
}

/**
 * Makes a number of random moves on the board before the game starts, to give one player an edge.
 */
export function applyHandicap(boardState: BoardState, handicap: number) {
  const availableMoves = getEmptySpaces(boardState);
  const handicapMoves = getExpansionMoveArray(boardState, playerColors.black, availableMoves, handicap);

  handicapMoves.forEach(
    (move: Move) => move.point && (boardState.board[move.point.x][move.point.y].player = playerColors.white),
  );
  return boardState;
}

/**
 * Finds all groups of connected stones on the board, and updates the points in them with their
 * chain information and liberties.
 */
export function updateChains(boardState: BoardState, resetChains = true) {
  resetChains && (boardState.board = clearChains(boardState).board);

  for (let x = 0; x < boardState.board.length; x++) {
    for (let y = 0; y < boardState.board[x].length; y++) {
      const point = boardState.board[x][y];
      // If the current point is already analyzed, skip it
      if (point.chain !== "") {
        continue;
      }

      const chainMembers = findAdjacentPointsInChain(boardState, x, y);
      const libertiesForChain = findLibertiesForChain(boardState, chainMembers);
      const id = `${point.x}${point.y}`;

      chainMembers.forEach((member) => {
        member.chain = id;
        member.liberties = libertiesForChain;
      });
    }
  }

  return boardState;
}

/**
 * Assign each point on the board a chain ID, and link its list of 'liberties' (which are empty spaces
 * adjacent to some point on the chain including the current point).
 *
 * Then, remove any chains with no liberties.
 */
export function updateCaptures(initialState: BoardState, playerWhoMoved: PlayerColor, resetChains = true): BoardState {
  const boardState = updateChains(initialState, resetChains);
  const chains = getAllChains(boardState);

  const chainsToCapture = findAllCapturedChains(chains, playerWhoMoved);
  if (!chainsToCapture?.length) {
    return boardState;
  }

  chainsToCapture?.forEach((chain) => captureChain(chain));
  return updateChains(boardState);
}

/**
 * Removes a chain from the board, after being captured
 */
function captureChain(chain: PointState[]) {
  chain.forEach((point) => {
    point.player = playerColors.empty;
    point.chain = "";
    point.liberties = [];
  });
}

/**
 * Removes the chain data from given points, in preparation for being recalculated later
 */
function clearChains(boardState: BoardState): BoardState {
  for (const x in boardState.board) {
    for (const y in boardState.board[x]) {
      boardState.board[x][y].chain = "";
      boardState.board[x][y].liberties = null;
    }
  }
  return boardState;
}

/**
 * Finds all the pieces in the current continuous group, or 'chain'
 *
 * Iteratively traverse the adjacent pieces of the same color to find all the pieces in the same chain,
 * which are the pieces connected directly via a path consisting only of only up/down/left/right
 */
export function findAdjacentPointsInChain(boardState: BoardState, x: number, y: number) {
  const checkedPoints: PointState[] = [];
  const adjacentPoints: PointState[] = [boardState.board[x][y]];
  const pointsToCheckNeighbors: PointState[] = [boardState.board[x][y]];

  while (pointsToCheckNeighbors.length) {
    const currentPoint = pointsToCheckNeighbors.pop();
    if (!currentPoint) {
      break;
    }

    checkedPoints.push(currentPoint);
    const neighbors = findNeighbors(boardState, currentPoint.x, currentPoint.y);

    [neighbors.north, neighbors.east, neighbors.south, neighbors.west]
      .filter(isNotNull)
      .filter(isDefined)
      .forEach((neighbor) => {
        if (neighbor && neighbor.player === currentPoint.player && !contains(checkedPoints, neighbor)) {
          adjacentPoints.push(neighbor);
          pointsToCheckNeighbors.push(neighbor);
        }
        checkedPoints.push(neighbor);
      });
  }

  return adjacentPoints;
}

/**
 * Finds all empty spaces on the board.
 */
export function getEmptySpaces(boardState: BoardState): PointState[] {
  return boardState.board.reduce(
    (emptySpaces, _, x) =>
      emptySpaces.concat(boardState.board[x].filter((_, y) => boardState.board[x][y].player === playerColors.empty)),
    [],
  );
}

/**
 * Makes a deep copy of the given board state
 */
export function getStateCopy(initialState: BoardState) {
  const boardState = cloneDeep(initialState);

  boardState.history = [...initialState.history];
  boardState.previousPlayer = initialState.previousPlayer;
  boardState.ai = initialState.ai;
  boardState.passCount = initialState.passCount;

  return boardState;
}

/**
 * Makes a deep copy of the given BoardState's board
 */
export function getBoardCopy(boardState: BoardState) {
  const boardCopy = getNewBoardState(boardState.board[0].length);
  const board = boardState.board;

  for (let x = 0; x < board.length; x++) {
    for (let y = 0; y < board[x].length; y++) {
      boardCopy.board[x][y].player = board[x][y].player;
    }
  }

  return boardCopy;
}

export function contains(arr: PointState[], point: PointState) {
  return !!arr.find((p) => p && p.x === point.x && p.y === point.y);
}

export function findNeighbors(boardState: BoardState, x: number, y: number): Neighbor {
  const board = boardState.board;
  return {
    north: board[x]?.[y + 1],
    east: board[x + 1]?.[y],
    south: board[x]?.[y - 1],
    west: board[x - 1]?.[y],
  };
}

export function getArrayFromNeighbor(neighborObject: Neighbor): PointState[] {
  return [neighborObject.north, neighborObject.east, neighborObject.south, neighborObject.west]
    .filter(isNotNull)
    .filter(isDefined);
}

export function isNotNull<T>(argument: T | null): argument is T {
  return argument !== null;
}
export function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined;
}

export function floor(n: number) {
  return ~~n;
}
export function ceil(n: number) {
  const floored = floor(n);
  return floored === n ? n : floored + 1;
}