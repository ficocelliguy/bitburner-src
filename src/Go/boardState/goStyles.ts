import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

export const pointStyle = makeStyles((theme: Theme) =>
  createStyles({
    hover: {},
    valid: {},
    point: {
      position: "relative",
      height: "100%",
      width: "100%",

      "&$hover$valid:hover $innerPoint": {
        outlineColor: theme.colors.white,
      },
      "&$hover:hover $coordinates": {
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
        },
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
        },
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
    fiveByFive: {
      "& $blackPoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(35px, 4vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
      },
      "& $whitePoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(35px, 4vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
      },
    },
    sevenBySeven: {
      "& $blackPoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(23px, 3vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
      },
      "& $whitePoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(25px, 3vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
      },
    },
    nineByNine: {
      "& $filledPoint": {
        boxShadow: "0px 0px 30px hsla(0, 100%, 100%, 0.48)",
      },
      "& $blackPoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(15px, 2vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
      },
      "& $whitePoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(15px, 2vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
      },
    },
    thirteenByThirteen: {
      "& $filledPoint": {
        boxShadow: "0px 0px 18px hsla(0, 100%, 100%, 0.48)",
      },
      "& $blackPoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, black 65%), radial-gradient(calc(min(10px, 1.5vw)) at 42% 38%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 36%)",
      },
      "& $whitePoint": {
        backgroundImage:
          "linear-gradient(145deg, transparent, white 65%), radial-gradient(calc(min(10px, 1.5vw)) at 42% 38%, white 0%, white 35%, transparent 36%)",
      },
    },
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
      width: "50%",
      height: "50%",
      margin: "25.8%",
      position: "absolute",
    },
    emptyPoint: {
      width: "10%",
      height: "10%",
      margin: "45%",
      backgroundColor: "white",
      position: "relative",
    },
    filledPoint: {
      outlineStyle: "solid",
      outlineWidth: "1px",
      borderRadius: "50%",
      position: "relative",
      boxShadow: "0px 0px 40px hsla(0, 100%, 100%, 0.48)",
    },
    whitePoint: {
      width: "70%",
      height: "70%",
      margin: "15%",
      backgroundColor: "hsla(0, 0%, 85%, 1)",
      outlineStyle: "none",
    },
    blackPoint: {
      width: "70%",
      height: "70%",
      margin: "15%",
      backgroundColor: "black",
      outlineColor: "white",
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
      fontFamily: `"Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman"`,
      fontSize: "calc(min(1.3vw, 12px))",
      display: "none",
      position: "relative",
      top: "15%",
      left: "8%",
      zIndex: "10",
      userSelect: "none",
    },
  }),
);

export const boardStyles = makeStyles((theme: Theme) =>
  createStyles({
    tab: {
      paddingTop: 0,
      paddingBottom: 0,
      whiteSpace: "pre",
      height: "50px",
      minHeight: "unset",
      width: "210px",
    },
    gameboardWrapper: {
      position: "relative",
      width: "calc(min(700px, 95vw - 250px))",
      height: "calc(min(700px, 95vw - 250px))",
      padding: "5px",
    },
    statusPageGameboard: {
      position: "relative",
      width: "calc(min(400px, 60vw - 250px))",
      height: "calc(min(400px, 60vw - 250px))",
    },
    factionStatus: {
      padding: "10px",
      margin: "10px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.colors.success,
      width: "270px",
    },
    board: {
      width: "100%",
      height: "100%",
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
      fontSize: "4.1px",
      whiteSpace: "pre",
      pointerEvents: "none",
      paddingTop: "20px",
      paddingLeft: "15px",
    },
    instructionScroller: {
      height: "calc(100vw - 225px)",
      overflowY: "scroll",
      marginTop: "10px",
    },
  }),
);
