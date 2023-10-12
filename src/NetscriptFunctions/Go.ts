import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import { getNewBoardState, getStateCopy, makeMove, passTurn, resetWinstreak } from "../Go/boardState/boardState";
import {
  BoardState,
  columnIndexes,
  opponents,
  Play,
  playerColors,
  playTypes,
  validityReason,
} from "../Go/boardState/goConstants";
import { getMove } from "../Go/boardAnalysis/goAI";
import { evaluateIfMoveIsValid, getSimplifiedBoardState } from "../Go/boardAnalysis/boardAnalysis";
import { Go } from "@nsdefs";

async function getAIMove(ctx: NetscriptContext, boardState: BoardState, traditionalNotation: boolean): Promise<Play> {
  let resolve: (value: Play) => void;
  const aiMoveResult = new Promise<Play>((res) => (resolve = res));

  getMove(boardState, playerColors.white, Player.go.boardState.ai).then(async (result) => {
    if (result.type !== playTypes.move) {
      Player.go.boardState = boardState;
      return result;
    }

    const aiUpdatedBoard = makeMove(boardState, result.x, result.y, playerColors.white);
    if (!aiUpdatedBoard) {
      boardState.previousPlayer = playerColors.white;
      Player.go.boardState = boardState;
      helpers.log(ctx, () => `Invalid AI move attempted: ${result.x}, ${result.y}`);
    } else {
      Player.go.boardState = aiUpdatedBoard;
      helpers.log(ctx, () => `Opponent played move: ${result.x}, ${result.y}`);
    }

    const xResultIndex = traditionalNotation ? columnIndexes[result.x] : result.x;
    const yResultIndex = traditionalNotation ? result.y + 1 : result.y;

    await sleep(200);
    resolve({ type: playTypes.move, x: xResultIndex, y: yResultIndex });
  });
  return aiMoveResult;
}

async function makePlayerMove(ctx: NetscriptContext, x: number, y: number, traditional: boolean) {
  const validity = evaluateIfMoveIsValid(Player.go.boardState, x, y, playerColors.black);

  if (validity !== validityReason.valid) {
    await sleep(500);
    throw helpers.makeRuntimeErrorMsg(ctx, `Invalid move: '${x}, ${y}': ${validity}`);
  }

  const result = makeMove(Player.go.boardState, x, y, playerColors.black);
  if (!result) {
    await sleep(500);
    throw helpers.makeRuntimeErrorMsg(ctx, `Invalid move`);
  }

  helpers.log(ctx, () => `Go move played: ${x}, ${y}`);

  const playerUpdatedBoard = getStateCopy(result);
  return getAIMove(ctx, playerUpdatedBoard, traditional);
}

export function NetscriptGo(): InternalAPI<Go> {
  return {
    makeMoveTraditional:
      (ctx: NetscriptContext) =>
      async (_x, _y): Promise<Play> => {
        const x = helpers.string(ctx, "x", _x);
        const y = helpers.number(ctx, "y", _y);
        const xIndex = columnIndexes.indexOf(x.toUpperCase());
        const yIndex = y + 1;

        return await makePlayerMove(ctx, xIndex, yIndex, true);
      },
    makeMove:
      (ctx: NetscriptContext) =>
      async (_x, _y): Promise<Play> => {
        const x = helpers.number(ctx, "x", _x);
        const y = helpers.number(ctx, "y", _y);
        return await makePlayerMove(ctx, x, y, false);
      },
    passTurn:
      (ctx: NetscriptContext) =>
      async (_useTraditionalNotation): Promise<Play> => {
        const useTraditionalNotation = !!_useTraditionalNotation;
        passTurn(Player.go.boardState);
        if (Player.go.boardState.previousPlayer === null) {
          return Promise.resolve({
            type: playTypes.gameOver,
            x: -1,
            y: -1,
          });
        }
        return getAIMove(ctx, Player.go.boardState, useTraditionalNotation);
      },
    getBoardState: () => () => {
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
    resetBoardState: (ctx) => (_opponent, _boardSize) => {
      // TODO: correctly handle opponent checking, and cleaner list
      const opponentString = helpers.string(ctx, "opponent", _opponent);
      const opponent = [
        opponents.Netburners,
        opponents.SlumSnakes,
        opponents.TheBlackHand,
        opponents.Daedalus,
        opponents.Illuminati,
      ].find((faction) => faction === opponentString);

      const boardSize = helpers.number(ctx, "boardSize", _boardSize);
      if (![5, 7, 9, 13].includes(boardSize)) {
        const ws = ctx.workerScript;
        throw `RUNTIME ERROR\n${ws.name}@${ws.hostname} (PID - ${ws.pid})\n\n Invalid subnet size requested (${boardSize}), size must be 5, 7, 9, or 13`;
      }
      resetWinstreak(Player.go.boardState);
      Player.go.boardState = getNewBoardState(boardSize, opponent);
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
