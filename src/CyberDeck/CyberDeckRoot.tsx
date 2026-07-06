import React from "react";
import { Container } from "@mui/material";
import { ModuleManagement } from "./ui/ModuleManagement";

export function CyberDeckRoot(): React.ReactElement {
  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }}>
      <ModuleManagement />
    </Container>
  );
}
