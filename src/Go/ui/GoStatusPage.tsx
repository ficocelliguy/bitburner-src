import React from "react";
import Typography from "@mui/material/Typography";

import { opponents } from "../boardState/goConstants";
import { getScore } from "../boardAnalysis/scoring";
import { Player } from "@player";
import { Grid, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { GoGameboard } from "./GoGameboard";
import { boardStyles } from "../boardState/goStyles";
import { useRerender } from "../../ui/React/hooks";
import { getBonusText } from "../effects/effect";
import { formatNumber } from "../../ui/formatNumber";
import {GoScoreSummaryTable} from "./GoScoreSummaryTable";

export const GoStatusPage = (): React.ReactElement => {
  useRerender(400);
  const classes = boardStyles();
  const score = getScore(Player.go.boardState);
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
          <Typography variant="h5">Current Subnet:</Typography>
          <GoScoreSummaryTable score={score}/>
          </div>
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
      </Grid><br/>
      <Typography variant="h5">Summary of All Subnet Boosts:</Typography><br/>
      <Table sx={{ display: "table", mb: 1, width: "100%" }}>
        <TableBody>
          <TableRow>
            <TableCell className={classes.cellNone}>
              <strong>Faction:</strong>
            </TableCell>
            <TableCell className={classes.cellNone}>
              <strong>Effect:</strong>
            </TableCell>
          </TableRow>
          {opponentList.map((faction, index) => {
            return <><br/><TableRow key={index}>
              <TableCell className={classes.cellNone}>
                <span>{faction}:</span>
              </TableCell>
              <TableCell className={classes.cellNone}>
                <span>+{getBonusText(faction)}</span>
              </TableCell>
            </TableRow></>
          })}
        </TableBody>
      </Table><br/><br/>
      <Typography variant="h5">Faction Stats:</Typography>
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
                Node power: {formatNumber(data.nodePower, 2)}
                <br />
                <br />
                <strong>Bonus:</strong>
                <br />
                +{getBonusText(faction)}
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
