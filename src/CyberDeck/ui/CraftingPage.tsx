import React, { useCallback, useEffect } from "react";

import { Tooltip, Typography, Button } from "@mui/material";
import { craftICE, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";
import { ComponentCost, ComponentSymbol } from "./ComponentCost";
import {
  componentSymbols,
  ICEbreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "../models/constants";
import { getModIconComponent, getModuleIcon } from "./Icons";
import { ModuleType } from "../Types";
import { Settings } from "../../Settings/Settings";


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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation }}>
          <span>
            Craft <ComponentSymbol symbol={componentSymbols.ICE} /> ICEbreaker
          </span>
          <ComponentCost cost={ICEbreakerCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftPowerSupply}>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation }}
        >
          <span>Craft {getModIconComponent(ModuleType.PowerSupply, 16)} Power Supply Mod</span>
          <ComponentCost cost={powerSupplyCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftUplink}>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation }}
        >
          <span>Craft {getModIconComponent(ModuleType.Uplink, 16)} Uplink Mod</span>
          <ComponentCost cost={uplinkCraftingCost} />
        </div>
      </Button>
      <Button onClick={tryCraftProcessingModule}>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation }}
        >
          <span>Craft {getModIconComponent(ModuleType.ProcessingModule, 16)} Processing Mod</span>
          <ComponentCost cost={processingModuleCraftingCost} />
        </div>
      </Button>
    </div>
  );
}
