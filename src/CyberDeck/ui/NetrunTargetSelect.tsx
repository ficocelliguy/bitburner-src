import React from "react";
import { Brand, NetrunTargets } from "@enums";
import { NetrunningState } from "../models/NetrunningState";
import { CyberdeckEvents } from "../models/CyberdeckState";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { BRAND_DETAILS } from "../models/constants";
import { Settings } from "../../Settings/Settings";
import { CircuitryBackground } from "../assets/circuitry";
import { useNetrunTargetStyles } from "./cyberdeckStyles";

export function NetrunTargetSelect(): React.ReactElement {
  const styles = useNetrunTargetStyles();

  function setTarget(target: NetrunTargets | Brand.Unknown) {
    NetrunningState.target = target;
    CyberdeckEvents.emit();
  }

  function cancel() {
    NetrunningState.target = Brand.Unknown;
    NetrunningState.isNetrunning = false;
    CyberdeckEvents.emit();
  }

  return (
    <div>
      <Box sx={styles.circuitry}>{CircuitryBackground}</Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", width: "330px", margin: "40px auto" }}>
        <Typography sx={{ textAlign: "center" }}>Select a target:</Typography>
        <NetrunTargetDescription brand={NetrunTargets.OmegaSoftware} setTarget={setTarget} x={-60} y={0} />
        <NetrunTargetDescription brand={NetrunTargets.BachmanAndAssociates} setTarget={setTarget} x={70} y={-30} />
        <NetrunTargetDescription brand={NetrunTargets.BladeIndustries} setTarget={setTarget} x={30} y={-10} />
        <NetrunTargetDescription brand={NetrunTargets.OmniaCybersystems} setTarget={setTarget} x={-60} y={0} />
        <Button sx={{ marginTop: "10px" }} onClick={cancel}>
          Cancel
        </Button>
      </Box>
    </div>
  );
}

function NetrunTargetDescription({
  brand,
  setTarget,
  x,
  y,
}: {
  brand: NetrunTargets;
  setTarget: (b: NetrunTargets) => void;
  x?: number;
  y?: number;
}) {
  const styles = useNetrunTargetStyles();
  return (
    <div style={{ position: "relative", left: `${x ?? 0}%`, top: `${y ?? 0}px` }}>
      <Tooltip
        title={
          <div>
            <Typography>{BRAND_DETAILS[brand].specialtyLong}</Typography>
            <Typography sx={{ fontStyle: "italic", color: Settings.theme.secondary, size: "11px" }}>
              {BRAND_DETAILS[brand].tagline}
            </Typography>
          </div>
        }
      >
        <Box component="button" sx={styles.microchipButton} onClick={() => setTarget(brand)}>
          <Box component="span" sx={styles.chipCore}>
            <Typography sx={{ fontWeight: "bold" }}>{brand}</Typography>
            <Typography sx={{ fontStyle: "italic", color: Settings.theme.secondary, size: "11px" }}>
              {BRAND_DETAILS[brand].specialty}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </div>
  );
}
