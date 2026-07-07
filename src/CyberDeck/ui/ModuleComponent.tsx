import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { DroppableProvided, DroppableStateSnapshot, Draggable } from "react-beautiful-dnd";
import { DeckModule } from "../models/CyberDeckState";
import { Settings } from "../../Settings/Settings";

export type DeckModuleProps = {
  module: DeckModule;
  index: number;
  allowShift?: boolean;
};

export function ModuleComponent({ module, index, allowShift }: DeckModuleProps) {
  return (
    <Draggable draggableId={module.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style, border: "1px solid yellow", margin: "3px"}}
        >
          <Typography sx={{ userSelect: "none", background: Settings.theme.backgroundprimary }}>Drag Me {module.id}!</Typography>
        </div>
      )}
    </Draggable>
  );
}