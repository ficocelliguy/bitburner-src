import { Container, Tab, Tabs } from "@mui/material";
import React from "react";
import { GoInstructionsPage } from "./ui/GoInstructionsPage";
import { GridOn, Help, ManageSearch } from "@mui/icons-material";
import { GoStatusPage } from "./ui/GoStatusPage";
import { GoGameboardWrapper } from "./ui/GoGameboardWrapper";
import { boardStyles } from "./boardState/goStyles";

export function GoRoot(): React.ReactElement {
  const classes = boardStyles();
  const [value, setValue] = React.useState(0);

  function handleChange(event: React.SyntheticEvent, tab: number): void {
    setValue(tab);
  }

  return (
    <Container disableGutters maxWidth="lg" sx={{ mx: 0 }}>
      <Tabs variant="fullWidth" value={value} onChange={handleChange} sx={{ minWidth: "fit-content", maxWidth: "45%" }}>
        <Tab label="IPvGO Subnet" icon={<GridOn />} iconPosition={"start"} className={classes.tab} />
        <Tab label="Status and Rewards" icon={<ManageSearch />} iconPosition={"start"} className={classes.tab} />
        <Tab label="Instructions" icon={<Help />} iconPosition={"start"} className={classes.tab} />
      </Tabs>
      {value === 0 && <GoGameboardWrapper />}
      {value === 1 && <GoStatusPage />}
      {value === 2 && <GoInstructionsPage />}
    </Container>
  );
}
