import React from "react";
import { Box, Container, Tabs, Tab, Typography } from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import StackedBarChartOutlinedIcon from "@mui/icons-material/StackedBarChartOutlined";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventoryPage } from "./ui/ModuleRackAndInventoryPage";
import { cyberdeckStyles } from "./ui/cyberdeckStyles";
import { CyberdeckState } from "./models/CyberdeckState";
import { useRerender } from "../ui/React/hooks";
import { CraftingPage } from "./ui/CraftingPage";
import { ComponentSymbol } from "./ui/ComponentCost";
import { formatNumber } from "../ui/formatNumber";
import { componentSymbols } from "./models/constants";
import { Settings } from "../Settings/Settings";
import { StatsPage } from "./ui/StatsPage";

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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            marginLeft: "3px",
            marginRight: "5px",
            gap: "7px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.ROM} />:
              {formatNumber(Math.floor(CyberdeckState.components.ROM), 0, 1000)}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.neurodes} />:
              {formatNumber(Math.floor(CyberdeckState.components.neurodes), 0, 1000)}
            </Typography>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.chips} />:
              {formatNumber(Math.floor(CyberdeckState.components.chips), 0, 1000)}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
              <ComponentSymbol symbol={componentSymbols.ICE} />:
              {formatNumber(Math.floor(CyberdeckState.components.ICE), 0, 1000)}
            </Typography>
          </div>
        </div>
        <Tabs
          variant="standard"
          value={value}
          onChange={handleChange}
          sx={{ minWidth: "fit-content", maxWidth: "45%" }}
        >
          <Tab label="Manage Mods" icon={<MemoryIcon />} iconPosition={"start"} className={classes.tab} />
          <Tab
            label="Netrun"
            icon={<SettingsInputComponentSharpIcon />}
            iconPosition={"start"}
            className={classes.tab}
          />
          <Tab label="Craft" icon={<ConstructionSharpIcon />} iconPosition={"start"} className={classes.tab} />
          <Tab label="Stats" icon={<StackedBarChartOutlinedIcon />} iconPosition={"start"} className={classes.tab} />
        </Tabs>
      </Box>
      {value === 0 && <ModuleRackAndInventoryPage />}
      {value === 1 && <NetrunningPortal />}
      {value === 2 && <CraftingPage />}
      {value === 3 && <StatsPage />}
    </Container>
  );
}
