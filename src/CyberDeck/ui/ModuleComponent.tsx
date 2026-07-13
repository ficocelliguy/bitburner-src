import React, { useCallback, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import { CyberDeckEvents, getChargedModuleIDs } from "../models/CyberDeckState";
import { Settings } from "../../Settings/Settings";
import { DeckModule, ModuleType, Socket } from "../Types";
import { useRerender } from "../../ui/React/hooks";
import { getModuleIcon, getRarityColor } from "./Icons";
import { SocketIOPanel } from "./SocketIOPanel";

export type DeckModuleProps = {
  module: DeckModule;
  index: number;
  draggingWireStarted?: ((moduleId: string, socketId: number) => void) | null;
  draggingWireEnded?: ((moduleId: string) => void) | null;
  currentDragSource?: Socket | null;
  draggingInstalledModule?: boolean;
  allowShift?: boolean;
};

export function ModuleComponent({
  module,
  index,
  allowShift,
  draggingWireStarted,
  draggingWireEnded,
  draggingInstalledModule,
  currentDragSource,
}: DeckModuleProps) {
  const render = useRerender(200);
  const updateDisplay = useCallback(() => {
    render();
  }, [render]);

  useEffect(() => {
    const clearSubscription = CyberDeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);


  function socketDragEnd() {
    draggingWireEnded?.(module.id);
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
            border: `1px solid ${
              module.type === ModuleType.DeckConnection ? "transparent": getChargedModuleIDs().includes(module.id) ? getRarityColor(module) : Settings.theme.button
            }`,
            margin: "3px",
            background: getChargedModuleIDs().includes(module.id)
              ? Settings.theme.button
              : Settings.theme.backgroundprimary,
            display: "inline-flex",
          }}
          onMouseUp={() => socketDragEnd()}
        >
          <div>{getModuleIcon(module)}</div>
          <SocketIOPanel moduleId={module.id} sockets={module.sockets} currentDragSource={currentDragSource} draggingWireStarted={draggingWireStarted} draggingInstalledModule={draggingInstalledModule} />
        </div>
      )}
    </Draggable>
  );
}
