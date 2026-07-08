import React from "react";
import { Typography } from "@mui/material";
import {  Draggable } from "react-beautiful-dnd";
import { DeckModule, socketColors } from "../models/CyberDeckState";
import { Settings } from "../../Settings/Settings";

export type DeckModuleProps = {
  module: DeckModule;
  index: number;
  draggingWireStarted: (moduleId: string, socketId: number) => void;
  allowShift?: boolean;
};

export function ModuleComponent({ module, index, allowShift, draggingWireStarted }: DeckModuleProps) {
  function socketClicked(e: React.MouseEvent<HTMLButtonElement>, socketIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    draggingWireStarted(module.id, socketIndex);
  }

  return (
    <Draggable draggableId={module.id} index={index} isDragDisabled={!allowShift}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            border: "1px solid yellow",
            margin: "3px",
            background: Settings.theme.backgroundprimary,
            display: "inline-flex",
          }}
        >
          <div>
            <Typography sx={{ userSelect: "none", width: "140px", marginTop: "5px" }}>Drag Me {module.id}!</Typography>
          </div>
          <div style={{ display: "inline-flex" }}>
            {module.sockets.map((isSocket, index) => (
              <div key={index} style={{ width: "24px", height: "24px", margin: "5px" }}>
                {isSocket ? (
                  <button
                    onMouseDown={(e) => socketClicked(e, index)}
                    style={{
                      height: "24px",
                      width: "24px",
                      borderRadius: "50%",
                      border: `6px solid ${socketColors[index]}`,
                      cursor: "crosshair",
                      background: Settings.theme.backgroundprimary,
                    }}
                  ></button>
                ) : (
                  <div style={{ width: "20px", height: "20px" }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Draggable>
  );
}