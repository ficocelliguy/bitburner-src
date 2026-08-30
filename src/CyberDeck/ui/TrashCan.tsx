import React from "react";
import { Typography, Tooltip } from "@mui/material";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import { Droppable } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";
import { TRASH_CAN } from "./ModuleRackAndInventoryPage";

export function TrashCan() {
  return (
    <Droppable droppableId={TRASH_CAN} direction="vertical">
      {(provided, snapshot) => (
        <Tooltip
          title={
            <div>
              <Typography variant="h6" style={{ margin: "4px", textAlign: "center" }}>
                Mod Recycling
              </Typography>
              <Typography sx={{ width: "300px" }}>Drag mods here to disassemble them for a few components.</Typography>
            </div>
          }
        >
          <div
            ref={provided.innerRef}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "90px",
              width: "480px",
              marginTop: "10px",
              backgroundColor: snapshot.isDraggingOver ? Settings.theme.warningdark : Settings.theme.backgroundprimary,
              border: `1px solid ${Settings.theme.error}`,
            }}
          >
            <RecyclingOutlinedIcon style={{ fontSize: 40, color: Settings.theme.error }} />
            <div style={{ display: "none" }}>{provided.placeholder}</div>
          </div>
        </Tooltip>
      )}
    </Droppable>
  );
}
