import { NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import { getStateCopy, makeMove } from "../Go/utils/boardState";
import { BoardState, columnIndexes, Play, playerColors, validityReason } from "../Go/utils/goConstants";
import { getMove } from "../Go/utils/goAI";
import { evaluateIfMoveIsValid, getSimplifiedBoardState } from "../Go/utils/boardAnalysis";

async function getAIMove(ctx: NetscriptContext, boardState: BoardState, traditionalNotation: boolean): Promise<Play> {
  let resolve: (value: Play) => void;
  const aiMoveResult = new Promise<Play>((res) => (resolve = res));

  // TODO: split out AI move logic
  getMove(boardState, playerColors.white, Player.goBoard.ai).then(async (result) => {
    if (!result) {
      boardState.previousPlayer = playerColors.white;
      Player.goBoard = boardState;
      // TODO: handle game ending
      await sleep(500);
      return;
    }

    const aiUpdateBoard = makeMove(boardState, result.x, result.y, playerColors.white);
    if (!aiUpdateBoard) {
      boardState.previousPlayer = playerColors.white;
      Player.goBoard = boardState;
    } else {
      Player.goBoard = aiUpdateBoard;
      helpers.log(ctx, () => `Opponent played move: ${result.x}, ${result.y}`);
    }

    const xResultIndex = traditionalNotation ? columnIndexes[result.x] : result.x;
    const yResultIndex = traditionalNotation ? result.y + 1 : result.y;

    await sleep(200);
    resolve({ x: xResultIndex, y: yResultIndex });
  });
  return aiMoveResult;
}

export function NetscriptGo() {
  return {
    makeMove:
      (ctx: NetscriptContext) =>
      async (x: number | string, y: number): Promise<Play> => {
        const xIndex = typeof x === "string" ? columnIndexes.indexOf(x.toUpperCase()) : +x;
        const yIndex = typeof x === "string" ? y + 1 : y;

        const validity = evaluateIfMoveIsValid(Player.goBoard, xIndex, yIndex, playerColors.black);

        if (validity !== validityReason.valid) {
          await sleep(500);
          throw helpers.makeRuntimeErrorMsg(ctx, `Invalid move: '${x}, ${y}': ${validity}`);
        }

        const result = makeMove(Player.goBoard, xIndex, yIndex, playerColors.black);
        if (!result) {
          await sleep(500);
          throw helpers.makeRuntimeErrorMsg(ctx, `Invalid move`);
        }

        helpers.log(ctx, () => `Go move played: ${x}, ${y}`);

        const playerUpdatedBoard = getStateCopy(result);
        return getAIMove(ctx, playerUpdatedBoard, typeof x === "string");
      },
    passTurn:
      (ctx: NetscriptContext) =>
      async (useTraditionalNotation = false): Promise<Play> => {
        Player.goBoard.previousPlayer = playerColors.black;
        return getAIMove(ctx, Player.goBoard, useTraditionalNotation);
      },
    getBoardState: () => () => {
      return getSimplifiedBoardState(Player.goBoard.board);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
