import React from "react";
import { Button } from "@mui/material";
import Typography from "@mui/material/Typography";

import { Modal } from "../ui/React/Modal";
import { goScore, opponents, playerColors } from "./boardState/goConstants";
import { getBonusText, getDifficultyMultiplier, getWinstreakMultiplier } from "./effects/effect";
import { Player } from "@player";

interface IProps {
  open: boolean;
  onClose: () => void;
  finalScore: goScore;
  reset: () => void;
  opponent: opponents;
}

export const GoScoreModal = ({ open, onClose, finalScore, reset, opponent }: IProps): React.ReactElement => {
  const blackScore = finalScore[playerColors.black];
  const whiteScore = finalScore[playerColors.white];
  const winStreak = Player.go.status[opponent].winStreak;
  const nodePower = Player.go.status[opponent].nodePower;

  const difficultyMultiplier = getDifficultyMultiplier(whiteScore.komi);
  const winstreakMultiplier = getWinstreakMultiplier(winStreak);
  const nodePowerIncrease = blackScore.sum * difficultyMultiplier * winstreakMultiplier;

  const nodePowerIncreaseSummary = (
    <>
      Difficulty Multiplier: {difficultyMultiplier} <br />
      Win Streak Multiplier: {winstreakMultiplier} <br /> <br />
      Node power gained: {nodePowerIncrease}
      <br />
      Total node power: {nodePower}
      <br />
      <br />
      <strong>Total Bonus: {getBonusText(opponent)}</strong>
      <br />
      <br />
    </>
  );

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Typography variant="h5">Game complete!</Typography>
        <Typography>
          <br />
          <strong>Black:</strong>
          <br />
          Territory: {blackScore.territory}, Pieces: {blackScore.pieces}
          <br />
          Final score: {blackScore.sum}
          <br />
          <br />
          <strong>White:</strong>
          <br />
          Territory: {whiteScore.territory}, Pieces: {whiteScore.pieces}, Komi: {whiteScore.komi}
          <br />
          Final score: {whiteScore.sum}
          <br />
          <br />
          <Typography variant="h5">{blackScore.sum > whiteScore.sum ? "You win!" : `Winner: ${opponent}`}</Typography>
          <br />
          <br />
          {blackScore.sum > whiteScore.sum ? nodePowerIncreaseSummary : ""}
        </Typography>
        <Button onClick={reset}>Reset</Button>
      </>
    </Modal>
  );
};
