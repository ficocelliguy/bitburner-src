import React, {useEffect} from "react";
import { Box, Typography, Tooltip, Button } from "@mui/material";
import BatteryCharging90SharpIcon from "@mui/icons-material/BatteryCharging90Sharp";
import WarningAmberSharpIcon from "@mui/icons-material/WarningAmberSharp";
import WifiTetheringErrorSharpIcon from "@mui/icons-material/WifiTetheringErrorSharp";
import AutoAwesomeSharpIcon from "@mui/icons-material/AutoAwesomeSharp";
import { getThreatColor, getThreatSignalStrength, move } from "../models/netrunningMinigame";
import {
  GRID_SIZE,
  netrunDirections,
  NetrunningState,
} from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";
import char from "../assets/ProcessingMod/Purple.png";
import { NetrunGridEntity } from "./NetrunGridEntity";
import { useCyberdeckStyles } from "./cyberdeckStyles";


export function NetrunMinigame({complete} : {complete: () => void}) : React.ReactElement {
  const styles = useCyberdeckStyles();

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w") {
        move(netrunDirections.up);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowDown" || event.key === "s") {
        move(netrunDirections.down);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowLeft" || event.key === "a") {
        move(netrunDirections.left);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "ArrowRight" || event.key === "d") {
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
  const threatColor = getThreatColor(threat) || Settings.theme.button;

  return (
    <Box sx={{ display: "grid", justifyContent: "center", marginTop: "20px" }}>
      <div style={{ display: "inline-flex", gap: "30px", marginBottom: "15px", justifyContent: "space-between" }}>
        <Tooltip title={"Threat level: How strong of a signal is coming from nearby hidden countermeasures"}>
          <Typography>
            <WarningAmberSharpIcon sx={{ position: "relative", top: "5px" }} /> {(threat * 100).toPrecision(3)}%
          </Typography>
        </Tooltip>

        <Tooltip title={"Threat count: How many hidden threats are nearby."}>
          <Typography>
            <WifiTetheringErrorSharpIcon sx={{ position: "relative", top: "5px" }} /> {signals}
          </Typography>
        </Tooltip>

        <Tooltip title={"Rewards: The quality of the loot collected"}>
          <Typography>
            <AutoAwesomeSharpIcon sx={{ position: "relative", top: "5px" }} />
            {NetrunningState.rewardScore.toPrecision(3)}
          </Typography>
        </Tooltip>

        <Tooltip title={"Energy: Required for breaking ICE and firewalls"}>
          <Typography id={"netrunning-energy"} sx={{ ...(NetrunningState.shakingBattery ? styles.shake : {}) }}>
            <BatteryCharging90SharpIcon sx={{ position: "relative", top: "5px" }} />
            {(NetrunningState.energy * 100).toPrecision(3)}%
          </Typography>
        </Tooltip>
      </div>

      <Box
        sx={{
          flexDirection: "column",
          position: "relative",
          border: `1px solid ${Settings.theme.button}`,
          display: "flex",
          justifyContent: "center",
          boxShadow: `0 0 30px ${threatColor}`,
          ...(NetrunningState.shaking ? styles.shake : {}),
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

      <Button onClick={complete} sx={{ margin: "5px", ...(NetrunningState.energy ? {} : styles.buttonHighlight) }}>
        {NetrunningState.energy ? "End Netrun" : "Netrun Complete"}
      </Button>
    </Box>
  );
}
