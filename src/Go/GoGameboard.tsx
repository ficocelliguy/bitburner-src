import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { Theme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { SnackbarEvents } from "../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { Box, Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";

import { GoPoint } from "./GoPoint";
import { boardSizes, BoardState, opponents, playerColors, validityReason } from "./goConstants";
import {
  applyHandicap,
  evaluateIfMoveIsValid,
  getNewBoardState,
  getStateCopy,
  makeMove,
  updateCaptures,
} from "./utils/boardState";
import { getKomi, getMove } from "./utils/goAI";
import { weiArt } from "./utils/asciiArt";
import { getScore, logBoard } from "./utils/scoring";
import { useRerender } from "../ui/React/hooks";
import { dialogBoxCreate } from "../ui/React/DialogBox";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    board: {
      margin: "auto",
      minWidth: "740px",
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

export function GoGameboard(): React.ReactElement {
  const rerender = useRerender();
  const [turn, setTurn] = useState(0);
  const [boardState, setBoardState] = useState<BoardState>(getNewBoardState(boardSizes[1]));
  const [opponent, setOpponent] = useState<opponents>(opponents.Daedalus);
  const [boardSize, setBoardSize] = useState(boardSizes[1]);

  const classes = useStyles();
  const opponentFactions = [
    opponents.none,
    opponents.Netburners,
    opponents.SlumSnakes,
    opponents.TheBlackHand,
    opponents.Daedalus,
    opponents.Illuminati,
  ];

  const score = getScore(boardState, getKomi(opponent));

  function clickHandler(x: number, y: number): void {
    // lock the board when it isn't the player's turn
    if (turn % 2 !== 0 && opponent !== opponents.none) {
      return;
    }
    const currentPlayer = turn % 2 === 0 ? playerColors.black : playerColors.white;
    const validity = evaluateIfMoveIsValid(boardState, x, y, currentPlayer);
    if (validity != validityReason.valid) {
      SnackbarEvents.emit(`Invalid move: ${validity}`, ToastVariant.ERROR, 2000);
      return;
    }

    const updatedBoard = makeMove(boardState, x, y, currentPlayer, false);
    if (updatedBoard) {
      setBoardState(updatedBoard);
      setTurn(turn + 1);

      // Delay captures a short amount to make them easier to see
      setTimeout(() => {
        const captureUpdatedBoard = updateCaptures(updatedBoard, currentPlayer);
        setBoardState(captureUpdatedBoard);
        opponent !== opponents.none && takeAiTurn(captureUpdatedBoard, turn + 1);
      }, 100);
    }
  }

  function passTurn() {
    setTimeout(() => {
      setTurn(turn + 1);
      opponent !== opponents.none && takeAiTurn(boardState, turn + 2);
    }, 100);
  }

  async function takeAiTurn(board: BoardState, currentTurn: number) {
    const initialState = getStateCopy(board);
    const move = await getMove(initialState, playerColors.white, opponent);

    if (!move) {
      endGame();
      return;
    }

    const updatedBoard = await makeMove(initialState, move.x, move.y, playerColors.white, false);

    if (updatedBoard) {
      setTimeout(() => {
        setBoardState(updatedBoard);

        // Delay captures a short amount to make them easier to see
        setTimeout(() => {
          const newBoard = updateCaptures(updatedBoard, playerColors.white);
          setBoardState(newBoard);
          setTurn(currentTurn + 1);

          logBoard(newBoard);
        }, 100);
      }, 500);
    }
  }

  function changeOpponent(event: SelectChangeEvent): void {
    if (turn !== 0) {
      return;
    }
    const newOpponent = event.target.value as opponents;
    setOpponent(event.target.value as opponents);

    resetState();
    if (newOpponent === opponents.Illuminati) {
      setBoardState(applyHandicap(boardSize, 4));
    }
  }

  function changeBoardSize(event: SelectChangeEvent) {
    if (turn !== 0) {
      return;
    }
    const newSize = +event.target.value;
    setBoardSize(newSize);
    resetState(newSize);
  }

  function resetState(newBoardSize = boardSize) {
    setTurn(0);
    setBoardState(getNewBoardState(newBoardSize));
  }

  function endGame() {
    rerender();
    dialogBoxCreate(
      "Game complete! \n\n" +
        `Black:\n` +
        `  Territory: ${score[playerColors.black].territory},  Pieces: ${score[playerColors.black].pieces}  \n` +
        `Black final score: ${score[playerColors.black].sum}  \n\n` +
        `White:\n` +
        `  Territory: ${score[playerColors.white].territory},  Pieces: ${score[playerColors.white].pieces},  Komi: ${
          score[playerColors.white].komi
        }  \n` +
        `White final score: ${score[playerColors.white].sum}  \n`,
    );
  }

  return (
    <>
      <div>
        <div className={classes.background}>{weiArt}</div>
        <Box className={classes.inlineFlexBox}>
          <Typography className={classes.opponentLabel}>Opponent:</Typography>
          {turn === 0 ? (
            <Select value={opponent} onChange={changeOpponent} sx={{ mr: 1 }}>
              {opponentFactions.map((faction) => (
                <MenuItem key={faction} value={faction}>
                  {faction}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography className={classes.opponentName}>{opponent}</Typography>
          )}
          {turn === 0 ? (
            <Select value={`${boardSize}`} onChange={changeBoardSize} sx={{ mr: 1 }}>
              {boardSizes.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}x{size}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography className={classes.opponentName}>
              {boardSize}x{boardSize}
            </Typography>
          )}
        </Box>
        <Grid container id="goGameboard" className={classes.board}>
          {boardState.board.map((row, x) => (
            <Grid container key={`row_${x}`} item>
              {row.map((point, y: number) => (
                <Grid item key={`point_${x}_${y}`} onClick={() => clickHandler(x, y)}>
                  <GoPoint state={boardState} x={x} y={y} />
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
        <Typography className={classes.scoreBox}>
          Score: Black: {score[playerColors.black].sum} White: {score[playerColors.white].sum}
        </Typography>
        <Box className={classes.inlineFlexBox}>
          <Button onClick={() => resetState()}>Reset</Button>
          <Button onClick={passTurn}>Pass Turn</Button>
        </Box>
      </div>
    </>
  );
}
