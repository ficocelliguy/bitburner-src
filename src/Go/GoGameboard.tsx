import React from "react";
import Grid from "@mui/material/Grid";

import { getSizeClass, GoPoint } from "./GoPoint";
import { useRerender } from "../ui/React/hooks";
import { boardStyles } from "./boardState/goStyles";
import { Player } from "@player";

interface IProps {
  traditional: boolean;
  clickHandler: (x: number, y: number) => any;
}

export function GoGameboard({ traditional, clickHandler }: IProps): React.ReactElement {
  useRerender(400);

  const boardState = (function () {
    if (Player?.go?.boardState === null) throw new Error("Player.go should not be null");
    return Player.go.boardState;
  })();

  const boardSize = Player.go.boardState.board[0].length;
  const classes = boardStyles();

  return (
    <>
      <Grid container id="goGameboard" className={`${classes.board} ${traditional ? classes.traditional : ""}`}>
        {boardState.board.map((row, y) => {
          const yIndex = boardState.board[0].length - y - 1;
          return (
            <Grid container key={`column_${yIndex}`} item className={getSizeClass(boardSize, classes)}>
              {row.map((point, x: number) => {
                const xIndex = x;
                return (
                  <Grid
                    item
                    key={`point_${xIndex}_${yIndex}`}
                    onClick={() => clickHandler(xIndex, yIndex)}
                    className={getSizeClass(boardSize, classes)}
                  >
                    <GoPoint state={boardState} x={xIndex} y={yIndex} traditional={traditional} />
                  </Grid>
                );
              })}
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
