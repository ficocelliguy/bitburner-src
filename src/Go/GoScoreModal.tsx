import React from "react";
import { Button } from "@mui/material";
import Typography from "@mui/material/Typography";

import { Modal } from "../ui/React/Modal";
import { goScore, opponents, playerColors } from "./boardState/goConstants";

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

  const opponentString = opponent.slice(0, opponent.indexOf("("));

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Typography variant="h5">Game complete!</Typography>
        <Typography>
          Black:
          <br />
          Territory: {blackScore.territory}, Pieces: {blackScore.pieces}
          <br />
          Final score: {blackScore.sum}
          <br />
          <br />
          White:
          <br />
          Territory: {whiteScore.territory}, Pieces: {whiteScore.pieces}, Komi: {whiteScore.komi}
          <br />
          Final score: {whiteScore.sum}
          <br />
          <br />
          {blackScore.sum > whiteScore.sum ? "You win!" : `Winner: ${opponentString}`}
          <br />
          <br />
        </Typography>
        <Button onClick={reset}>Reset</Button>
      </>
    </Modal>
  );
};
