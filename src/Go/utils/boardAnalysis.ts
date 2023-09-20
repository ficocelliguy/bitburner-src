import { BoardState, playerColors, PointState } from "./goConstants";
import { findNeighbors, getAllChains, getArrayFromNeighbor, mergeNewItems } from "./boardState";

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
  const claimedPoints = eyes
    .filter((eyesForChainN) => eyesForChainN.length >= 2)
    .flat()
    .flat();
  return claimedPoints;
}

export function getPlayerNeighbors(boardState: BoardState, chain: PointState[]) {
  return chain.reduce((chainNeighbors: PointState[], point: PointState) => {
    const playerNeighbors = getArrayFromNeighbor(findNeighbors(boardState, point.x, point.y)).filter(
      (neighbor) => neighbor && neighbor.player !== playerColors.empty,
    );
    return mergeNewItems(chainNeighbors, playerNeighbors);
  }, []);
}
