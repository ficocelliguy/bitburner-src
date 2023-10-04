import { NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import { endGoGame, getStateCopy, makeMove } from "../Go/boardState/boardState";
import { BoardState, columnIndexes, Play, playerColors, playTypes, validityReason } from "../Go/boardState/goConstants";
import { getMove } from "../Go/boardAnalysis/goAI";
import {
  evaluateIfMoveIsValid,
  getAllUnclaimedTerritory,
  getSimplifiedBoardState,
} from "../Go/boardAnalysis/boardAnalysis";

async function getAIMove(ctx: NetscriptContext, boardState: BoardState, traditionalNotation: boolean): Promise<Play> {
  let resolve: (value: Play) => void;
  const aiMoveResult = new Promise<Play>((res) => (resolve = res));

  // TODO: split out AI move logic
  getMove(boardState, playerColors.white, Player.go.boardState.ai).then(async (result) => {
    if (!result) {
      boardState.previousPlayer = playerColors.white;
      Player.go.boardState = boardState;

      const remainingTerritory = getAllUnclaimedTerritory(boardState).length;
      await sleep(500);
      if (remainingTerritory > 0) {
        return {
          type: playTypes.pass,
          x: null,
          y: null,
        };
      } else {
        endGoGame(Player.go.boardState);
        return {
          type: playTypes.gameOver,
          x: null,
          y: null,
        };
      }
    }

    const aiUpdateBoard = makeMove(boardState, result.x, result.y, playerColors.white);
    if (!aiUpdateBoard) {
      boardState.previousPlayer = playerColors.white;
      Player.go.boardState = boardState;
    } else {
      Player.go.boardState = aiUpdateBoard;
      helpers.log(ctx, () => `Opponent played move: ${result.x}, ${result.y}`);
    }

    const xResultIndex = traditionalNotation ? columnIndexes[result.x] : result.x;
    const yResultIndex = traditionalNotation ? result.y + 1 : result.y;

    await sleep(200);
    resolve({ type: playTypes.move, x: xResultIndex, y: yResultIndex });
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

        const validity = evaluateIfMoveIsValid(Player.go.boardState, xIndex, yIndex, playerColors.black);

        if (validity !== validityReason.valid) {
          await sleep(500);
          throw helpers.makeRuntimeErrorMsg(ctx, `Invalid move: '${x}, ${y}': ${validity}`);
        }

        const result = makeMove(Player.go.boardState, xIndex, yIndex, playerColors.black);
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
        Player.go.boardState.previousPlayer = playerColors.black;
        return getAIMove(ctx, Player.go.boardState, useTraditionalNotation);
      },
    getBoardState: () => () => {
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
