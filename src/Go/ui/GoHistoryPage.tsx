import React from "react";
import Typography from "@mui/material/Typography";

import { opponents } from "../boardState/goConstants";
import { getScore } from "../boardAnalysis/scoring";
import { Player } from "@player";
import { Grid } from "@mui/material";
import { GoGameboard } from "./GoGameboard";
import { boardStyles } from "../boardState/goStyles";
import { useRerender } from "../../ui/React/hooks";
import { getBonusText } from "../effects/effect";
import { formatNumber } from "../../ui/formatNumber";
import { GoScoreSummaryTable } from "./GoScoreSummaryTable";

export const GoHistoryPage = (): React.ReactElement => {
  useRerender(400);
  const classes = boardStyles();
  const score = getScore(Player.go.previousGameFinalBoardState);
  const opponent = Player.go.previousGameFinalBoardState.ai;
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
          <div className={classes.statusPageScore}>
            <Typography variant="h5">Previous Subnet:</Typography>
            <GoScoreSummaryTable score={score} opponent={opponent} />
          </div>
        </Grid>
        <Grid item>
          <div className={`${classes.statusPageGameboard} ${classes.translucent}`}>
            <GoGameboard
              boardState={Player.go.previousGameFinalBoardState}
              traditional={false}
              clickHandler={(x, y) => ({ x, y })}
              hover={false}
            />
          </div>
        </Grid>
      </Grid>
      <br />
      <br />
      <Typography variant="h5">Faction Stats:</Typography>
      <Grid container style={{ maxWidth: "875px" }}>
        {opponentList.map((faction, index) => {
          const data = Player.go.status[faction];
          return (
            <Grid item key={opponentList[index]} className={classes.factionStatus}>
              <Typography>
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
                Node power: {formatNumber(data.nodePower, 2)}
                <br />
                <br />
                <strong>Bonus:</strong>
                <br />
                <span className={classes.keyText}>+{getBonusText(faction)}</span>
                <br />
              </Typography>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};
