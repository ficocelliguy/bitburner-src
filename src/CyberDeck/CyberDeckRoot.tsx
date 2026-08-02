import React from "react";
import { Box, Container, Tabs, Tab} from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import StackedBarChartOutlinedIcon from "@mui/icons-material/StackedBarChartOutlined";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventoryPage } from "./ui/ModuleRackAndInventoryPage";
import { cyberdeckStyles } from "./ui/cyberdeckStyles";
import { useRerender } from "../ui/React/hooks";
import { CraftingPage } from "./ui/CraftingPage";
import { StatsPage } from "./ui/StatsPage";
import { ComponentInventoryCount } from "./ui/ComponentInventoryCount";

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
      <ComponentInventoryCount />
      {value === 0 && <ModuleRackAndInventoryPage />}
      {value === 1 && <NetrunningPortal />}
      {value === 2 && <CraftingPage />}
      {value === 3 && <StatsPage />}
    </Container>
  );
}
