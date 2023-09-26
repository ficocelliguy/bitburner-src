import { Board, BoardState, Neighbor, PlayerColor, playerColors, PointState, validityReason } from "./goConstants";
import {
  findAdjacentPointsInChain,
  findNeighbors,
  getArrayFromNeighbor,
  getBoardCopy,
  getEmptySpaces,
  getStateCopy,
  isDefined,
  updateCaptures,
  updateChains,
} from "./boardState";

export function evaluateIfMoveIsValid(initialState: BoardState, x: number, y: number, player: PlayerColor) {
  const point = initialState.board?.[x]?.[y];

  if (initialState.previousPlayer === player) {
    console.warn(`Invalid move attempted! ${x} ${y} ${player}`);
    return validityReason.notYourTurn;
  }

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

export function getAllUnclaimedTerritory(boardState: BoardState) {
  const claimedTerritory = findClaimedTerritory(boardState);
  const emptySpaces = getEmptySpaces(boardState);
  return emptySpaces.filter(
    (point) => !claimedTerritory.find((claimedPoint) => claimedPoint.x === point.x && claimedPoint.y === point.y),
  );
}

/*
  Find all empty point groups where either:
  * all of its immediate surrounding player-controlled points are in the same continuous chain, or
  * it is completely surrounded by some single larger chain and the edge of the board

  Eyes are important because a chain of pieces cannot be captured if it contains two or more eyes within it.
 */
export function getAllEyes(boardState: BoardState) {
  const allChains = getAllChains(boardState);
  const eyeCandidates = getAllPotentialEyes(boardState, allChains);
  const eyes: PointState[][][] = Array.from(new Array(boardState.board[0].length ** 2), () => []);

  eyeCandidates.forEach((neighborChainList, index) => {
    const candidateChain = allChains[index];
    if (neighborChainList.length === 0) {
      return;
    }

    // If only one chain surrounds the empty space, it is a true eye
    if (neighborChainList.length === 1) {
      const neighborChainNumber = neighborChainList[0][0].chain;
      eyes[neighborChainNumber].push(candidateChain);
      return;
    }

    // If any chain fully encircles the empty space (even if there are other chains encircled as well), the eye is true
    const neighborsEncirclingEye = findNeighboringChainsThatFullyEncircleEmptySpace(
      boardState,
      candidateChain,
      neighborChainList,
      allChains,
    );
    neighborsEncirclingEye.forEach((neighborChain) => {
      const neighborChainNumber = neighborChain[0].chain;
      eyes[neighborChainNumber].push(candidateChain);
    });
  });

  return eyes;
}

/*
  Find all empty spaces completely surrounded by a single player color.
  For each player chain number, add any empty space chains that are completely surrounded by a single player's color to
   an array at that chain number's index.
 */
function getAllPotentialEyes(boardState: BoardState, allChains: PointState[][]) {
  const emptyPointChains = allChains.filter((chain) => chain[0].player === playerColors.empty);
  const eyeCandidates: PointState[][][] = Array.from(new Array(boardState.board[0].length ** 2), () => []);

  emptyPointChains
    .filter((chain) => chain.length < 9)
    .forEach((chain) => {
      const neighboringChains = getAllNeighboringChains(boardState, chain, allChains);

      const hasWhitePieceNeighbor = neighboringChains.find(
        (neighborChain) => neighborChain[0]?.player === playerColors.white,
      );
      const hasBlackPieceNeighbor = neighboringChains.find(
        (neighborChain) => neighborChain[0]?.player === playerColors.black,
      );

      // Record the neighbor chains of the eye candidate empty chain, if all of its neighbors are the same color piece
      if ((hasWhitePieceNeighbor && !hasBlackPieceNeighbor) || (!hasWhitePieceNeighbor && hasBlackPieceNeighbor)) {
        eyeCandidates[chain[0].chain] = neighboringChains;
      }
    });

  return eyeCandidates;
}

/**
 *  For each chain bordering an eye candidate:
 *    remove all other neighboring chains. (replace with empty points)
 *    check if the eye candidate is a simple true eye now
 *       If so, the original candidate is a true eye.
 */
function findNeighboringChainsThatFullyEncircleEmptySpace(
  boardState: BoardState,
  candidateChain: PointState[],
  neighborChainList: PointState[][],
  allChains: PointState[][],
) {
  return neighborChainList.filter((neighborChain, index) => {
    const evaluationBoard = getStateCopy(boardState);
    const examplePoint = candidateChain[0];
    const otherChainNeighborPoints = removePointAtIndex(neighborChainList, index).flat();
    otherChainNeighborPoints.forEach((point) => (evaluationBoard.board[point.x][point.y].player = playerColors.empty));
    const updatedBoard = updateChains(evaluationBoard);
    const newChains = getAllChains(updatedBoard);
    const newChainNumber = updatedBoard.board[examplePoint.x][examplePoint.y].chain;
    const newNeighborChains = getAllNeighboringChains(boardState, newChains[newChainNumber], allChains);

    return newNeighborChains.length === 1;
  });
}

function removePointAtIndex(arr: PointState[][], index: number) {
  const newArr = [...arr];
  newArr.splice(index, 1);
  return newArr;
}

function getAllNeighboringChains(boardState: BoardState, chain: PointState[], allChains: PointState[][]) {
  const playerNeighbors = getPlayerNeighbors(boardState, chain);

  const neighboringChains = playerNeighbors.reduce(
    (neighborChains, neighbor) => neighborChains.add(allChains[neighbor.chain]),
    new Set<PointState[]>(),
  );

  return [...neighboringChains];
}

// If a group of stones has more than one empty holes that it completely surrounds, it cannot be captured, because white can
// only play one stone at a time.
// Thus, the empty space of those holes is firmly claimed by the player surrounding them, and it can be ignored as a play area
// Once all points are either stones or claimed territory in this way, the game is over
export function findClaimedTerritory(boardState: BoardState) {
  const eyes = getAllEyes(boardState);
  const claimedPoints = eyes.filter((eyesForChainN) => eyesForChainN.length >= 2);
  return claimedPoints.flat().flat();
}

export function getPlayerNeighbors(boardState: BoardState, chain: PointState[]) {
  return getAllNeighbors(boardState, chain).filter((neighbor) => neighbor && neighbor.player !== playerColors.empty);
}

export function getAllNeighbors(boardState: BoardState, chain: PointState[]) {
  const allNeighbors = chain.reduce((chainNeighbors: Set<PointState>, point: PointState) => {
    getArrayFromNeighbor(findNeighbors(boardState, point.x, point.y))
      .filter(isDefined)
      .filter((neighborPoint) => !isPointInChain(neighborPoint, chain))
      .forEach((neighborPoint) => chainNeighbors.add(neighborPoint));
    return chainNeighbors;
  }, new Set<PointState>());
  return [...allNeighbors];
}

function isPointInChain(point: PointState, chain: PointState[]) {
  return !!chain.find((chainPoint) => chainPoint.x === point.x && chainPoint.y === point.y);
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
      if (point.chain === -1 || chains[point.chain]) {
        continue;
      }

      chains[point.chain] = findAdjacentPointsInChain(boardState, x, y);
    }
  }

  return chains;
}

