import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { DeckModule } from "../Types";
import { ModuleComponent } from "./ModuleComponent";
import { Settings } from "../../Settings/Settings";


export function ModuleLootCover({ module, index }: { module: DeckModule, index: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Typography
      onClick={() => setOpen(true)}
      sx={
        open
          ? {
              backgroundColor: Settings.theme.backgroundprimary,
              height: "64px",
            }
          : {
              cursor: "pointer",
              backgroundColor: Settings.theme.backgroundprimary,
              border: `1px solid ${Settings.theme.button}`,
              height: "64px",
              "&:hover": { backgroundColor: Settings.theme.button },
            }
      }
    >
      {open ? "   " : "Click to reveal..."}
      <div style={{ opacity: open ? 1 : 0, transition: "opacity 1s ease-in" }}>
        <ModuleComponent module={module} index={index} />
      </div>
    </Typography>
  );
}