import React from "react";
import { Container } from "@mui/material";
import { ModuleRackAndInventory } from "./ui/ModuleRackAndInventory";

export function CyberDeckRoot(): React.ReactElement {
  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }}>
      <ModuleRackAndInventory />
    </Container>
  );
}
