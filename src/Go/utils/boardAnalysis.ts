import { Board, BoardState, Neighbor, PlayerColor, playerColors, PointState, validityReason } from "./goConstants";
import {
  findAdjacentPointsInChain,
  findNeighbors,
  getArrayFromNeighbor,
  getBoardCopy,
  getStateCopy,
  mergeNewItems,
  updateCaptures,
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

// Find all empty point groups where all of its surrounding player points are in the same continuous chain
export function findAllEyes(boardState: BoardState) {
  const emptyPointChains = getAllChains(boardState).filter((chain) => chain[0].player === playerColors.empty);
  const eyes: PointState[][][] = new Array(boardState.board[0].length).fill([]);

  emptyPointChains
    .filter((chain) => chain.length < 9)
    .forEach((chain) => {
      const playerNeighbors = getPlayerNeighbors(boardState, chain);
      // If all of playerNeighbors is from one chain, `chain` is an eye for that player chain
      const neighboringChains = playerNeighbors.reduce(
        (neighborChains, neighbor) => neighborChains.add(neighbor.chain),
        new Set(),
      );
      if (neighboringChains.size === 1) {
        const chainNumber = neighboringChains.values().next().value;
        eyes[chainNumber].push(chain);
      }
    });

  return eyes;
}

// If a group of stones has more than one empty holes that it completely surrounds, it cannot be captured, because white can
// only play one stone at a time.
// Thus, the empty space of those holes is firmly claimed by the player surrounding them, and it can be ignored as a play area
// Once all points are either stones or claimed territory in this way, the game is over
export function findClaimedTerritory(boardState: BoardState) {
  const eyes = findAllEyes(boardState);
  const claimedPoints = eyes.filter((eyesForChainN) => eyesForChainN.length >= 2);
  return claimedPoints.flat().flat();
}

export function getPlayerNeighbors(boardState: BoardState, chain: PointState[]) {
  return chain.reduce((chainNeighbors: PointState[], point: PointState) => {
    const playerNeighbors = getArrayFromNeighbor(findNeighbors(boardState, point.x, point.y)).filter(
      (neighbor) => neighbor && neighbor.player !== playerColors.empty,
    );
    return mergeNewItems(chainNeighbors, playerNeighbors);
  }, []);
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

// TODO: does this need to be simplified?
export function findLibertiesForChain(boardState: BoardState, chain: PointState[]): PointState[] {
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
