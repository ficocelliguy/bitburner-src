import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import { getNewBoardState, getStateCopy, makeMove, passTurn } from "../Go/boardState/boardState";
import { resetWinstreak } from "../Go/boardAnalysis/scoring";
import { BoardState, opponents, Play, playerColors, playTypes, validityReason } from "../Go/boardState/goConstants";
import { getMove } from "../Go/boardAnalysis/goAI";
import { evaluateIfMoveIsValid, getSimplifiedBoardState } from "../Go/boardAnalysis/boardAnalysis";
import { Go } from "@nsdefs";
import { WorkerScript } from "../Netscript/WorkerScript";

async function getAIMove(ctx: NetscriptContext, boardState: BoardState): Promise<Play> {
  let resolve: (value: Play) => void;
  const aiMoveResult = new Promise<Play>((res) => (resolve = res));
  await sleep(200);

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

    await sleep(200);
    resolve({ type: playTypes.move, x: result.x, y: result.y });
  });
  return aiMoveResult;
}

async function makePlayerMove(ctx: NetscriptContext, x: number, y: number) {
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
  return getAIMove(ctx, playerUpdatedBoard);
}

function throwError(ws: WorkerScript, errorMessage: string) {
  throw `RUNTIME ERROR\n${ws.name}@${ws.hostname} (PID - ${ws.pid})\n\n ${errorMessage}`;
}

export function NetscriptGo(): InternalAPI<Go> {
  return {
    makeMove:
      (ctx: NetscriptContext) =>
      async (_x, _y): Promise<Play> => {
        const x = helpers.number(ctx, "x", _x);
        const y = helpers.number(ctx, "y", _y);
        const boardSize = Player.go.boardState.board.length;

        if (x < 0 || x >= boardSize) {
          throwError(ctx.workerScript, `Invalid column number (x = ${x}), column must be a number 0 through ${boardSize-1}`);
        }
        if (y < 0 || y >= boardSize) {
          throwError(ctx.workerScript, `Invalid row number (y = ${y}), row must be a number 0 through ${boardSize-1}`);
        }

        return await makePlayerMove(ctx, x, y);
      },
    passTurn: (ctx: NetscriptContext) => async (): Promise<Play> => {
      passTurn(Player.go.boardState);
      if (Player.go.boardState.previousPlayer === null) {
        return Promise.resolve({
          type: playTypes.gameOver,
          x: -1,
          y: -1,
        });
      }
      return getAIMove(ctx, Player.go.boardState);
    },
    getBoardState: () => () => {
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
    resetBoardState: (ctx) => (_opponent, _boardSize) => {
      const oldBoardState = Player.go.boardState;
      const opponentString = helpers.string(ctx, "opponent", _opponent);
      const opponentOptions = [
        opponents.Netburners,
        opponents.SlumSnakes,
        opponents.TheBlackHand,
        opponents.Daedalus,
        opponents.Illuminati,
      ];
      const opponent = opponentOptions.find((faction) => faction === opponentString);

      const boardSize = helpers.number(ctx, "boardSize", _boardSize);
      if (![5, 7, 9, 13].includes(boardSize)) {
        throwError(ctx.workerScript, `Invalid subnet size requested (${boardSize}, size must be 5, 7, 9, or 13`);
      }
      if (!opponent) {
        throwError(
          ctx.workerScript,
          `Invalid opponent requested (${opponentString}), valid options are ${opponentOptions.join(", ")}`,
        );
      }
      if (oldBoardState.previousPlayer !== null && oldBoardState.history.length) {
        resetWinstreak(oldBoardState.ai);
      }

      Player.go.boardState = getNewBoardState(boardSize, opponent);
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
