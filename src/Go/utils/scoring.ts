import { BoardState, PlayerColor, playerColors, PointState } from "../goConstants";
import { findNeighbors, getAllChains, getArrayFromNeighbor, mergeNewItems } from "./boardState";

export function getScore(boardState: BoardState, komi: number) {
  const whitePieces = getColoredPieceCount(boardState, playerColors.white);
  const blackPieces = getColoredPieceCount(boardState, playerColors.black);
  const territoryScores = getTerritoryScores(boardState);

  return {
    [playerColors.white]: {
      pieces: whitePieces,
      territory: territoryScores[playerColors.white],
      komi: komi,
      sum: whitePieces + territoryScores[playerColors.white] + komi,
    },
    [playerColors.black]: {
      pieces: blackPieces,
      territory: territoryScores[playerColors.black],
      komi: 0,
      sum: blackPieces + territoryScores[playerColors.black],
    },
  };
}

function getColoredPieceCount(boardState: BoardState, color: PlayerColor) {
  return boardState.board.reduce((sum, row) => sum + row.filter((point) => point.player === color).length, 0);
}

function getTerritoryScores(boardState: BoardState) {
  const emptyTerritoryChains = getAllChains(boardState).filter((chain) => chain?.[0]?.player === playerColors.empty);

  return emptyTerritoryChains.reduce(
    (scores, currentChain) => {
      const chainColor = checkTerritoryOwnership(boardState, currentChain);
      return {
        [playerColors.white]:
          scores[playerColors.white] + (chainColor === playerColors.white ? currentChain.length : 0),
        [playerColors.black]:
          scores[playerColors.black] + (chainColor === playerColors.black ? currentChain.length : 0),
      };
    },
    {
      [playerColors.white]: 0,
      [playerColors.black]: 0,
    },
  );
}

function checkTerritoryOwnership(boardState: BoardState, emptyPointChain: PointState[]) {
  if (emptyPointChain.length > boardState.board[0].length ** 2 - 3) {
    return null;
  }

  const playerNeighbors = emptyPointChain.reduce((chainNeighbors: PointState[], point: PointState) => {
    const playerNeighbors = getArrayFromNeighbor(findNeighbors(boardState, point.x, point.y)).filter(
      (neighbor) => neighbor && neighbor.player !== playerColors.empty,
    );
    return mergeNewItems(chainNeighbors, playerNeighbors);
  }, []);
  const hasWhitePieceNeighbors = playerNeighbors.find((p) => p.player === playerColors.white);
  const hasBlackPieceNeighbors = playerNeighbors.find((p) => p.player === playerColors.black);
  const isWhiteTerritory = hasWhitePieceNeighbors && !hasBlackPieceNeighbors;
  const isBlackTerritory = hasBlackPieceNeighbors && !hasWhitePieceNeighbors;
  return isWhiteTerritory ? playerColors.white : isBlackTerritory ? playerColors.black : null;
}

export function logBoard(boardState: BoardState): void {
  const state = boardState.board;
  console.log("--------------");
  for (let x = 0; x < state.length; x++) {
    let output = `${x}: `;
    for (let y = 0; y < state[x].length; y++) {
      const point = state[x][y];
      output += ` ${point.liberties?.length ?? 0}`;
    }
    console.log(output);
  }
}