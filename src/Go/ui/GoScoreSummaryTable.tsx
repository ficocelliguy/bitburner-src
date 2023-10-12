import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import { boardStyles } from "../boardState/goStyles";
import { goScore, playerColors } from "../boardState/goConstants";

interface IProps {
  score: goScore;
}

export const GoScoreSummaryTable = ({ score }: IProps) => {
  const classes = boardStyles();
  const blackScore = score[playerColors.black];
  const whiteScore = score[playerColors.white];

  return (
    <>
      <br />
      <Table sx={{ display: "table", mb: 1, width: "100%" }}>
        <TableBody>
          <TableRow>
            <TableCell className={classes.cellNone} />
            <TableCell className={classes.cellNone}>
              <strong>Black:</strong>
            </TableCell>
            <TableCell className={classes.cellNone}>
              <strong>White:</strong>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Territory:</TableCell>
            <TableCell className={classes.cellNone}>{blackScore.territory}</TableCell>
            <TableCell className={classes.cellNone}>{whiteScore.territory}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Pieces:</TableCell>
            <TableCell className={classes.cellNone}>{blackScore.pieces}</TableCell>
            <TableCell className={classes.cellNone}>{whiteScore.pieces}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.cellNone}>Komi:</TableCell>
            <TableCell className={classes.cellNone} />
            <TableCell className={classes.cellNone}>{whiteScore.komi}</TableCell>
          </TableRow>
          <br />
          <TableRow>
            <TableCell className={classes.cellNone}>
              <strong className={classes.keyText}>Total score:</strong>
            </TableCell>
            <TableCell className={classes.cellNone}>
              <strong className={classes.keyText}>{blackScore.sum}</strong>
            </TableCell>
            <TableCell className={classes.cellNone}>
              <strong className={classes.keyText}>{whiteScore.sum}</strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};
