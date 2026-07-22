import React from "react";
import { Container, Tabs, Tab, Typography } from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventory } from "./ui/ModuleRackAndInventory";
import { cyberdeckStyles } from "./ui/cyberdeckStyles";
import { CyberDeckState } from "./models/CyberDeckState";
import { useRerender } from "../ui/React/hooks";
import { CraftingPage } from "./ui/CraftingPage";

export function CyberDeckRoot(): React.ReactElement {
  useRerender(1000);
  const [value, setValue] = React.useState(0);
  const { classes } = cyberdeckStyles();


  function handleChange(event: React.SyntheticEvent, newValue: number) {
    setValue(newValue);
  }
  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }}>
      <Tabs variant="fullWidth" value={value} onChange={handleChange} sx={{ minWidth: "fit-content", maxWidth: "45%" }}>
        <Tab label="Module Management" icon={<MemoryIcon />} iconPosition={"start"} className={classes.tab} />
        <Tab label="Crafting" icon={<ConstructionSharpIcon />} iconPosition={"start"} className={classes.tab} />
        <Tab
          label="Netrunning"
          icon={<SettingsInputComponentSharpIcon />}
          iconPosition={"start"}
          className={classes.tab}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            margin: "5px auto 0 10px",
          }}
        >
          <Typography sx={{ fontSize: "10px" }}>ROM: {Math.floor(CyberDeckState.components.ROM)}</Typography>
          <Typography sx={{ fontSize: "10px" }}>Neurodes: {Math.floor(CyberDeckState.components.neurodes)}</Typography>
          <Typography sx={{ fontSize: "10px" }}>Chips: {Math.floor(CyberDeckState.components.chips)}</Typography>
          <Typography sx={{ fontSize: "10px" }}>ICEbreakers: {Math.floor(CyberDeckState.components.ICE)}</Typography>
        </div>
      </Tabs>
      {value === 0 && <ModuleRackAndInventory />}
      {value === 1 && <CraftingPage />}
      {value === 2 && <NetrunningPortal />}
    </Container>
  );
}
