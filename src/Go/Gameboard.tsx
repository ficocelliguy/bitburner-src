import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { Point } from "./Point";
import { playerColors, PointState } from "./types";
import { getStateClone, makeMove, updateCaptures } from "./utils/boardState";
import { getRandomMove } from "./utils/ai";

const BOARD_SIZE = 7;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    board: {
      margin: "auto",
      backgroundColor: theme.colors.black,
    },
  }),
);

export function Gameboard(): React.ReactElement {
  const [turn, setTurn] = useState(0);

  const [boardState, setBoardState] = useState<PointState[][]>(
    Array.from({ length: BOARD_SIZE }, (_, x) =>
      Array.from({ length: BOARD_SIZE }, (_, y) => ({
        player: playerColors.empty,
        chain: null,
        liberties: null,
        x,
        y,
      })),
    ),
  );

  const classes = useStyles();

  function clickHandler(x: number, y: number): void {
    // lock the board when it isn't the player's turn
    if (turn % 2 !== 0) {
      return;
    }
    const updatedBoard = makeMove(boardState, x, y, playerColors.black);

    if (updatedBoard) {
      setBoardState(updatedBoard);
      setTurn(turn + 1);

      setTimeout(() => {
        const captureUpdatedBoard = updateCaptures(updatedBoard, playerColors.black);
        setBoardState(captureUpdatedBoard);
        takeAiTurn(captureUpdatedBoard, turn + 1);
      }, 200);
    }

    logBoard(boardState);
  }

  function logBoard(state: PointState[][]): void {
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

  function takeAiTurn(board: PointState[][], currentTurn: number) {
    const initialState = getStateClone(board);
    const randomMove = getRandomMove(initialState);

    if (currentTurn > BOARD_SIZE * (BOARD_SIZE - 1) || !randomMove) {
      resetState();
      return;
    }

    const updatedBoard = makeMove(initialState, randomMove.x, randomMove.y, playerColors.white);

    if (updatedBoard) {
      setTimeout(() => {
        setBoardState(updatedBoard);
        setTimeout(() => {
          setBoardState(updateCaptures(updatedBoard, playerColors.white));
          setTurn(currentTurn + 1);
        }, 200);
      }, 400);
    }
  }

  function resetState() {
    setTurn(0);
    setBoardState(
      Array.from({ length: BOARD_SIZE }, (_, x) =>
        Array.from({ length: BOARD_SIZE }, (_, y) => ({
          player: playerColors.empty,
          chain: null,
          liberties: null,
          x,
          y,
        })),
      ),
    );
  }

  return (
    <>
      <div>
        <Grid container id="goGameboard" className={classes.board}>
          {boardState.map((row, x) => (
            <Grid container key={`row_${x}`} item>
              {row.map((point, y: number) => (
                <Grid item key={`point_${x}_${y}`} onClick={() => clickHandler(x, y)}>
                  <Point state={boardState} x={x} y={y} />
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  );
}
