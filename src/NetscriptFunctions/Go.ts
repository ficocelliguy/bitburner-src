import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import {
  getNewBoardState,
  getStateCopy,
  makeMove,
  passTurn,
  updateCaptures,
  updateChains,
} from "../Go/boardState/boardState";
import { resetWinstreak } from "../Go/boardAnalysis/scoring";
import { BoardState, opponents, Play, playerColors, playTypes, validityReason } from "../Go/boardState/goConstants";
import { getMove } from "../Go/boardAnalysis/goAI";
import { evaluateIfMoveIsValid, getSimplifiedBoardState } from "../Go/boardAnalysis/boardAnalysis";
import { Go } from "@nsdefs";
import { WorkerScript } from "../Netscript/WorkerScript";
import { WHRNG } from "../Casino/RNG";

async function getAIMove(ctx: NetscriptContext, boardState: BoardState, success = true): Promise<Play> {
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

    await sleep(200);
    resolve({ type: playTypes.move, x: result.x, y: result.y, success });
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

function validateRowAndColumn(ctx: NetscriptContext, x: number, y: number) {
  const boardSize = Player.go.boardState.board.length;

  if (x < 0 || x >= boardSize) {
    throwError(
      ctx.workerScript,
      `Invalid column number (x = ${x}), column must be a number 0 through ${boardSize - 1}`,
    );
  }
  if (y < 0 || y >= boardSize) {
    throwError(ctx.workerScript, `Invalid row number (y = ${y}), row must be a number 0 through ${boardSize - 1}`);
  }
}

function resetBoardState() {
  const oldBoardState = Player.go.boardState;
  if (oldBoardState.previousPlayer !== null && oldBoardState.history.length) {
    resetWinstreak(oldBoardState.ai);
  }

  Player.go.boardState = getNewBoardState(oldBoardState.board[0].length, oldBoardState.ai);
  return getSimplifiedBoardState(Player.go.boardState.board);
}

async function determineCheatSuccess(ctx: NetscriptContext, callback: () => void): Promise<Play> {
  const rng = new WHRNG(Player.totalPlaytime);
  if (rng.random() < cheatSuccessChance()) {
    callback();
    return getAIMove(ctx, Player.go.boardState, true);
  } else if (rng.random() < 0.1) {
    resetBoardState();
    return {
      type: playTypes.gameOver,
      x: -1,
      y: -1,
      success: false,
    };
  } else {
    passTurn(Player.go.boardState);
    return getAIMove(ctx, Player.go.boardState, false);
  }
}

function cheatSuccessChance() {
  return Math.min(0.15 * Player.mults.crime_success, 1);
}

export function NetscriptGo(): InternalAPI<Go> {
  return {
    makeMove:
      (ctx: NetscriptContext) =>
      async (_x, _y): Promise<Play> => {
        const x = helpers.number(ctx, "x", _x);
        const y = helpers.number(ctx, "y", _y);
        validateRowAndColumn(ctx, x, y);

        return await makePlayerMove(ctx, x, y);
      },
    passTurn: (ctx: NetscriptContext) => async (): Promise<Play> => {
      passTurn(Player.go.boardState);
      if (Player.go.boardState.previousPlayer === null) {
        return Promise.resolve({
          type: playTypes.gameOver,
          x: -1,
          y: -1,
          success: true,
        });
      }
      return getAIMove(ctx, Player.go.boardState);
    },
    getBoardState: () => () => {
      return getSimplifiedBoardState(Player.go.boardState.board);
    },
    resetBoardState: (ctx) => (_opponent, _boardSize) => {
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
      return resetBoardState();
    },
    cheat: {
      getCheatSuccessChance: () => () => {
        return cheatSuccessChance();
      },
      removeOpponentRouter:
        (ctx: NetscriptContext) =>
        async (_x, _y): Promise<Play> => {
          const x = helpers.number(ctx, "x", _x);
          const y = helpers.number(ctx, "y", _y);
          validateRowAndColumn(ctx, x, y);

          const point = Player.go.boardState.board[x][y];
          if (point.player !== playerColors.white) {
            throwError(
              ctx.workerScript,
              `The point ${x},${y} does not have an opponent's router on it, so you cannot clear this point with removeOpponentRouter().`,
            );
          }

          return determineCheatSuccess(ctx, () => {
            point.player = playerColors.empty;
            Player.go.boardState = updateChains(Player.go.boardState);
          });
        },
      removeAllyRouter:
        (ctx: NetscriptContext) =>
        async (_x, _y): Promise<Play> => {
          const x = helpers.number(ctx, "x", _x);
          const y = helpers.number(ctx, "y", _y);
          validateRowAndColumn(ctx, x, y);
          const point = Player.go.boardState.board[x][y];
          if (point.player !== playerColors.black) {
            throwError(
              ctx.workerScript,
              `The point ${x},${y} does not have your router on it, so you cannot clear this point with removeAllyRouter().`,
            );
          }

          return determineCheatSuccess(ctx, () => {
            point.player = playerColors.empty;
            Player.go.boardState = updateChains(Player.go.boardState);
          });
        },
      playTwoMoves:
        (ctx: NetscriptContext) =>
        async (_x1, _y1, _x2, _y2): Promise<Play> => {
          const x1 = helpers.number(ctx, "x", _x1);
          const y1 = helpers.number(ctx, "y", _y1);
          validateRowAndColumn(ctx, x1, y1);
          const x2 = helpers.number(ctx, "x", _x2);
          const y2 = helpers.number(ctx, "y", _y2);
          validateRowAndColumn(ctx, x2, y2);

          const point1 = Player.go.boardState.board[x1][y1];
          if (point1.player !== playerColors.black) {
            throwError(ctx.workerScript, `The point ${x1},${y1} is not empty, so you cannot place a router there.`);
          }
          const point2 = Player.go.boardState.board[x2][y2];
          if (point2.player !== playerColors.black) {
            throwError(ctx.workerScript, `The point ${x2},${y2} is not empty, so you cannot place a router there.`);
          }

          return determineCheatSuccess(ctx, () => {
            point1.player = playerColors.black;
            point2.player = playerColors.black;
            Player.go.boardState = updateCaptures(Player.go.boardState, playerColors.black);
          });
        },
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
