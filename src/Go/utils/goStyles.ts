import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

export const pointStyle = makeStyles((theme: Theme) =>
  createStyles({
    point: {
      position: "relative",
      "&:hover $innerPoint": {
        borderColor: theme.colors.white,
      },
    },
    traditional: {
      "& $innerPoint": {
        display: "none",
      },
      "& $tradStone": {
        display: "block",
      },
      "& $liberty": {
        backgroundColor: "black",
        transition: "none",
      },
      "& $northLiberty, & $southLiberty": {
        width: "1px",
      },
      "& $eastLiberty, & $westLiberty": {
        height: "1px",
      },
      "& $thirteenByThirteen": {
        "& $blackPoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, black 65%), radial-gradient(38px at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
          },
        },
        "& $whitePoint": {
          margin: "3px",

          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, white 65%), radial-gradient(38px at 42% 38%, white 0%, white 35%, transparent 36%)",
          },
        },
      },
    },
    fiveByFive: {
      "&$point": {
        padding: "50px",
      },
    },
    tradStone: {
      display: "none",
      borderRadius: "50%",
      width: 0,
      height: 0,

      "&:before": {
        zIndex: 2,
        borderRadius: "50%",
        bottom: 0,
        content: '" "',
        display: "block",
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
      },
      "&:after": {
        boxShadow: "2.5px 4px 0.5em hsla(0, 0%, 0%, 0.5)",
        zIndex: 1,
        borderRadius: "50%",
        bottom: 0,
        content: '" "',
        display: "block",
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
      },

      "&$blackPoint": {
        width: 0,
        height: 0,
        padding: "11px",
        position: "static",
        margin: "3px",

        "&:before": {
          backgroundColor: "black",
          backgroundImage:
            "linear-gradient(145deg, transparent, black 65%), radial-gradient(70px at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
        },
      },
      "&$whitePoint": {
        margin: "4px",

        "&:before": {
          backgroundColor: "hsla(0, 0%, 90%, 1)",
          backgroundImage:
            "linear-gradient(145deg, transparent, white 65%), radial-gradient(70px at 42% 38%, white 0%, white 35%, transparent 36%)",
        },
      },
      "&$emptyPoint": {
        backgroundColor: "transparent",
      },
    },
    sevenBySeven: {
      "&$point": {
        padding: "30px",
      },
    },
    nineByNine: {
      "&$point": {
        padding: "20px",
      },
    },
    thirteenByThirteen: {
      "&$point": {
        padding: "7px",
      },
    },
    innerPoint: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderRadius: "50%",
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

export const boardStyles = makeStyles((theme: Theme) =>
  createStyles({
    board: {
      margin: "auto",
      minWidth: "740px",
      padding: "30px",
    },
    traditional: {
      backgroundColor: "#ca973e",
    },
    opponentName: {
      paddingTop: "3px",
      paddingBottom: "5px",
    },
    opponentLabel: {
      padding: "3px 10px 5px 10px",
    },
    inlineFlexBox: {
      display: "inline-flex",
      flexDirection: "row",
    },
    scoreBox: {
      display: "inline-flex",
      flexDirection: "row",
      whiteSpace: "pre",
      padding: "10px",
    },
    background: {
      position: "absolute",
      opacity: 0.09,
      color: theme.colors.white,
      fontFamily: "monospace",
      fontSize: "4.5px",
      whiteSpace: "pre",
      pointerEvents: "none",
      paddingTop: "20px",
    },
  }),
);
