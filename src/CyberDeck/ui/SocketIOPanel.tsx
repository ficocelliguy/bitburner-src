import React from "react";
import { Box } from "@mui/material";
import { Socket, SocketList } from "../Types";
import { socketIsCovered } from "../models/moduleMutation";
import { getSocketId } from "../utils/moduleUtilities";
import { CyberdeckState, socketColors } from "../models/CyberdeckState";
import { Settings } from "../../Settings/Settings";
import { useCyberdeckStyles } from "./cyberdeckStyles";

export type SocketIOPanelProps = {
  moduleId: string,
  sockets: SocketList,
  draggingWireStarted?: ((moduleId: string, socketIndex: number) => void) | null;
  draggingInstalledModule?: boolean;
  currentDragSource?: Socket | null;
};

export function SocketIOPanel({
  moduleId,
  sockets,
  draggingWireStarted,
  draggingInstalledModule,
  currentDragSource,
}: SocketIOPanelProps) {
  const styles = useCyberdeckStyles();
  function socketDragStart(e: React.MouseEvent<HTMLButtonElement>, socketIndex: number) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    draggingWireStarted?.(moduleId, socketIndex);
  }

  function isConnected(index: number): boolean {
    if (currentDragSource?.moduleId === moduleId && currentDragSource?.socketIndex === index) {
      return true;
    }
    return CyberdeckState.connections.some(([source, destination]) => {
      return (
        (source.moduleId === moduleId && source.socketIndex === index) ||
        (destination.moduleId === moduleId && destination.socketIndex === index)
      );
    });
  }

  return (
    <Box sx={styles.socketIOPanel}>
      {sockets.map((isSocket, index) => (
        <div key={index} style={{ width: "24px", height: "24px", margin: "auto 5px" }}>
          {isSocket && (!socketIsCovered({ socketIndex: index, moduleId }) || draggingInstalledModule) ? (
            <Box
              component="button"
              id={getSocketId({ moduleId, socketIndex: index })}
              sx={styles.socket}
              onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => socketDragStart(e, index)}
              style={{
                border: `6px solid ${socketColors[index]}`,
                background: isConnected(index) ? socketColors[index] : Settings.theme.backgroundprimary,
                pointerEvents: draggingWireStarted ? "auto" : "none",
              }}
            />
          ) : (
            <div style={{ width: "20px", height: "20px" }}></div>
          )}
        </div>
      ))}
    </Box>
  );
}