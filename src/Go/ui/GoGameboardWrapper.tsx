import React, { useMemo, useState } from "react";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { Box, Button, Typography } from "@mui/material";

import { BoardState, goScore, opponents, playerColors, playTypes, validityReason } from "../boardState/goConstants";
import {
  applyHandicap,
  endGoGame,
  getNewBoardState,
  getStateCopy,
  makeMove,
  passTurn,
  resetWinstreak,
  updateCaptures,
} from "../boardState/boardState";
import { getMove } from "../boardAnalysis/goAI";
import { weiArt } from "../boardState/asciiArt";
import { getScore } from "../boardAnalysis/scoring";
import { useRerender } from "../../ui/React/hooks";
import { OptionSwitch } from "../../ui/React/OptionSwitch";
import { boardStyles } from "../boardState/goStyles";
import { Player } from "@player";
import { evaluateIfMoveIsValid, getAllValidMoves } from "../boardAnalysis/boardAnalysis";
import { GoScoreModal } from "./GoScoreModal";
import { GoGameboard } from "./GoGameboard";
import { GoSubnetSearch } from "./GoSubnetSearch";

interface IProps {
  showInstructions: () => void;
}

// TODO: show formula on score screen
// TODO: mouseovers on score screen
// TODO: point breakdown section heading?

// TODO: harden against interrupts for AI plays?
// TODO: handle game saving during AI move?

// TODO: test link on Electron

export function GoGameboardWrapper({ showInstructions }: IProps): React.ReactElement {
  const rerender = useRerender(400);

  const boardState = Player.go.boardState;
  const [traditional, setTraditional] = useState(false);
  const [showPriorMove, setShowPriorMove] = useState(false);
  const [opponent, setOpponent] = useState<opponents>(boardState.ai);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [score, setScore] = useState<goScore>(getScore(boardState));
  const [waitingOnAI, setWaitingOnAI] = useState(false);

  const classes = boardStyles();
  const boardSize = boardState.board[0].length;
  const currentPlayer = boardState.previousPlayer === playerColors.white ? playerColors.black : playerColors.white;

  async function clickHandler(x: number, y: number) {
    if (showPriorMove) {
      SnackbarEvents.emit(
        `Currently showing a past board state. Please disable "Show previous move" to continue.`,
        ToastVariant.WARNING,
        2000,
      );
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
    if (boardState.previousPlayer === playerColors.white) {
      passTurn(boardState);
      updateBoard(boardState);
    }
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
    setWaitingOnAI(true);
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
          setWaitingOnAI(false);
        }, 100);
      }, 500);
    }
  }

  function newSubnet() {
    setScoreOpen(false);
    setSearchOpen(true);
  }

  function resetState(newBoardSize = boardSize, newOpponent = opponent) {
    setScoreOpen(false);
    setSearchOpen(false);
    setOpponent(newOpponent);
    if (boardState.previousPlayer !== null && boardState.history.length) {
      resetWinstreak(boardState.ai);
    }

    const newBoardState = getNewBoardState(newBoardSize, newOpponent);
    if (newOpponent === opponents.Illuminati) {
      applyHandicap(newBoardState, 4);
    }
    updateBoard(newBoardState);
  }

  function updateBoard(initialBoardState: BoardState) {
    const boardState = getStateCopy(initialBoardState);
    Player.go.boardState = boardState;
    setScore(getScore(boardState));
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

  const endGameAvailable = boardState.previousPlayer === playerColors.white && boardState.passCount;
  const noLegalMoves = useMemo(
    () => boardState.previousPlayer === playerColors.white && !getAllValidMoves(boardState, playerColors.black).length,
    [boardState],
  );
  const disablePassButton =
    opponent !== opponents.none && boardState.previousPlayer === playerColors.black && waitingOnAI;

  const scoreBoxText = boardState.history.length
    ? `Score: Black: ${score[playerColors.black].sum} White: ${score[playerColors.white].sum}`
    : "Place a router to begin!";

  const getPassButtonLabel = () => {
    if (endGameAvailable) {
      return "End Game";
    }
    if (boardState.previousPlayer === null) {
      return "View Final Score";
    }
    if (boardState.previousPlayer === playerColors.black && waitingOnAI) {
      return "Waiting for opponent";
    }
    return "Pass Turn";
  };

  return (
    <>
      <GoSubnetSearch
        open={searchOpen}
        search={resetState}
        cancel={() => setSearchOpen(false)}
        showInstructions={showInstructions}
      />
      <GoScoreModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        newSubnet={() => newSubnet()}
        finalScore={score}
        opponent={opponent}
      ></GoScoreModal>
      <div className={classes.boardFrame}>
        {traditional ? "" : <div className={classes.background}>{weiArt}</div>}
        <Box className={`${classes.inlineFlexBox} ${classes.opponentTitle}`}>
          <Typography className={classes.opponentLabel}>
            {opponent !== opponents.none ? "Subnet owner: " : ""}
          </Typography>
          <Typography className={classes.opponentName}>{opponent}</Typography>
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
          <Button onClick={() => setSearchOpen(true)} className={classes.resetBoard}>
            Find New Subnet
          </Button>
          <Typography className={classes.scoreBox}>{scoreBoxText}</Typography>
          <Button
            disabled={disablePassButton}
            onClick={passPlayerTurn}
            className={endGameAvailable || noLegalMoves ? classes.buttonHighlight : classes.resetBoard}
          >
            {getPassButtonLabel()}
          </Button>
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
