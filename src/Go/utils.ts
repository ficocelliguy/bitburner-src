import { Neighbor, PlayerColor, playerColors, PointState } from "./types";

export function updateChains(initialState: PointState[][], playerWhoMoved: PlayerColor): PointState[][] {
  const boardState = [...clearChains(initialState)];
  const chains = [];
  let chainNumber = 0;

  for (let x = 0; x < boardState.length; x++) {
    for (let y = 0; y < boardState[x].length; y++) {
      const point = boardState[x][y];
      if (point.chain) {
        continue;
      }

      const chainMembers = findAdjacentPointsInChain(boardState, x, y);
      const liberties = chainMembers.reduce((liberties: PointState[], member: PointState) => {
        const libertiesObject = findAdjacentLibertiesForPoint(boardState, member.x, member.y);
        const newLiberties = getArrayFromNeighbor(libertiesObject);
        return mergeNewItems(liberties, newLiberties);
      }, []);

      chainMembers.forEach((member) => {
        member.chain = chainNumber;
        member.liberties = liberties;
      });
      chains[chainNumber] = chainMembers;

      chainNumber++;
    }
  }

  const opposingPlayer = playerWhoMoved === playerColors.white ? playerColors.black : playerColors.white;
  const enemyChainToCapture = findChainToCapture(chains, opposingPlayer);

  if (enemyChainToCapture) {
    captureChain(enemyChainToCapture);
    return updateChains(boardState, playerWhoMoved);
  }

  const friendlyChainToCapture = findChainToCapture(chains, playerWhoMoved);
  if (friendlyChainToCapture) {
    captureChain(friendlyChainToCapture);
    return updateChains(boardState, playerWhoMoved);
  }

  return boardState;
}

function findChainToCapture(chainList: PointState[][], playerColor: PlayerColor) {
  return chainList.find(
    (chain) =>
      chain[0].player !== playerColor && chain[0].player !== playerColors.empty && chain[0].liberties?.length === 0,
  );
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

export function contains(arr: PointState[], point: PointState) {
  return !!arr.find((p) => p && p.x === point.x && p.y === point.y);
}

function mergeNewItems(arr: PointState[], arr2: PointState[]) {
  return arr.concat(arr2.filter((item) => item && !contains(arr, item)));
}

export function findNeighbors(board: PointState[][], x: number, y: number): Neighbor {
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

function isNotNull<T>(argument: T | null): argument is T {
  return argument !== null;
}

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

export function findAdjacentLibertiesAndAlliesForPoint(board: PointState[][], x: number, y: number): Neighbor {
  const currentPoint = board[x][y];
  const player = currentPoint.player;
  const opposingPlayer = currentPoint.player === playerColors.white ? playerColors.black : playerColors.white;
  const neighbors = findNeighbors(board, x, y);

  const hasNorthLiberty = player !== playerColors.empty && neighbors.north && neighbors.north.player !== opposingPlayer;
  const hasEastLiberty = player !== playerColors.empty && neighbors.east && neighbors.east.player !== opposingPlayer;
  const hasSouthLiberty = player !== playerColors.empty && neighbors.south && neighbors.south.player !== opposingPlayer;
  const hasWestLiberty = player !== playerColors.empty && neighbors.west && neighbors.west.player !== opposingPlayer;

  return {
    north: hasNorthLiberty ? neighbors.north : null,
    east: hasEastLiberty ? neighbors.east : null,
    south: hasSouthLiberty ? neighbors.south : null,
    west: hasWestLiberty ? neighbors.west : null,
  };
}
