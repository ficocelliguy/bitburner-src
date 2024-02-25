import type { BoardState } from "../Types";

import React, { useMemo } from "react";
import { Grid } from "@mui/material";

import { GoOpponent, GoColor } from "@enums";
import { getSizeClass, GoPoint } from "./GoPoint";
import { useRerender } from "../../ui/React/hooks";
import { boardStyles } from "../boardState/goStyles";
import { getAllValidMoves, getControlledSpace } from "../boardAnalysis/boardAnalysis";

interface GoGameboardProps {
  boardState: BoardState;
  traditional: boolean;
  clickHandler: (x: number, y: number) => any;
  hover: boolean;
}

export function GoGameboard({ boardState, traditional, clickHandler, hover }: GoGameboardProps): React.ReactElement {
  useRerender(400);

  const currentPlayer =
    boardState.ai !== GoOpponent.none || boardState.previousPlayer === GoColor.white ? GoColor.black : GoColor.white;

  // "boardState.previousPlayer" is added as a useMemo dependency because useMemo only does pointer comparison for
  // determining when objects change, so a primitive has to be used to correctly update it
  const availablePoints = useMemo(
    () => (hover ? getAllValidMoves(boardState, currentPlayer) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardState, hover, currentPlayer, boardState.previousPlayer],
  );

  const ownedEmptyNodes = useMemo(
    () => getControlledSpace(boardState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardState, boardState.previousPlayer],
  );

  function pointIsValid(x: number, y: number) {
    return !!availablePoints.find((point) => point.x === x && point.y === y);
  }

  const boardSize = boardState.board[0].length;
  const classes = boardStyles();

  return (
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
                  <GoPoint
                    state={boardState}
                    x={xIndex}
                    y={yIndex}
                    traditional={traditional}
                    hover={hover}
                    valid={pointIsValid(xIndex, yIndex)}
                    emptyPointOwner={ownedEmptyNodes[xIndex]?.[yIndex]}
                  />
                </Grid>
              );
            })}
          </Grid>
        );
      })}
    </Grid>
  );
}
