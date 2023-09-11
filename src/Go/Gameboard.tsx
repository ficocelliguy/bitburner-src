import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { Point } from "./Point";
import { Play, playerColors, PointState } from "./types";

const BOARD_SIZE = 5;

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
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => ({ player: playerColors.empty, chain: null, liberties: null })),
    ),
  );

  const classes = useStyles();

  function clickHandler(x: number, y: number): void {
    if (boardState[x][y].player === playerColors.empty) {
      boardState[x][y].player = playerColors.black;
      updateBoard(boardState);

      console.log(x, y, boardState[x][y].player, turn);

      takeAiTurn();
    }
  }

  function updateBoard(state: PointState[][]): void {
    const newState = [...state];
    setBoardState(newState);
  }

  function takeAiTurn() {
    const anEmptySpace = boardState.find((_, x) =>
      boardState[x].find((_, y) => boardState[x][y].player === playerColors.empty),
    );

    if (turn > BOARD_SIZE * (BOARD_SIZE - 1) || !anEmptySpace) {
      resetState();
      return;
    }

    let x, y;

    do {
      x = Math.floor(Math.random() * BOARD_SIZE);
      y = Math.floor(Math.random() * BOARD_SIZE);
    } while (boardState[x][y].player !== playerColors.empty);

    boardState[x][y].player = playerColors.white;
    setTurn(turn + 2);

    console.log(x, y, boardState[x][y].player, turn);
    updateBoard(boardState);
  }

  function resetState() {
    setTurn(0);
    setBoardState(
      Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => ({ player: playerColors.empty, chain: null, liberties: null })),
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
