import React from "react";
import { Brand, NetrunTargets } from "@enums";
import { NetrunningState } from "../models/NetrunningState";
import { CyberdeckEvents } from "../models/CyberdeckState";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { BRAND_DETAILS } from "../models/constants";
import { Settings } from "../../Settings/Settings";

export function NetrunTargetSelect(): React.ReactElement {
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", width: "300px", margin: "40px auto" }}>
      <Typography>Select a target:</Typography>
      <NetrunTargetDescription brand={NetrunTargets.OmegaSoftware} setTarget={setTarget} />
      <NetrunTargetDescription brand={NetrunTargets.BachmanAndAssociates} setTarget={setTarget} />
      <NetrunTargetDescription brand={NetrunTargets.BladeIndustries} setTarget={setTarget} />
      <NetrunTargetDescription brand={NetrunTargets.OmniaCybersystems} setTarget={setTarget} />
      <Button onClick={cancel}>Cancel</Button>
    </Box>
  );
}

function NetrunTargetDescription({
  brand,
  setTarget,
}: {
  brand: NetrunTargets;
  setTarget: (b: NetrunTargets) => void;
}) {
  return (
    <div>
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
        <Button onClick={() => setTarget(brand)}>
          <div style={{ width: "282px" }}>
            <Typography sx={{ fontWeight: "bold" }}>{brand}</Typography>
            <Typography sx={{ fontStyle: "italic", color: Settings.theme.secondary, size: "11px" }}>
              {BRAND_DETAILS[brand].specialty}
            </Typography>
          </div>
        </Button>
      </Tooltip>
    </div>
  );
}
