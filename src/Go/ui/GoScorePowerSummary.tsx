import React from "react";
import { Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { Player } from "@player";
import { getBonusText, getDifficultyMultiplier, getWinstreakMultiplier } from "../effects/effect";
import { goScore, opponents, playerColors } from "../boardState/goConstants";
import { boardStyles } from "../boardState/goStyles";
import { formatNumber } from "../../ui/formatNumber";
import { FactionName } from "@enums";

interface IProps {
  finalScore: goScore;
  opponent: opponents;
}

export const GoScorePowerSummary = ({ finalScore, opponent }: IProps) => {
  const classes = boardStyles();
  const winStreak = Player.go.status[opponent].winStreak;
  const nodePower = formatNumber(Player.go.status[opponent].nodePower, 2);
  const blackScore = finalScore[playerColors.black];
  const whiteScore = finalScore[playerColors.white];

  const difficultyMultiplier = getDifficultyMultiplier(whiteScore.komi);
  const winstreakMultiplier = getWinstreakMultiplier(winStreak);
  const nodePowerIncrease = formatNumber(blackScore.sum * difficultyMultiplier * winstreakMultiplier, 2);

  return (
    <>
      <Typography>
        <strong>Subnet power gained:</strong>
      </Typography>
      <br />
      <Table sx={{ display: "table", mb: 1, width: "100%" }}>
        <TableBody>
          <TableRow>
            <TableCell className={classes.cellNone}>Nodes Captured:</TableCell>
            <TableCell className={classes.cellNone}>{blackScore.sum}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Difficulty Multiplier:</TableCell>
            <TableCell className={classes.cellNone}>{formatNumber(difficultyMultiplier, 2)}x</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Win Streak:</TableCell>
            <TableCell className={classes.cellNone}>{winStreak}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={`${classes.cellNone} ${classes.cellBottomPadding}`}>Win Streak Multiplier:</TableCell>
            <TableCell className={`${classes.cellNone} ${classes.cellBottomPadding}`}>
              {formatNumber(winstreakMultiplier, 2)}x
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Node power gained:</TableCell>
            <TableCell className={classes.cellNone}>{nodePowerIncrease}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Total node power:</TableCell>
            <TableCell className={classes.cellNone}>{nodePower}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {winStreak && winStreak % 2 === 0 && Player.factions.includes(opponent as unknown as FactionName) ? (
        <Typography className={`${classes.inlineFlexBox} ${classes.keyText}`}>
          <span>Winstreak Bonus: </span>
          <span>+1 favor to {opponent}</span>
        </Typography>
      ) : (
        ""
      )}
      <Typography className={`${classes.inlineFlexBox} ${classes.keyText}`}>
        <span>New Total Bonus: </span>
        <span>{getBonusText(opponent)}</span>
      </Typography>
    </>
  );
};
