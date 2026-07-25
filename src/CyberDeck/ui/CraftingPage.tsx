import React, { useCallback, useEffect } from "react";

import { Tooltip, Typography, Button } from "@mui/material";
import { craftICE, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";
import { ComponentCost } from "./ComponentCost";
import {
  ICEbreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "../models/constants";


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
      <Button onClick={tryCraftICE}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Craft ICE</span>
          <ComponentCost cost={ICEbreakerCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftPowerSupply}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Craft Power Supply</span>
          <ComponentCost cost={powerSupplyCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftUplink}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Craft Uplink</span>
          <ComponentCost cost={uplinkCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftProcessingModule}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Craft Processing Module</span>
          <ComponentCost cost={processingModuleCraftingCost} />
        </div>
      </Button>
    </div>
  );
}
