import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { Point } from "./Point";
import { PlayerColor, playerColors, PointState } from "./types";
import { updateChains } from "./utils";

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
    if (boardState[x][y].player === playerColors.empty) {
      boardState[x][y].player = playerColors.black;
      updateBoard(boardState, playerColors.black);

      takeAiTurn();
    }
  }

  function updateBoard(state: PointState[][], playerWhoMoved: PlayerColor): void {
    const newState = [...state];
    updateChains(newState, playerWhoMoved);
    setBoardState(newState);

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

    updateBoard(boardState, playerColors.white);
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
