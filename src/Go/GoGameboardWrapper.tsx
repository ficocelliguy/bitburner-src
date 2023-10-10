import React, { useState } from "react";
import { SnackbarEvents } from "../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { Box, Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";

import {
  boardSizes,
  BoardState,
  goScore,
  opponents,
  playerColors,
  playTypes,
  validityReason,
} from "./boardState/goConstants";
import {
  applyHandicap,
  endGoGame,
  getNewBoardState,
  getStateCopy,
  makeMove,
  passTurn,
  updateCaptures,
} from "./boardState/boardState";
import { getMove } from "./boardAnalysis/goAI";
import { weiArt } from "./boardState/asciiArt";
import { getScore } from "./boardAnalysis/scoring";
import { useRerender } from "../ui/React/hooks";
import { OptionSwitch } from "../ui/React/OptionSwitch";
import { boardStyles } from "./boardState/goStyles";
import { Player } from "@player";
import { evaluateIfMoveIsValid } from "./boardAnalysis/boardAnalysis";
import { GoScoreModal } from "./GoScoreModal";
import { GoGameboard } from "./GoGameboard";

// TODO: show diagrams in "how to play" tab

// TODO: harden against interrupts for AI plays?

export function GoGameboardWrapper(): React.ReactElement {
  const rerender = useRerender(400);

  const boardState = (function () {
    if (Player?.go?.boardState === null) throw new Error("Player.go should not be null");
    return Player.go.boardState;
  })();
  const [traditional, setTraditional] = useState(false);
  const [showPriorMove, setShowPriorMove] = useState(false);
  const [opponent, setOpponent] = useState<opponents>(opponents.Daedalus);
  const [boardSize, setBoardSize] = useState(Player.go.boardState.board[0].length);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [score, setScore] = useState<goScore>(getScore(boardState));

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
    if (showPriorMove) {
      SnackbarEvents.emit(`Currently showing a past board state.`, ToastVariant.WARNING, 2000);
      return;
    }

    // Lock the board when it isn't the player's turn
    const gameOver = boardState.previousPlayer === null;
    const notYourTurn = boardState.previousPlayer === playerColors.black && opponent !== opponents.none;
    if (notYourTurn) {
      SnackbarEvents.emit(`It is not your turn to play.`, ToastVariant.WARNING, 2000);
      return;
    }
    if (gameOver) {
      SnackbarEvents.emit(`The game is complete, please reset to continue.`, ToastVariant.WARNING, 2000);
      return;
    }

    const currentPlayer = boardState.previousPlayer === playerColors.white ? playerColors.black : playerColors.white;
    const validity = evaluateIfMoveIsValid(boardState, x, y, currentPlayer);
    if (validity != validityReason.valid) {
      SnackbarEvents.emit(`Invalid move: ${validity}`, ToastVariant.ERROR, 2000);
      return;
    }

    const updatedBoard = makeMove(boardState, x, y, currentPlayer, false);
    if (updatedBoard) {
      updateBoard(updatedBoard);

      // Delay captures a short amount to make them easier to see
      setTimeout(() => {
        const captureUpdatedBoard = updateCaptures(updatedBoard, currentPlayer);
        Player.go.boardState = captureUpdatedBoard;
        opponent !== opponents.none && takeAiTurn(captureUpdatedBoard);
      }, 100);
    }
  }

  function passPlayerTurn() {
    passTurn(boardState);
    updateBoard(boardState);
    if (boardState.previousPlayer === null) {
      endGame();
      return;
    }

    setTimeout(() => {
      opponent !== opponents.none && takeAiTurn(boardState);
    }, 100);
  }

  async function takeAiTurn(board: BoardState) {
    if (board.previousPlayer === null) {
      return;
    }
    const initialState = getStateCopy(board);
    const move = await getMove(initialState, playerColors.white, opponent);

    if (move.type === playTypes.pass) {
      SnackbarEvents.emit(`The opponent passes their turn; It is now your turn to move.`, ToastVariant.WARNING, 4000);
      updateBoard(initialState);
      return;
    }

    if (move.type === playTypes.gameOver || move.x === null || move.y === null) {
      endGame();
      return;
    }

    const updatedBoard = await makeMove(initialState, move.x, move.y, playerColors.white, false);

    if (updatedBoard) {
      setTimeout(() => {
        Player.go.boardState = updatedBoard;
        rerender();

        // Delay captures a short amount to make them easier to see
        setTimeout(() => {
          const newBoard = updateCaptures(updatedBoard, playerColors.white);
          updateBoard(newBoard);
        }, 100);
      }, 500);
    }
  }

  function changeOpponent(event: SelectChangeEvent): void {
    if (boardState.history.length !== 0) {
      return;
    }
    const newOpponent = event.target.value as opponents;
    setOpponent(event.target.value as opponents);
    setScore(getScore(boardState));

    resetState(boardSize, newOpponent);
  }

  function changeBoardSize(event: SelectChangeEvent) {
    if (boardState.history.length !== 0) {
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

  function updateBoard(newBoardState: BoardState) {
    Player.go.boardState = newBoardState;
    setScore(getScore(newBoardState));
    rerender();
  }

  function endGame() {
    endGoGame(boardState);
    const finalScore = getScore(boardState);
    setScore(finalScore);
    setScoreOpen(true);
    rerender();
  }

  function getPriorMove() {
    const priorBoard = Player.go.boardState.history.slice(-1)[0];
    const boardState = getStateCopy(Player.go.boardState);
    boardState.board = priorBoard;
    boardState.previousPlayer =
      boardState.previousPlayer === playerColors.black ? playerColors.white : playerColors.black;

    return boardState;
  }

  return (
    <>
      <div className={classes.boardFrame}>
        <GoScoreModal
          open={scoreOpen}
          onClose={() => setScoreOpen(false)}
          reset={() => resetState()}
          finalScore={score}
          opponent={opponent}
        ></GoScoreModal>
        {traditional ? "" : <div className={classes.background}>{weiArt}</div>}
        <Box className={`${classes.inlineFlexBox} ${classes.opponentTitle}`}>
          <Typography className={classes.opponentLabel}>
            {opponent !== opponents.none ? "Subnet owner: " : ""}
          </Typography>
          {boardState.history.length === 0 ? (
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
          {boardState.history.length === 0 ? (
            <Select value={`${boardSize}`} onChange={changeBoardSize} sx={{ mr: 1 }}>
              {boardSizes.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}x{size}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography className={classes.opponentName}>
              ( {boardSize}x{boardSize} )
            </Typography>
          )}
        </Box>
        <div className={`${classes.gameboardWrapper} ${showPriorMove ? classes.translucent : ""}`}>
          <GoGameboard
            boardState={showPriorMove ? getPriorMove() : Player.go.boardState}
            traditional={traditional}
            clickHandler={clickHandler}
            hover={!showPriorMove}
          />
        </div>
        <Box className={classes.inlineFlexBox}>
          <Button onClick={() => resetState(boardSize)}> Reset </Button>
          <Typography className={classes.scoreBox}>
            Score: Black: {score[playerColors.black].sum} White: {score[playerColors.white].sum}
          </Typography>
          <Button onClick={passPlayerTurn}>{boardState.passCount ? "  End Game  " : "  Pass Turn  "}</Button>
        </Box>
        <div className={classes.opponentLabel}>
          <Box className={classes.inlineFlexBox}>
            <OptionSwitch
              checked={traditional}
              onChange={(newValue) => setTraditional(newValue)}
              text="Traditional Go look"
              tooltip={<>Show stones and grid as if it was a standard Go board</>}
            />
            <OptionSwitch
              checked={showPriorMove}
              onChange={(newValue) => setShowPriorMove(newValue)}
              text="Show previous move"
              tooltip={<>Show the board as it was before the last move</>}
            />
          </Box>
        </div>
      </div>
    </>
  );
}
