import React from "react";
import { Brand } from "@enums";
import { NetrunningState } from "../models/NetrunningState";
import { CyberdeckEvents } from "../models/CyberdeckState";
import { Box, Button, Typography } from "@mui/material";
import { BRAND_DETAILS } from "../models/constants";
import { Settings } from "../../Settings/Settings";

export function NetrunTargetSelect(): React.ReactElement {
  function setTarget(target: Brand) {
    NetrunningState.target = target;
    CyberdeckEvents.emit();
  }

  function cancel() {
    NetrunningState.target = Brand.Unknown;
    NetrunningState.isNetrunning = false;
    CyberdeckEvents.emit();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography>Select a target:</Typography>
      <Button onClick={() => setTarget(Brand.OmegaSoftware)}>
        <NetrunTargetDescription brand={Brand.OmegaSoftware} />
      </Button>
      <Button onClick={() => setTarget(Brand.BachmanAndAssociates)}>
        <NetrunTargetDescription brand={Brand.BachmanAndAssociates} />
      </Button>
      <Button onClick={() => setTarget(Brand.BladeIndustries)}>
        <NetrunTargetDescription brand={Brand.BladeIndustries} />
      </Button>
      <Button onClick={() => setTarget(Brand.OmniaCybersystems)}>
        <NetrunTargetDescription brand={Brand.OmniaCybersystems} />
      </Button>
      <Button onClick={cancel}>Cancel</Button>
    </Box>
  );
}

function NetrunTargetDescription({ brand }: { brand: Brand }) {
  return (
    <div>
      <Typography sx={{ fontWeight: "bold" }}>{brand}</Typography>
      <Typography sx={{ fontStyle: "italic", color: Settings.theme.secondary, size: "11px" }}>
        {BRAND_DETAILS[brand].specialty}
      </Typography>
    </div>
  );
}
