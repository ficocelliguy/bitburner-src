import React, { useEffect } from "react";
import { Box, Container, Tabs, Tab} from "@mui/material";
import { NetrunningPortal } from "./ui/NetrunningPortal";
import MemoryIcon from "@mui/icons-material/Memory";
import ConstructionSharpIcon from "@mui/icons-material/ConstructionSharp";
import StackedBarChartOutlinedIcon from "@mui/icons-material/StackedBarChartOutlined";
import SettingsInputComponentSharpIcon from "@mui/icons-material/SettingsInputComponentSharp";
import { ModuleRackAndInventoryPage } from "./ui/ModuleRackAndInventoryPage";
import { useCyberdeckStyles } from "./ui/cyberdeckStyles";
import { useRerender } from "../ui/React/hooks";
import { CraftingPage } from "./ui/CraftingPage";
import { StatsPage } from "./ui/StatsPage";
import { ComponentInventoryCount } from "./ui/ComponentInventoryCount";
import { gainCyberdeck } from "./effects";

export function CyberDeckRoot(): React.ReactElement {
  useRerender(1000);
  const [value, setValue] = React.useState(0);
  const styles = useCyberdeckStyles();

  useEffect(() => {
    // TODO-fico: this is temporary setup for testers
    gainCyberdeck();
  }, []);


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
          <Tab label="Manage Mods" icon={<MemoryIcon />} iconPosition={"start"} sx={styles.tab} />
          <Tab
            label="Netrun"
            icon={<SettingsInputComponentSharpIcon />}
            iconPosition={"start"}
            sx={styles.tab}
          />
          <Tab label="Craft" icon={<ConstructionSharpIcon />} iconPosition={"start"} sx={styles.tab} />
          <Tab label="Stats" icon={<StackedBarChartOutlinedIcon />} iconPosition={"start"} sx={styles.tab} />
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