export function findAnyCapturedChain(chainList: PointState[][], playerWhoMoved: PlayerColor) {
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

export function findLibertiesForChain(boardState: BoardState, chain: PointState[]): PointState[] {
  return getAllNeighbors(boardState, chain).filter((neighbor) => neighbor && neighbor.player === playerColors.empty);
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

/**
 * Retrieves a simplified version of the board state. "X" represents black pieces, "O" white, and "." empty points.
 *
 * For example, a 5x5 board might look like this:
 * ```
 * [
 *   "XX.O.",
 *   "X..OO",
 *   ".XO..",
 *   "XXO..",
 *   ".XOO.",
 * ]
 * ```
 *
 * Each string represents a vertical column on the board, and each character in the string represents a point.
 *
 * Traditional notation for Go is e.g. "B,1" referring to second ("B") column, first rank. This is the equivalent of index [1][0].
 *
 * Note that the [0][0] point is shown on the bottom-left on the visual board (as is traditional), and each
 * string represents a vertical column on the board. In other words, the printed example above can be understood to
 * be rotated 90 degrees clockwise compared to the board UI.
 *
 */
export function getSimplifiedBoardState(board: Board): string[] {
  return board.map((column) =>
    column.reduce((str, point) => {
      const currentPointState =
        point.player === playerColors.black ? "X" : point.player === playerColors.white ? "O" : ".";
      return str + currentPointState;
    }, ""),
  );
}
