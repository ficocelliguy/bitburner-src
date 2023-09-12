import { Neighbor, PlayerColor, playerColors, PointState } from "../types";

/**
 * Make a new move on the given board, and update the board state accordingly
 */
export function makeMove(boardState: PointState[][], x: number, y: number, player: PlayerColor) {
  const point = boardState[x][y];

  // Do not update on invalid moves
  if (!point || point.player !== playerColors.empty) {
    console.warn(`Invalid move attempted! ${x} ${y} ${player}`);
    return false;
  }

  boardState[x][y].player = player;
  return boardState;
}

export function getEmptySpaces(boardState: PointState[][]): PointState[] {
  return boardState.reduce(
    (emptySpaces, _, x) =>
      emptySpaces.concat(boardState[x].filter((_, y) => boardState[x][y].player === playerColors.empty)),
    [],
  );
}

export function getStateClone(boardState: PointState[][]) {
  return JSON.parse(JSON.stringify(boardState));
}

/**
 * Assign each point on the board a chain ID, and link its list of 'liberties' (which are empty spaces
 * adjacent to some point on the chain including the current point).
 */
export function updateCaptures(initialState: PointState[][], playerWhoMoved: PlayerColor): PointState[][] {
  const boardState = clearChains(getStateClone(initialState));
  const chains = [];
  let chainID = 0;

  for (let x = 0; x < boardState.length; x++) {
    for (let y = 0; y < boardState[x].length; y++) {
      const point = boardState[x][y];
      // If the current point is already analyzed, skip it
      if (point.chain) {
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
  const chainToCapture = findAnyCapturedChain(chains, playerWhoMoved);
  if (chainToCapture) {
    captureChain(chainToCapture);
    return updateCaptures(boardState, playerWhoMoved);
  }

  return boardState;
}

export function findAllChains(boardState: PointState[][]): PointState[][] {
  const chains: PointState[][] = [];

  for (let x = 0; x < boardState.length; x++) {
    for (let y = 0; y < boardState[x].length; y++) {
      const point = boardState[x][y];
      // If the current chain is already analyzed, skip it
      if (!point.chain || chains[point.chain]) {
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
  return chainList.find((chain) => chain[0].player === playerColor && chain[0].liberties?.length === 0);
}
function captureChain(chain: PointState[]) {
  chain.forEach((point) => {
    point.player = playerColors.empty;
  });
}

function clearChains(boardState: PointState[][]): PointState[][] {
  for (const x in boardState) {
    for (const y in boardState[x]) {
      boardState[x][y].chain = null;
      boardState[x][y].liberties = null;
    }
  }
  return boardState;
}

/**
 * Finds all the pieces in the current clump, or 'chain'
 *
 * Recursively traverse the adjacent pieces of the same color to find all the pieces in the same chain,
 * which are the pieces connected directly via a path consisting only of only up/down/left/right
 */
export function findAdjacentPointsInChain(
  board: PointState[][],
  x: number,
  y: number,
  checkedNeighbors: PointState[] = [],
): PointState[] {
  const neighbors = findNeighbors(board, x, y);
  const currentPoint = board[x][y];
  if (contains(checkedNeighbors, currentPoint)) {
    return checkedNeighbors;
  }

  let priorNeighbors = [...checkedNeighbors];
  priorNeighbors.push(currentPoint);

  [neighbors.north, neighbors.east, neighbors.south, neighbors.west].forEach((neighbor) => {
    if (neighbor && neighbor.player === currentPoint.player && !contains(priorNeighbors, neighbor)) {
      priorNeighbors = mergeNewItems(
        priorNeighbors,
        findAdjacentPointsInChain(board, neighbor.x, neighbor.y, priorNeighbors),
      );
    }
  });

  return priorNeighbors;
}

function findLibertiesForChain(boardState: PointState[][], chain: PointState[]) {
  return chain.reduce((liberties: PointState[], member: PointState) => {
    const libertiesObject = findAdjacentLibertiesForPoint(boardState, member.x, member.y);
    const newLiberties = getArrayFromNeighbor(libertiesObject);
    return mergeNewItems(liberties, newLiberties);
  }, []);
}

/**
 * Returns an object that includes which of the cardinal neighbors are empty
 * (adjacent 'liberties' of the current piece )
 */
export function findAdjacentLibertiesForPoint(board: PointState[][], x: number, y: number): Neighbor {
  const currentPoint = board[x][y];
  const player = currentPoint.player;
  const neighbors = findNeighbors(board, x, y);

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
export function findAdjacentLibertiesAndAlliesForPoint(board: PointState[][], x: number, y: number): Neighbor {
  const currentPoint = board[x][y];
  const player = currentPoint.player === playerColors.empty ? undefined : currentPoint.player;
  const adjacentLiberties = findAdjacentLibertiesForPoint(board, x, y);
  const neighbors = findNeighbors(board, x, y);

  return {
    north: adjacentLiberties.north || neighbors.north?.player === player ? neighbors.north : null,
    east: adjacentLiberties.east || neighbors.east?.player === player ? neighbors.east : null,
    south: adjacentLiberties.south || neighbors.south?.player === player ? neighbors.south : null,
    west: adjacentLiberties.west || neighbors.west?.player === player ? neighbors.west : null,
  };
}

function contains(arr: PointState[], point: PointState) {
  return !!arr.find((p) => p && p.x === point.x && p.y === point.y);
}

function mergeNewItems(arr: PointState[], arr2: PointState[]) {
  return arr.concat(arr2.filter((item) => item && !contains(arr, item)));
}

function findNeighbors(board: PointState[][], x: number, y: number): Neighbor {
  return {
    north: board[x - 1]?.[y],
    east: board[x][y + 1],
    south: board[x + 1]?.[y],
    west: board[x][y - 1],
  };
}

function getArrayFromNeighbor(neighborObject: Neighbor): PointState[] {
  return [neighborObject.north, neighborObject.east, neighborObject.south, neighborObject.west].filter(isNotNull);
}

function isNotNull<T>(argument: T | null): argument is T {
  return argument !== null;
}
