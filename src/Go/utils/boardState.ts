import { BoardState, Move, Neighbor, PlayerColor, playerColors, PointState, validityReason } from "./goConstants";
import { getExpansionMoveArray } from "./goAI";

export function getNewBoardState(boardSize: number): BoardState {
  return {
    history: [],
    previousPlayer: playerColors.white,
    board: Array.from({ length: boardSize }, (_, x) =>
      Array.from({ length: boardSize }, (_, y) => ({
        player: playerColors.empty,
        chain: null,
        liberties: null,
        x,
        y,
      })),
    ),
  };
}

export function applyHandicap(boardSize: number, handicap: number) {
  const newBoard = getNewBoardState(boardSize);
  const handicapMoves = getExpansionMoveArray(newBoard, playerColors.white, handicap);

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

export function evaluateIfMoveIsValid(initialState: BoardState, x: number, y: number, player: PlayerColor) {
  const point = initialState.board[x][y];

  if (!point || point.player !== playerColors.empty) {
    console.warn(`Invalid move attempted! ${x} ${y} ${player}`);
    return validityReason.pointNotEmpty;
  }

  const boardState = getStateCopy(initialState);
  boardState.history.push(getBoardCopy(boardState).board);
  boardState.board[x][y].player = player;
  boardState.previousPlayer = player;
  const updatedBoardState = updateCaptures(boardState, player);

  if (updatedBoardState.board[x][y].player !== player) {
    return validityReason.noSuicide;
  }

  if (checkIfBoardStateIsRepeated(updatedBoardState)) {
    return validityReason.boardRepeated;
  }

  return validityReason.valid;
}

export function updateChains(boardState: BoardState) {
  boardState.board = clearChains(getBoardCopy(boardState)).board;
  const chains = [];
  let chainID = 0;

  for (let x = 0; x < boardState.board.length; x++) {
    for (let y = 0; y < boardState.board[x].length; y++) {
      const point = boardState.board[x][y];
      // If the current point is already analyzed, skip it
      if (point.chain !== null) {
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

function checkIfBoardStateIsRepeated(boardState: BoardState) {
  const currentBoard = boardState.board;
  return boardState.history.slice(-4).find((state) => {
    for (let x = 0; x < state.length; x++) {
      for (let y = 0; y < state[x].length; y++) {
        if (currentBoard[x][y].player !== state[x][y].player) {
          return false;
        }
      }
    }
    return true;
  });
}

export function getAllChains(boardState: BoardState): PointState[][] {
  const chains: PointState[][] = [];

  for (let x = 0; x < boardState.board.length; x++) {
    for (let y = 0; y < boardState.board[x].length; y++) {
      const point = boardState.board[x][y];
      // If the current chain is already analyzed, skip it
      if (point.chain === null || chains[point.chain]) {
        continue;
      }

      chains[point.chain] = findAdjacentPointsInChain(boardState, x, y);
    }
  }

  return chains;
}

function findAnyCapturedChain(chainList: PointState[][], playerWhoMoved: PlayerColor) {
  const opposingPlayer = playerWhoMoved === playerColors.white ? playerColors.black : playerColors.white;
  const enemyChainToCapture = findCapturedChainOfColor(chainList, opposingPlayer);

  if (enemyChainToCapture) {
    return enemyChainToCapture;
  }

  const friendlyChainToCapture = findCapturedChainOfColor(chainList, playerWhoMoved);
  if (friendlyChainToCapture) {
    return friendlyChainToCapture;
  }
}

function findCapturedChainOfColor(chainList: PointState[][], playerColor: PlayerColor) {
  return chainList.find((chain) => chain?.[0].player === playerColor && chain?.[0].liberties?.length === 0);
}
function captureChain(chain: PointState[]) {
  chain.forEach((point) => {
    point.player = playerColors.empty;
  });
}

function clearChains(boardState: BoardState): BoardState {
  for (const x in boardState.board) {
    for (const y in boardState.board[x]) {
      boardState.board[x][y].chain = null;
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

function findLibertiesForChain(boardState: BoardState, chain: PointState[]): PointState[] {
  return chain.reduce((liberties: PointState[], member: PointState) => {
    const libertiesObject = findAdjacentLibertiesForPoint(boardState, member.x, member.y);
    const newLiberties = getArrayFromNeighbor(libertiesObject);
    return mergeNewItems(liberties, newLiberties);
  }, []);
}

export function findChainLibertiesForPoint(boardState: BoardState, x: number, y: number): PointState[] {
  const chain = findAdjacentPointsInChain(boardState, x, y);
  return findLibertiesForChain(boardState, chain);
}

/**
 * Returns an object that includes which of the cardinal neighbors are empty
 * (adjacent 'liberties' of the current piece )
 */
export function findAdjacentLibertiesForPoint(boardState: BoardState, x: number, y: number): Neighbor {
  const currentPoint = boardState.board[x][y];
  const player = currentPoint.player;
  const neighbors = findNeighbors(boardState, x, y);

  const hasNorthLiberty =
    player !== playerColors.empty && neighbors.north && neighbors.north.player === playerColors.empty;
  const hasEastLiberty =
    player !== playerColors.empty && neighbors.east && neighbors.east.player === playerColors.empty;
  const hasSouthLiberty =
    player !== playerColors.empty && neighbors.south && neighbors.south.player === playerColors.empty;
  const hasWestLiberty =
    player !== playerColors.empty && neighbors.west && neighbors.west.player === playerColors.empty;

  return {
    north: hasNorthLiberty ? neighbors.north : null,
    east: hasEastLiberty ? neighbors.east : null,
    south: hasSouthLiberty ? neighbors.south : null,
    west: hasWestLiberty ? neighbors.west : null,
  };
}

/**
 * Returns an object that includes which of the cardinal neighbors are either empty or contain the
 * current player's pieces. Used for making the connection map on the board
 */
export function findAdjacentLibertiesAndAlliesForPoint(boardState: BoardState, x: number, y: number): Neighbor {
  const currentPoint = boardState.board[x][y];
  const player = currentPoint.player === playerColors.empty ? undefined : currentPoint.player;
  const adjacentLiberties = findAdjacentLibertiesForPoint(boardState, x, y);
  const neighbors = findNeighbors(boardState, x, y);

  return {
    north: adjacentLiberties.north || neighbors.north?.player === player ? neighbors.north : null,
    east: adjacentLiberties.east || neighbors.east?.player === player ? neighbors.east : null,
    south: adjacentLiberties.south || neighbors.south?.player === player ? neighbors.south : null,
    west: adjacentLiberties.west || neighbors.west?.player === player ? neighbors.west : null,
  };
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

export function mergeNewItems(arr: PointState[], arr2: PointState[]) {
  return arr.concat(arr2.filter((item) => item && !contains(arr, item)));
}

export function findNeighbors(boardState: BoardState, x: number, y: number): Neighbor {
  const board = boardState.board;
  return {
    north: board[x - 1]?.[y],
    east: board[x][y + 1],
    south: board[x + 1]?.[y],
    west: board[x][y - 1],
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
