import { Box, Button, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import React, { useState } from "react";
import { boardSizes, opponentDetails, opponents } from "../boardState/goConstants";
import { Player } from "@player";
import { boardStyles } from "../boardState/goStyles";

interface IProps {
  search: (size: number, opponent: opponents) => void;
  cancel: () => void;
  showInstructions: () => void;
}

export const GoSubnetSearch = ({ search, cancel, showInstructions }: IProps): React.ReactElement => {
  const classes = boardStyles();
  const [opponent, setOpponent] = useState<opponents>(
    Player.go.previousGameFinalBoardState?.ai ?? opponents.SlumSnakes,
  );
  const [boardSize, setBoardSize] = useState(Player.go.previousGameFinalBoardState?.board?.[0]?.length ?? 7);

  const opponentFactions = [
    opponents.none,
    opponents.Netburners,
    opponents.SlumSnakes,
    opponents.TheBlackHand,
    opponents.Daedalus,
    opponents.Illuminati,
  ];

  function changeOpponent(event: SelectChangeEvent): void {
    const newOpponent = event.target.value as opponents;
    setOpponent(newOpponent);
  }

  function changeBoardSize(event: SelectChangeEvent) {
    const newSize = +event.target.value;
    setBoardSize(newSize);
  }

  const onSearch = () => {
    search(boardSize, opponent);
  };

  return (
    <>
      <Typography variant="h4">IPvGO Subnet Search</Typography>
      <Box className={`${classes.inlineFlexBox} ${classes.opponentTitle}`}>
        <Typography className={classes.opponentLabel}>{opponent !== opponents.none ? "Subnet owner: " : ""}</Typography>
        <Select value={opponent} onChange={changeOpponent} sx={{ mr: 1 }}>
          {opponentFactions.map((faction) => (
            <MenuItem key={faction} value={faction}>
              {`${faction} (${opponentDetails[faction].description})`}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Typography>{opponentDetails[opponent].flavorText}</Typography>
      <Box className={`${classes.inlineFlexBox} ${classes.opponentTitle}`}>
        <Typography className={classes.opponentLabel}>Subnet size: </Typography>
        <Select value={`${boardSize}`} onChange={changeBoardSize} sx={{ mr: 1 }}>
          {boardSizes.map((size) => (
            <MenuItem key={size} value={size}>
              {size}x{size}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box className={`${classes.inlineFlexBox} ${classes.opponentTitle}`}>
        <Button onClick={onSearch}>Search for Subnet</Button>
        <Button onClick={cancel}>Cancel</Button>
      </Box>
      <Typography onClick={showInstructions}>How to Play</Typography>
    </>
  );
};
