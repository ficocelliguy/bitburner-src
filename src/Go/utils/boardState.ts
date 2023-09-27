import {
  BoardState,
  Move,
  Neighbor,
  opponents,
  PlayerColor,
  playerColors,
  PointState,
  validityReason,
} from "./goConstants";
import { getExpansionMoveArray } from "./goAI";
import { evaluateIfMoveIsValid, findAnyCapturedChain, findLibertiesForChain, getAllChains } from "./boardAnalysis";
import { Player } from "@player";
import { getScore } from "./scoring";

export function getNewBoardState(boardSize: number, ai?: opponents): BoardState {
  return {
    history: [],
    previousPlayer: playerColors.white,
    ai: ai ?? opponents.Daedalus,
    board: Array.from({ length: boardSize }, (_, x) =>
      Array.from({ length: boardSize }, (_, y) => ({
        player: playerColors.empty,
        chain: -1,
        liberties: null,
        x,
        y,
      })),
    ),
  };
}

export function endGoGame(boardState: BoardState) {
  boardState.previousPlayer = null;
  const statusToUpdate = Player.go.status[boardState.ai];
  const score = getScore(boardState);

  if (score[playerColors.black].sum > score[playerColors.white].sum) {
    statusToUpdate.wins++;
  } else {
    statusToUpdate.losses++;
  }

  statusToUpdate.nodes += score[playerColors.black].sum;
}

export function applyHandicap(boardSize: number, handicap: number) {
  const newBoard = getNewBoardState(boardSize);
  const availableMoves = getEmptySpaces(newBoard);
  const handicapMoves = getExpansionMoveArray(newBoard, playerColors.black, availableMoves, handicap);

  handicapMoves.forEach(
    (move: Move) => move.point && (newBoard.board[move.point.x][move.point.y].player = playerColors.white),
  );
  return newBoard;
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

  if (evaluateCaptures) {
    return updateCaptures(boardState, player);
  }

  return boardState;
}

export function updateChains(boardState: BoardState) {
  boardState.board = clearChains(getBoardCopy(boardState)).board;
  const chains = [];
  let chainID = 0;

  for (let x = 0; x < boardState.board.length; x++) {
    for (let y = 0; y < boardState.board[x].length; y++) {
      const point = boardState.board[x][y];
      // If the current point is already analyzed, skip it
      if (point.chain !== -1) {
        continue;
      }

      const chainMembers = findAdjacentPointsInChain(boardState, x, y);
      const libertiesForChain = findLibertiesForChain(boardState, chainMembers);

      chainMembers.forEach((member) => {
        member.chain = chainID;
        member.liberties = libertiesForChain;
      });
      chains[chainID] = chainMembers;

      chainID++;
    }
  }

  return boardState;
}

/**
 * Assign each point on the board a chain ID, and link its list of 'liberties' (which are empty spaces
 * adjacent to some point on the chain including the current point).
 */
export function updateCaptures(initialState: BoardState, playerWhoMoved: PlayerColor): BoardState {
  const boardState = updateChains(initialState);
  const chains = getAllChains(boardState);

  const chainToCapture = findAnyCapturedChain(chains, playerWhoMoved);
  if (chainToCapture) {
    captureChain(chainToCapture);
    return updateCaptures(boardState, playerWhoMoved);
  }

  return boardState;
}

function captureChain(chain: PointState[]) {
  chain.forEach((point) => {
    point.player = playerColors.empty;
  });
}

function clearChains(boardState: BoardState): BoardState {
  for (const x in boardState.board) {
    for (const y in boardState.board[x]) {
      boardState.board[x][y].chain = -1;
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

export function getEmptySpaces(boardState: BoardState): PointState[] {
  return boardState.board.reduce(
    (emptySpaces, _, x) =>
      emptySpaces.concat(boardState.board[x].filter((_, y) => boardState.board[x][y].player === playerColors.empty)),
    [],
  );
}

export function getStateCopy(initialState: BoardState) {
  const boardState = updateChains(getBoardCopy(initialState));

  boardState.history = [...initialState.history];
  boardState.previousPlayer = initialState.previousPlayer;
  boardState.ai = initialState.ai;

  return boardState;
}

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

function contains(arr: PointState[], point: PointState) {
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
  return [neighborObject.north, neighborObject.east, neighborObject.south, neighborObject.west].filter(isNotNull);
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
