import React from "react";
import Typography from "@mui/material/Typography";

import { playerColors } from "./boardState/goConstants";
import { getScore } from "./boardAnalysis/scoring";
import { Player } from "@player";
import { Grid } from "@mui/material";
import { GoGameboard } from "./GoGameboard";
import { boardStyles } from "./boardState/goStyles";
import { useRerender } from "../ui/React/hooks";

export const GoStatusPage = (): React.ReactElement => {
  useRerender(400);
  const classes = boardStyles();
  const score = getScore(Player.go.boardState);
  const blackScore = score[playerColors.black];
  const whiteScore = score[playerColors.white];

  return (
    <div>
      <Grid container>
        <Grid item>
          <Typography variant="h5">Subnet Status</Typography>
          <Typography>
            Black:
            <br />
            Territory: {blackScore.territory}, Pieces: {blackScore.pieces}
            <br />
            Total score: {blackScore.sum}
            <br />
            <br />
            White:
            <br />
            Territory: {whiteScore.territory}, Pieces: {whiteScore.pieces}, Komi: {whiteScore.komi}
            <br />
            Total score: {whiteScore.sum}
            <br />
            <br />
            <br />
            <br />
          </Typography>
        </Grid>
        <Grid item>
          <div className={classes.statusPageGameboard}>
            <GoGameboard traditional={false} clickHandler={(x, y) => ({ x, y })} />
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
