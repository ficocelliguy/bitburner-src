import { NetscriptContext } from "../Netscript/APIWrapper";
import { helpers } from "../Netscript/NetscriptHelpers";
import { Player } from "@player";
import { evaluateIfMoveIsValid, getStateCopy, makeMove } from "../Go/utils/boardState";
import { columnIndexes, Play, playerColors, validityReason } from "../Go/utils/goConstants";
import { getMove } from "../Go/utils/goAI";

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

        let resolve: (value: Play) => void;
        const aiMoveResult = new Promise<Play>((res) => (resolve = res));
        const playerUpdatedBoard = getStateCopy(result);

        // TODO: split out AI move logic
        getMove(playerUpdatedBoard, playerColors.white, Player.goBoard.ai).then(async (result) => {
          if (!result) {
            playerUpdatedBoard.previousPlayer = playerColors.white;
            Player.goBoard = playerUpdatedBoard;
            // TODO: handle game ending
            await sleep(500);
            return;
          }

          const aiUpdateBoard = makeMove(playerUpdatedBoard, result.x, result.y, playerColors.white);
          if (!aiUpdateBoard) {
            playerUpdatedBoard.previousPlayer = playerColors.white;
            Player.goBoard = playerUpdatedBoard;
          } else {
            Player.goBoard = aiUpdateBoard;
            helpers.log(ctx, () => `Opponent played move: ${result.x}, ${result.y}`);
          }

          const xResultIndex = typeof x === "string" ? columnIndexes[result.x] : result.x;
          const yResultIndex = typeof x === "string" ? y + 1 : y;

          await sleep(200);
          resolve({ x: xResultIndex, y: yResultIndex });
        });

        return aiMoveResult;
      },
    passTurn: () => async (): Promise<Play> => {
      // TODO
      await sleep(200);
      return Promise.resolve({ x: 0, y: 0 });
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
