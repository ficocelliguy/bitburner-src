import React from "react";
import { Socket, SocketList } from "../Types";
import { socketIsCovered } from "../models/moduleMutation";
import { getSocketId } from "../utils/moduleUtilities";
import { CyberDeckState, socketColors } from "../models/CyberDeckState";
import { Settings } from "../../Settings/Settings";

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
  function socketDragStart(e: React.MouseEvent<HTMLButtonElement>, socketIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    draggingWireStarted?.(moduleId, socketIndex);
  }

  function isConnected(index: number): boolean {
    if (currentDragSource?.moduleId === moduleId && currentDragSource?.socketIndex === index) {
      return true;
    }
    return CyberDeckState.connections.some(([source, destination]) => {
      return (
        (source.moduleId === moduleId && source.socketIndex === index) ||
        (destination.moduleId === moduleId && destination.socketIndex === index)
      );
    });
  }

  return (
    <div style={{ display: "inline-flex" }}>
      {sockets.map((isSocket, index) => (
        <div key={index} style={{ width: "24px", height: "24px", margin: "5px" }}>
          {isSocket && (!socketIsCovered({ socketIndex: index, moduleId }) || draggingInstalledModule) ? (
            <button
              id={getSocketId({ moduleId, socketIndex: index })}
              onMouseDown={(e) => socketDragStart(e, index)}
              style={{
                height: "24px",
                width: "24px",
                borderRadius: "50%",
                border: `6px solid ${socketColors[index]}`,
                cursor: "crosshair",
                background: isConnected(index) ? socketColors[index] : Settings.theme.backgroundprimary,
                pointerEvents: draggingWireStarted ? "auto" : "none",
              }}
            ></button>
          ) : (
            <div style={{ width: "20px", height: "20px" }}></div>
          )}
        </div>
      ))}
    </div>
  );
}