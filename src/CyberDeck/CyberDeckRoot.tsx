import React from "react";
import { Container, Tabs, Tab } from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventory } from "./ui/ModuleRackAndInventory";
import { cyberdeckStyles } from "./ui/cyberdeckStyles";

export function CyberDeckRoot(): React.ReactElement {
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
      </Tabs>
      {value === 0 && <ModuleRackAndInventory />}
      {value === 2 && <NetrunningPortal />}
    </Container>
  );
}
