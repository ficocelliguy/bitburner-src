import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { DeckModule } from "../Types";
import { ModuleComponent } from "./ModuleComponent";


export function ModuleLootCover({ module, index }: { module: DeckModule, index: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Button onClick={() => setOpen(true)}>
      {open ? "" : "Click to reveal..."}
      <div style={{ opacity: open ? 1 : 0, transition: "opacity 1s ease-in" }}>
        <ModuleComponent module={module} index={index} allowShift={false} />
      </div>
    </Button>
  );
}