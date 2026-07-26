import React from "react";
import { Box, Container, Tabs, Tab, Typography } from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventory } from "./ui/ModuleRackAndInventory";
import { cyberdeckStyles } from "./ui/cyberdeckStyles";
import { CyberDeckState } from "./models/CyberDeckState";
import { useRerender } from "../ui/React/hooks";
import { CraftingPage } from "./ui/CraftingPage";
import { ComponentSymbol } from "./ui/ComponentCost";
import { formatNumber } from "../ui/formatNumber";
import { componentSymbols } from "./models/constants";
import { Settings } from "../Settings/Settings";

export function CyberDeckRoot(): React.ReactElement {
  useRerender(1000);
  const [value, setValue] = React.useState(0);
  const { classes } = cyberdeckStyles();


  function handleChange(event: React.SyntheticEvent, newValue: number) {
    setValue(newValue);
  }
  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tabs
          variant="fullWidth"
          value={value}
          onChange={handleChange}
          sx={{ minWidth: "fit-content", maxWidth: "45%" }}
        >
          <Tab label="Module Management" icon={<MemoryIcon />} iconPosition={"start"} className={classes.tab} />
          <Tab label="Crafting" icon={<ConstructionSharpIcon />} iconPosition={"start"} className={classes.tab} />
          <Tab
            label="Netrunning"
            icon={<SettingsInputComponentSharpIcon />}
            iconPosition={"start"}
            className={classes.tab}
          />
        </Tabs>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            marginLeft: "5px",
            gap: "7px"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.ROM} />:{formatNumber(Math.floor(CyberDeckState.components.ROM), 0, 1000)}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.neurodes} />:{formatNumber(Math.floor(CyberDeckState.components.neurodes), 0, 1000)}
            </Typography>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.chips} />:{formatNumber(Math.floor(CyberDeckState.components.chips), 0, 1000)}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.ICE} />:{formatNumber(Math.floor(CyberDeckState.components.ICE), 0, 1000)}
            </Typography>
          </div>
        </div>
      </Box>
      {value === 0 && <ModuleRackAndInventory />}
      {value === 1 && <CraftingPage />}
      {value === 2 && <NetrunningPortal />}
    </Container>
  );
}
