import React from "react";
import Typography from "@mui/material/Typography";

import { opponents, playerColors } from "./boardState/goConstants";
import { getScore } from "./boardAnalysis/scoring";
import { Player } from "@player";
import { Grid } from "@mui/material";
import { GoGameboard } from "./GoGameboard";
import { boardStyles } from "./boardState/goStyles";
import { useRerender } from "../ui/React/hooks";
import { getBonusText } from "./effects/effect";

export const GoStatusPage = (): React.ReactElement => {
  useRerender(400);
  const classes = boardStyles();
  const score = getScore(Player.go.boardState);
  const blackScore = score[playerColors.black];
  const whiteScore = score[playerColors.white];
  const opponentList = [
    opponents.Netburners,
    opponents.SlumSnakes,
    opponents.TheBlackHand,
    opponents.Daedalus,
    opponents.Illuminati,
  ];

  return (
    <div>
      <Grid container>
        <Grid item>
          <Typography variant="h5">Subnet Status</Typography>
          <Typography>
            Black:
            <br />
            <br />
            Territory: {blackScore.territory}, Pieces: {blackScore.pieces}
            <br />
            <br />
            Total score: {blackScore.sum}
            <br />
            <br />
            <br />
            White:
            <br />
            <br />
            Territory: {whiteScore.territory}, Pieces: {whiteScore.pieces}, Komi: {whiteScore.komi}
            <br />
            <br />
            Total score: {whiteScore.sum}
            <br />
            <br />
            <br />
          </Typography>
        </Grid>
        <Grid item>
          <div className={classes.statusPageGameboard}>
            <GoGameboard
              boardState={Player.go.boardState}
              traditional={false}
              clickHandler={(x, y) => ({ x, y })}
              hover={false}
            />
          </div>
        </Grid>
      </Grid>
      <Typography variant="h5">History</Typography>
      <Grid container style={{ maxWidth: "875px" }}>
        {opponentList.map((faction, index) => {
          const data = Player.go.status[faction];
          return (
            <Grid item key={opponentList[index]} className={classes.factionStatus}>
              <Typography>
                <br />
                <strong>{faction}</strong>
                <br />
                Wins: {data.wins} / {data.losses + data.wins}
                <br />
                Current winstreak: {data.winStreak}
                <br />
                Highest winstreak: {data.highestWinStreak}
                <br />
                <br />
                Captured nodes: {data.nodes}
                <br />
                Node power: {data.nodePower}
                <br />
                <br />
                <strong>Bonus:</strong>
                <br />
                {getBonusText(faction)}
                <br />
                <br />
              </Typography>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};
