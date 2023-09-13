import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { Point } from "./Point";
import { BoardState, playerColors } from "./types";
import { getNewBoardState, getStateClone, makeMove, updateCaptures } from "./utils/boardState";
import { getMove } from "./utils/goAI";
import { weiArt } from "./utils/asciiArt";

const BOARD_SIZE = 7;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    board: {
      margin: "auto",
    },
    background: {
      position: "absolute",
      opacity: 0.07,
      color: theme.colors.white,
      fontFamily: "monospace",
      fontSize: "3.75px",
      whiteSpace: "pre",
      pointerEvents: "none",
    },
  }),
);

export function Gameboard(): React.ReactElement {
  const [turn, setTurn] = useState(0);

  const [boardState, setBoardState] = useState<BoardState>(getNewBoardState());

  const classes = useStyles();

  function clickHandler(x: number, y: number): void {
    // lock the board when it isn't the player's turn
    if (turn % 2 !== 0) {
      return;
    }
    const updatedBoard = makeMove(boardState, x, y, playerColors.black, false);

    if (updatedBoard) {
      setBoardState(updatedBoard);
      setTurn(turn + 1);

      // Delay captures a short amount to make them easier to see
      setTimeout(() => {
        const captureUpdatedBoard = updateCaptures(updatedBoard, playerColors.black);
        setBoardState(captureUpdatedBoard);
        takeAiTurn(captureUpdatedBoard, turn + 1);
      }, 100);
    }

    logBoard(boardState);
  }

  function logBoard(boardState: BoardState): void {
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

  function takeAiTurn(board: BoardState, currentTurn: number) {
    const initialState = getStateClone(board);
    const move = getMove(initialState, playerColors.white);

    if (currentTurn > BOARD_SIZE * (BOARD_SIZE - 1) || !move) {
      resetState();
      return;
    }

    const updatedBoard = makeMove(initialState, move.x, move.y, playerColors.white, false);

    if (updatedBoard) {
      setTimeout(() => {
        setBoardState(updatedBoard);

        // Delay captures a short amount to make them easier to see
        setTimeout(() => {
          setBoardState(updateCaptures(updatedBoard, playerColors.white));
          setTurn(currentTurn + 1);
        }, 100);
      }, 500);
    }
  }

  function resetState() {
    setTurn(0);
    setBoardState(getNewBoardState());
  }

  return (
    <>
      <div>
        <div className={classes.background}>{weiArt}</div>
        <Grid container id="goGameboard" className={classes.board}>
          {boardState.board.map((row, x) => (
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
