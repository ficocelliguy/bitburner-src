import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import { SnackbarEvents } from "../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { Box, Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { Help } from "@mui/icons-material";

import { GoPoint } from "./GoPoint";
import { boardSizes, BoardState, goScore, opponents, playerColors, validityReason } from "./utils/goConstants";
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
import { OptionSwitch } from "../ui/React/OptionSwitch";
import { boardStyles } from "./utils/goStyles";
import { GoInfoModal } from "./GoInfoModal";
import { Player } from "@player";

// In progress:
// TODO: traditional stone styling ( https://codepen.io/neagle/pen/NWRPgP )

// TODO: "How to Play" modal or page

// TODO: Encode go state in player object

// TODO: API

//TODO: Update screen on player object changing

// Not started:

// TODO: percent css

// TODO: fix handicap stones

// TODO: reset button on end game screen, see ` AscensionModal `

// TODO: better shine and glow to tron theme stones

// TODO: Flavor text and page title

// TODO: pattern matching

// TODO: last stone played marker?

// TODO: Win streaks? won node and subnet counts?

// TODO: Minor grow boost as reward?

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
  const [boardSize, setBoardSize] = useState(boardSizes[1]);
  const [infoOpen, setInfoOpen] = useState(false);
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

    resetState();
    if (newOpponent === opponents.Illuminati) {
      updateBoard(applyHandicap(boardSize, 4));
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
    updateBoard(getNewBoardState(newBoardSize));
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
    rerender();

    const blackScore = finalScore[playerColors.black];
    const whiteScore = finalScore[playerColors.white];
    dialogBoxCreate(
      "Game complete! \n\n" +
        `Black:\n` +
        `  Territory: ${blackScore.territory},  Pieces: ${blackScore.pieces}  \n` +
        `     Final score: ${blackScore.sum}  \n\n` +
        `White:\n` +
        `  Territory: ${whiteScore.territory},  Pieces: ${whiteScore.pieces},  Komi: ${whiteScore.komi}  \n` +
        `    Final score: ${whiteScore.sum}  \n\n` +
        `       ${
          blackScore.sum > whiteScore.sum ? "You win!" : `Winner: ${opponent.slice(0, opponent.indexOf("("))}`
        } \n\n`,
    );
  }

  return (
    <>
      <div>
        <GoInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
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
          {boardState.board.map((row, x) => (
            <Grid container key={`row_${x}`} item>
              {row.map((point, y: number) => (
                <Grid item key={`point_${x}_${y}`} onClick={() => clickHandler(x, y)}>
                  <GoPoint state={boardState} x={x} y={y} traditional={traditional} />
                </Grid>
              ))}
            </Grid>
          ))}
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
