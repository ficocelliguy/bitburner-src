import React, {useEffect} from "react";
import { Box, Typography } from "@mui/material";
import { getThreatSignalStrength, initNetrunGrid, move } from "../models/netrunningMinigame";
import {
  GRID_SIZE,
  netrunDirections,
  NetrunningState,
} from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";
import char from "../assets/ProcessingMod/Purple.png";
import { NetrunGridEntity } from "./NetrunGridEntity";


export function NetrunMinigame() : React.ReactElement {

  useEffect(() => {
    initNetrunGrid();
    const listener = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        move(netrunDirections.up);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowDown") {
        move(netrunDirections.down);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowLeft") {
        move(netrunDirections.left);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowRight") {
        move(netrunDirections.right);
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  const {threat, signals} = getThreatSignalStrength()

  return (
    <Box sx={{ display: "grid", justifyContent: "center", marginTop: "20px" }}>
      <Typography>Threat level: {(threat * 100).toPrecision(3)}%    Threat signals: {signals}</Typography>
      <Box
        sx={{
          flexDirection: "column",
          position: "relative",
          border: `1px solid ${Settings.theme.button}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: NetrunningState.location[0] * (GRID_SIZE + 2),
            top: NetrunningState.location[1] * (GRID_SIZE + 2),
          }}
        >
          <img
            src={char}
            style={{ position: "relative", top: "1px", left: "1px" }}
            width={GRID_SIZE - 2}
            height={GRID_SIZE - 2}
            alt="character"
          />
        </div>
        {NetrunningState.grid.map((row, rowIndex) => (
          <Box key={rowIndex} sx={{ display: "flex", flexDirection: "row" }}>
            {row.map((entity, colIndex) => (
              <NetrunGridEntity key={colIndex} entity={entity} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}