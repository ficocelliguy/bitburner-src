import React from "react";
import Typography from "@mui/material/Typography";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";

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
          <div className={`${classes.historyPageGameboard} ${classes.translucent}`}>
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
      <Grid container style={{ maxWidth: "1020px" }}>
        {opponentList.map((faction, index) => {
          const data = Player.go.status[faction];
          return (
            <Grid item key={opponentList[index]} className={classes.factionStatus}>
              <Typography>
                {" "}
                <strong className={classes.keyText}>{faction}</strong>
              </Typography>
              <Table sx={{ display: "table", mb: 1, width: "100%" }}>
                <TableBody>
                  <TableRow>
                    <TableCell className={classes.cellNone}>Wins:</TableCell>
                    <TableCell className={classes.cellNone}>
                      {data.wins} / {data.losses + data.wins}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.cellNone}>Current winstreak:</TableCell>
                    <TableCell className={classes.cellNone}>{data.winStreak}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={`${classes.cellNone} ${classes.cellBottomPadding}`}>
                      Highest winstreak:
                    </TableCell>
                    <TableCell className={`${classes.cellNone} ${classes.cellBottomPadding}`}>
                      {data.highestWinStreak}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.cellNone}>Captured nodes:</TableCell>
                    <TableCell className={classes.cellNone}>{data.nodes}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.cellNone}>Node power:</TableCell>
                    <TableCell className={classes.cellNone}>{formatNumber(data.nodePower, 2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Typography>
                <strong className={classes.keyText}>Bonus: {getBonusText(faction)}</strong>
              </Typography>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};
