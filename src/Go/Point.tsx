import React from "react";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { BoardState, playerColors } from "./types";
import { findAdjacentLibertiesAndAlliesForPoint } from "./utils/boardState";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    point: {
      padding: "23px",
      position: "relative",
      "&:hover $innerPoint": {
        borderColor: theme.colors.white,
      },
    },
    innerPoint: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderRadius: "25px",
      borderColor: "transparent",
      padding: "5px",
    },
    emptyPoint: {
      width: "4px",
      height: "4px",
      margin: "13px",
      backgroundColor: theme.colors.white,
      position: "relative",
    },
    filledPoint: {
      margin: "2px",
      borderColor: theme.colors.white,
      borderStyle: "solid",
      borderWidth: "2px",
      borderRadius: "12px",
      position: "relative",
    },
    whitePoint: {
      width: "0",
      height: "0",
      padding: "11px",
      backgroundColor: theme.colors.white,
    },
    blackPoint: {
      width: "24px",
      height: "24px",
      margin: "2px",
      backgroundColor: theme.colors.black,
      borderColor: theme.colors.white,
      borderStyle: "solid",
      borderWidth: "1px",
      borderRadius: "12px",
      position: "relative",
    },
    liberty: {
      position: "absolute",
      transition: "all 0.5s ease-out",
      backgroundColor: "transparent",
      width: "2px",
      height: "2px",
      top: "50%",
      left: "50%",
    },
    libertyWhite: {
      backgroundColor: theme.colors.cha,
    },
    libertyBlack: {
      backgroundColor: theme.colors.success,
    },
    northLiberty: {
      width: "2px",
      height: "50%",
      top: 0,
      left: "50%",
    },
    southLiberty: {
      width: "2px",
      height: "50%",
      top: "50%",
      left: "50%",
    },
    eastLiberty: {
      width: "50%",
      height: "2px",
      top: "50%",
      left: "50%",
    },
    westLiberty: {
      width: "50%",
      height: "2px",
      top: "50%",
      left: 0,
    },
  }),
);
export function Point(props: { state: BoardState; x: number; y: number }): React.ReactElement {
  const classes = useStyles();

  const currentPoint = props.state.board[props.x][props.y];
  const player = currentPoint.player;

  const liberties = findAdjacentLibertiesAndAlliesForPoint(props.state, props.x, props.y);

  const hasNorthLiberty = liberties.north;
  const hasEastLiberty = liberties.east;
  const hasSouthLiberty = liberties.south;
  const hasWestLiberty = liberties.west;

  const pointClass =
    player === playerColors.white
      ? classes.whitePoint
      : player === playerColors.black
      ? classes.blackPoint
      : classes.emptyPoint;

  const colorLiberty = `${player === playerColors.white ? classes.libertyWhite : classes.libertyBlack} ${
    classes.liberty
  }`;

  return (
    <div className={classes.point} title={player}>
      <div className={hasNorthLiberty ? `${classes.northLiberty} ${colorLiberty}` : classes.liberty}></div>
      <div className={hasEastLiberty ? `${classes.eastLiberty} ${colorLiberty}` : classes.liberty}></div>
      <div className={hasSouthLiberty ? `${classes.southLiberty} ${colorLiberty}` : classes.liberty}></div>
      <div className={hasWestLiberty ? `${classes.westLiberty} ${colorLiberty}` : classes.liberty}></div>
      <div className={classes.innerPoint}>
        <div className={`${pointClass} ${player !== playerColors.empty ? classes.filledPoint : ""}`}></div>
      </div>
    </div>
  );
}
