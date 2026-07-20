import React, { useCallback, useEffect } from "react";

import { Tooltip, Typography, Button } from "@mui/material";
import { craftICE, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";


export function CraftingPage(): React.ReactElement {

  function tryCraftICE() {
    craftICE();
  }

  function tryCraftPowerSupply() {
    craftPowerSupply();
  }

  function tryCraftUplink() {
    craftUplink();
  }

  function tryCraftProcessingModule() {
    craftProcessingModule();
  }

  return (
    <div style={{ padding: "20px" }}>
      <Button onClick={tryCraftICE}>Craft ICE</Button>
      <Button onClick={tryCraftPowerSupply}>Craft Power Supply</Button>
      <Button onClick={tryCraftUplink}>Craft Uplink</Button>
      <Button onClick={tryCraftProcessingModule}>Craft Processing Module</Button>
    </div>
  );
}
