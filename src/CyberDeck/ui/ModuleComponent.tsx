import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { DroppableProvided, DroppableStateSnapshot, Draggable } from "react-beautiful-dnd";
import { DeckModule } from "../models/CyberDeckState";

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
          style={{ ...provided.draggableProps.style, border: "1px solid yellow"}}
        >
          <Typography sx={{ userSelect: "none" }}>Drag Me {module.id}!</Typography>
        </div>
      )}
    </Draggable>
  );
}