import React from "react";
import { BoardState, playerColors } from "./utils/goConstants";
import { findAdjacentLibertiesAndAlliesForPoint, findNeighbors } from "./utils/boardState";
import { ClassNameMap } from "@mui/styles";
import { pointStyle } from "./utils/goStyles";

export function GoPoint(props: { state: BoardState; x: number; y: number; traditional: boolean }): React.ReactElement {
  const classes = pointStyle();

  const currentPoint = props.state.board[props.x][props.y];
  const player = currentPoint.player;

  const liberties = findAdjacentLibertiesAndAlliesForPoint(props.state, props.x, props.y);
  const neighbors = findNeighbors(props.state, props.x, props.y);

  const hasNorthLiberty = props.traditional ? neighbors.north : liberties.north;
  const hasEastLiberty = props.traditional ? neighbors.east : liberties.east;
  const hasSouthLiberty = props.traditional ? neighbors.south : liberties.south;
  const hasWestLiberty = props.traditional ? neighbors.west : liberties.west;

  const pointClass =
    player === playerColors.white
      ? classes.whitePoint
      : player === playerColors.black
      ? classes.blackPoint
      : classes.emptyPoint;

  const colorLiberty = `${player === playerColors.white ? classes.libertyWhite : classes.libertyBlack} ${
    classes.liberty
  }`;

  const sizeClass = getSizeClass(props.state.board[0].length, classes);

  return (
    <div className={`${props.traditional ? classes.traditional : ""}`}>
      <div className={`${classes.point} ${sizeClass}`} title={player}>
        <div className={hasNorthLiberty ? `${classes.northLiberty} ${colorLiberty}` : classes.liberty}></div>
        <div className={hasEastLiberty ? `${classes.eastLiberty} ${colorLiberty}` : classes.liberty}></div>
        <div className={hasSouthLiberty ? `${classes.southLiberty} ${colorLiberty}` : classes.liberty}></div>
        <div className={hasWestLiberty ? `${classes.westLiberty} ${colorLiberty}` : classes.liberty}></div>
        <div className={classes.innerPoint}>
          <div className={`${pointClass} ${player !== playerColors.empty ? classes.filledPoint : ""}`}></div>
        </div>
        <div className={`${pointClass} ${classes.tradStone}`} />
      </div>
    </div>
  );
}

function getSizeClass(
  size: number,
  classes: ClassNameMap<"fiveByFive" | "sevenBySeven" | "nineByNine" | "thirteenByThirteen">,
) {
  switch (size) {
    case 5:
      return classes.fiveByFive;
    case 7:
      return classes.sevenBySeven;
    case 9:
      return classes.nineByNine;
    case 13:
      return classes.thirteenByThirteen;
  }
}
