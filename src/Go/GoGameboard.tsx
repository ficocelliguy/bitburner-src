import React, { useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
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
import { OptionSwitch } from "../ui/React/OptionSwitch";
import { boardStyles } from "./utils/goStyles";

// TODO: reset button on end game screen, see ` AscensionModal `

// TODO: traditional stone styling ( https://codepen.io/neagle/pen/NWRPgP )

// TODO: Encode go state in player object

// TODO: "How to Play" modal or page

// TODO: Flavor text and page title, flavor in summary modal

// TODO: Win streaks? won node and subnet counts?

// TODO: Minor grow boost as reward?

export function GoGameboard(): React.ReactElement {
  const rerender = useRerender(200);
  const [turn, setTurn] = useState(0);
  const [traditional, setTraditional] = useState(false);
  const [boardState, setBoardState] = useState<BoardState>(getNewBoardState(boardSizes[1]));
  const [opponent, setOpponent] = useState<opponents>(opponents.Daedalus);
  const [boardSize, setBoardSize] = useState(boardSizes[1]);

  const classes = boardStyles();
  const opponentFactions = [
    opponents.none,
    opponents.Netburners,
    opponents.SlumSnakes,
    opponents.TheBlackHand,
    opponents.Daedalus,
    opponents.Illuminati,
  ];

  const score = useMemo(() => getScore(boardState, getKomi(opponent)), [boardState, opponent]);

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
        rerender();
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
        rerender();

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
    const blackScore = score[playerColors.black];
    const whiteScore = score[playerColors.white];
    dialogBoxCreate(
      "Game complete! \n\n" +
        `Black:\n` +
        `  Territory: ${blackScore.territory},  Pieces: ${blackScore.pieces}  \n` +
        `     Final score: ${blackScore.sum}  \n\n` +
        `White:\n` +
        `  Territory: ${whiteScore.territory},  Pieces: ${whiteScore.pieces},  Komi: ${whiteScore.komi}  \n` +
        `    Final score: ${whiteScore.sum}  \n\n` +
        `       ${blackScore > whiteScore ? "You win!" : `Winner: ${opponent.slice(0, opponent.indexOf("("))}`} \n\n`,
    );
  }

  return (
    <>
      <div>
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
          <Button onClick={() => resetState()}>Reset</Button>
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
