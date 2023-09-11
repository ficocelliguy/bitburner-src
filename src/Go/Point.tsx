import React from "react";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { playerColors, PointState } from "./types";
import { findAdjacentLibertiesAndAlliesForPoint } from "./utils";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    point: {
      backgroundColor: theme.colors.black,
      padding: "30px",
      position: "relative",
      "&:hover $innerPoint": {
        borderColor: theme.colors.white,
      },
    },
    innerPoint: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderRadius: "12px",
      borderColor: "transparent",
    },
    emptyPoint: {
      width: "4px",
      height: "4px",
      margin: "11px",
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
      padding: "9px",
      backgroundColor: theme.colors.white,
    },
    blackPoint: {
      width: "20px",
      height: "20px",
      margin: "2px",
      backgroundColor: theme.colors.black,
      borderColor: theme.colors.white,
      borderStyle: "solid",
      borderWidth: "1px",
      borderRadius: "12px",
      position: "relative",
    },
    libertyWhite: {
      position: "absolute",
      backgroundColor: theme.colors.cha,
    },
    libertyBlack: {
      position: "absolute",
      backgroundColor: theme.colors.success,
    },
    northLiberty: {
      width: "2px",
      height: "44px",
      top: 0,
      left: "44px",
    },
    southLiberty: {
      width: "2px",
      height: "44px",
      top: "44px",
      left: "44px",
    },
    eastLiberty: {
      width: "44px",
      height: "2px",
      top: "44px",
      left: "44px",
    },
    westLiberty: {
      width: "44px",
      height: "2px",
      top: "44px",
      left: 0,
    },
    noLiberty: {},
  }),
);
export function Point(props: { state: PointState[][]; x: number; y: number }): React.ReactElement {
  const classes = useStyles();

  const currentPoint = props.state[props.x][props.y];
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

  const colorLiberty = player === playerColors.white ? classes.libertyWhite : classes.libertyBlack;

  return (
    <div className={classes.point} title={player}>
      <div className={hasNorthLiberty ? `${classes.northLiberty} ${colorLiberty}` : classes.noLiberty}></div>
      <div className={hasEastLiberty ? `${classes.eastLiberty} ${colorLiberty}` : classes.noLiberty}></div>
      <div className={hasSouthLiberty ? `${classes.southLiberty} ${colorLiberty}` : classes.noLiberty}></div>
      <div className={hasWestLiberty ? `${classes.westLiberty} ${colorLiberty}` : classes.noLiberty}></div>
      <div className={classes.innerPoint}>
        <div className={`${pointClass} ${player !== playerColors.empty ? classes.filledPoint : ""}`}></div>
      </div>
    </div>
  );
}
