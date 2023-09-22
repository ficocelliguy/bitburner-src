import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

export const pointStyle = makeStyles((theme: Theme) =>
  createStyles({
    point: {
      position: "relative",
      height: "100%",
      width: "100%",

      "&:hover $innerPoint": {
        outlineColor: theme.colors.white,
      },
      "&:hover $coordinates": {
        display: "block",
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
        "&:not($northLiberty):not($southLiberty):not($eastLiberty):not($westLiberty)": {
          width: 0,
          height: 0,
        }
      },
      "& $northLiberty, & $southLiberty": {
        width: "0.9px",
      },
      "& $eastLiberty, & $westLiberty": {
        height: "0.9px",
      },
      "&$thirteenByThirteen": {
        "& $blackPoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(40px, 6vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
          },
        },
        "& $whitePoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(40px, 6vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
          },
        },
        "& $coordinates": {
          fontSize: "0.9vw",
        }
      },
      "&$nineByNine": {
        "& $blackPoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(60px, 7vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
          },
        },
        "& $whitePoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(60px, 7vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
          },
        },
      },
      "&$sevenBySeven": {
        "& $blackPoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(80px, 8vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
          },
        },
        "& $whitePoint": {
          "&:before": {
            backgroundImage:
              "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(80px, 8vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
          },
        },
      },
      "& $coordinates": {
        color: "black",
        left: "15%",
      },
      "& $blackPoint ~ $coordinates": {
        color: "white",
      },
    },
    fiveByFive: {},
    sevenBySeven: {},
    nineByNine: {},
    thirteenByThirteen: {},
    tradStone: {
      display: "none",
      borderRadius: "50%",
      margin: 0,

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
        position: "static",
        outlineWidth: 0,
        width: 0,
        height: 0,
        margin: 0,

        "&:before": {
          backgroundColor: "black",
          backgroundImage:
            "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(150px, 11vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
        },
      },
      "&$whitePoint": {
        backgroundColor: "transparent",
        width: 0,
        height: 0,
        margin: 0,

        "&:before": {
          backgroundColor: "hsla(0, 0%, 90%, 1)",
          backgroundImage:
            "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(150px, 11vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
        },
      },
      "&$emptyPoint": {
        width: 0,
        height: 0,
        margin: 0,
        backgroundColor: "transparent",

        "&:before": {
          display: "none",
        },
        "&:after": {
          display: "none",
        },
      },
    },
    innerPoint: {
      outlineStyle: "solid",
      outlineWidth: "1px",
      outlineColor: "transparent",
      borderRadius: "50%",
      width: "25%",
      height: "25%",
      margin: "37.8%",
      position: "absolute",
    },
    emptyPoint: {
      width: "10%",
      height: "10%",
      margin: "45%",
      backgroundColor: theme.colors.white,
      position: "relative",
    },
    filledPoint: {
      outlineStyle: "solid",
      outlineWidth: "1px",
      borderRadius: "50%",
      position: "relative",
    },
    whitePoint: {
      width: "70%",
      height: "70%",
      margin: "15%",
      backgroundColor: theme.colors.white,
    },
    blackPoint: {
      width: "70%",
      height: "70%",
      margin: "15%",
      backgroundColor: theme.colors.black,
      outlineColor: theme.colors.white,
    },
    liberty: {
      position: "absolute",
      transition: "all 0.5s ease-out",
      backgroundColor: "transparent",
      width: "2%",
      height: "2%",
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
      width: "2%",
      height: "54%",
      top: "-3%",
      left: "50%",
    },
    southLiberty: {
      width: "2%",
      height: "50%",
      top: "50%",
      left: "50%",
    },
    eastLiberty: {
      width: "50%",
      height: "2%",
      top: "50%",
      left: "50%",
    },
    westLiberty: {
      width: "50%",
      height: "2%",
      top: "50%",
      left: "0",
    },
    coordinates: {
      color: "white",
      fontFamily: "monospace",
      fontSize: "1.2vw",
      display: "none",
      position: "relative",
      top: "20%",
      left: "10%",
      zIndex: "10",
      userSelect: "none",
    }
  }),
);

export const boardStyles = makeStyles((theme: Theme) =>
  createStyles({
    board: {
      margin: "10px",
      width: "calc(min(800px, 95vw - 250px))",
      height: "calc(min(800px, 95vw - 250px))",
      padding: "30px",
      position: "relative",
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
    fiveByFive: {
      height: "20%",
      "& $fiveByFive": {
        width: "20%",
        height: "100%",
      },
    },
    sevenBySeven: {
      height: "14%",
      "& $sevenBySeven": {
        width: "14%",
        height: "100%",
      },
    },
    nineByNine: {
      height: "11%",
      "& $nineByNine": {
        width: "11%",
        height: "100%",
      },
    },
    thirteenByThirteen: {
      height: "7.5%",
      "& $thirteenByThirteen": {
        width: "7.5%",
        height: "100%",
      },
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
