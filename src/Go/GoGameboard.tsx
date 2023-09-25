import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { SnackbarEvents } from "../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { Box, Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { Help } from "@mui/icons-material";

import { getSizeClass, GoPoint } from "./GoPoint";
import { boardSizes, BoardState, goScore, opponents, playerColors, validityReason } from "./utils/goConstants";
import { applyHandicap, getNewBoardState, getStateCopy, makeMove, updateCaptures } from "./utils/boardState";
import { getKomi, getMove } from "./utils/goAI";
import { weiArt } from "./utils/asciiArt";
import { getScore, logBoard } from "./utils/scoring";
import { useRerender } from "../ui/React/hooks";
import { OptionSwitch } from "../ui/React/OptionSwitch";
import { boardStyles } from "./utils/goStyles";
import { GoInfoModal } from "./GoInfoModal";
import { Player } from "@player";
import { evaluateIfMoveIsValid } from "./utils/boardAnalysis";
import { GoScoreModal } from "./GoScoreModal";

// In progress:
// TODO: traditional stone styling ( https://codepen.io/neagle/pen/NWRPgP )

// TODO: "How to Play" tab

// TODO: Encode win streaks and history per faction in player object

// TODO: API: chains? liberties?

// Not started:

// TODO: Status tab

// TODO: eye calc update: look for moves to create eyes, or to block opponent eye creation

// TODO: Label ranks and columns?

// TODO: better shine and glow to tron theme stones

// TODO: Flavor text and page title

// TODO: pattern matching

// TODO: last stone played marker?

// TODO: Win streaks? won node and subnet counts?

// TODO: faux minor boost as reward? Grow, hacknet, rep?

// TODO: harden against interrupts for AI plays?

export function GoGameboard(): React.ReactElement {
  const rerender = useRerender(400);

  // Determine if there is an in-progress game, and if so, whose turn is next
  const currentTurn = Player.goBoard.history.length
    ? Player.goBoard.previousPlayer === playerColors.black
      ? 1
      : 2
    : 0;

  const boardState = (function () {
    if (Player.goBoard === null) throw new Error("Player.goBoard should not be null");
    return Player.goBoard;
  })();
  const [turn, setTurn] = useState(currentTurn);
  const [traditional, setTraditional] = useState(false);
  const [opponent, setOpponent] = useState<opponents>(opponents.Daedalus);
  const [boardSize, setBoardSize] = useState(Player.goBoard.board[0].length);
  const [infoOpen, setInfoOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [score, setScore] = useState<goScore>(getScore(boardState, getKomi(opponent)));

  const classes = boardStyles();
  const opponentFactions = [
    opponents.none,
    opponents.Netburners,
    opponents.SlumSnakes,
    opponents.TheBlackHand,
    opponents.Daedalus,
    opponents.Illuminati,
  ];

  function clickHandler(x: number, y: number): void {
    // Lock the board when it isn't the player's turn
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
      updateBoard(updatedBoard, turn + 1);

      // Delay captures a short amount to make them easier to see
      setTimeout(() => {
        const captureUpdatedBoard = updateCaptures(updatedBoard, currentPlayer);
        Player.goBoard = captureUpdatedBoard;
        opponent !== opponents.none && takeAiTurn(captureUpdatedBoard, turn + 1);
      }, 100);
    }
  }

  function passTurn() {
    boardState.previousPlayer = playerColors.black;
    updateBoard(boardState, turn + 1);
    setTimeout(() => {
      opponent !== opponents.none && takeAiTurn(boardState, turn + 2);
    }, 100);
  }

  async function takeAiTurn(board: BoardState, currentTurn: number) {
    const initialState = getStateCopy(board);
    const move = await getMove(initialState, playerColors.white, opponent);

    if (!move) {
      initialState.previousPlayer = playerColors.white;
      updateBoard(initialState, turn + 1);
      endGame();
      return;
    }

    const updatedBoard = await makeMove(initialState, move.x, move.y, playerColors.white, false);

    if (updatedBoard) {
      setTimeout(() => {
        Player.goBoard = updatedBoard;
        rerender();

        // Delay captures a short amount to make them easier to see
        setTimeout(() => {
          const newBoard = updateCaptures(updatedBoard, playerColors.white);
          updateBoard(newBoard, currentTurn + 1);

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
    setScore(getScore(boardState, getKomi(newOpponent)));

    resetState(boardSize, newOpponent);
  }

  function changeBoardSize(event: SelectChangeEvent) {
    if (turn !== 0) {
      return;
    }
    const newSize = +event.target.value;
    setBoardSize(newSize);
    resetState(newSize);
  }

  function resetState(newBoardSize = boardSize, newOpponent = opponent) {
    setScoreOpen(false);
    updateBoard(getNewBoardState(newBoardSize));

    if (newOpponent === opponents.Illuminati) {
      updateBoard(applyHandicap(boardSize, 4));
    }
  }

  function updateBoard(newBoardState: BoardState, turn = 0) {
    Player.goBoard = newBoardState;
    setScore(getScore(newBoardState, getKomi(opponent)));
    setTurn(turn);
    rerender();
  }

  function endGame() {
    const finalScore = getScore(boardState, getKomi(opponent));
    setScore(finalScore);
    setScoreOpen(true);
    rerender();
  }

  return (
    <>
      <div>
        <GoInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
        <GoScoreModal
          open={scoreOpen}
          onClose={() => setScoreOpen(false)}
          reset={() => resetState()}
          finalScore={score}
          opponent={opponent}
        ></GoScoreModal>
        {traditional ? "" : <div className={classes.background}>{weiArt}</div>}
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
          <Button onClick={() => setInfoOpen(true)} sx={{ my: 1 }}>
            <Help sx={{ mr: 1 }} />
            About IPvGO Subnets
          </Button>
        </Box>
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
        <Typography className={classes.scoreBox}>
          Score: Black: {score[playerColors.black].sum} White: {score[playerColors.white].sum}
        </Typography>
        <Box className={classes.inlineFlexBox}>
          <Button onClick={() => resetState(boardSize)}>Reset</Button>
          <Button onClick={passTurn}>Pass Turn</Button>
        </Box>
        <div className={classes.opponentLabel}>
          <OptionSwitch
            checked={traditional}
            onChange={(newValue) => setTraditional(newValue)}
            text="Use traditional Go style"
            tooltip={<>Show stones and grid as if it was a standard Go board</>}
          />
        </div>
      </div>
    </>
  );
}
