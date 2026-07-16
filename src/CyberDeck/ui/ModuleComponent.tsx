import React, { useCallback, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import { CyberDeckEvents, getChargedModuleIDs } from "../models/CyberDeckState";
import { Settings } from "../../Settings/Settings";
import { DeckModule, ModuleType, Socket } from "../Types";
import { useRerender } from "../../ui/React/hooks";
import { getModuleIcon, getRarityColor } from "./Icons";
import { SocketIOPanel } from "./SocketIOPanel";
import { Tooltip } from "@mui/material";
import { displayStatBonuses } from "../models/cyberdeckStatBonuses";

export type DeckModuleProps = {
  module: DeckModule;
  index: number;
  draggingWireStarted?: ((moduleId: string, socketId: number) => void) | null;
  draggingWireEnded?: ((moduleId: string) => void) | null;
  currentDragSource?: Socket | null;
  isAnyDragActive?: boolean;
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
  isAnyDragActive,
}: DeckModuleProps) {
  const render = useRerender(200);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [tooltipPinnedOpen, setTooltipPinnedOpen] = React.useState(false);
  const updateDisplay = useCallback(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (isAnyDragActive) {
      setTooltipPinnedOpen(false);
    }
  }, [isAnyDragActive]);

  useEffect(() => {
    const clearSubscription = CyberDeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);

  function socketDragEnd() {
    draggingWireEnded?.(module.id);
  }

  function openTooltipOnRightClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      setTooltipPinnedOpen(!tooltipPinnedOpen);
    }
  }

  return (
    <Draggable draggableId={module.id} index={index} isDragDisabled={!allowShift}>
      {(provided, snapshot) => (
        <Tooltip
          title={displayStatBonuses(module.stats)}
          open={!isAnyDragActive && (tooltipOpen || tooltipPinnedOpen)}
          placement="top"
          arrow
          enterDelay={600}
          enterNextDelay={400}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(false)}
        >
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              border: `1px solid ${
                module.type === ModuleType.DeckConnection
                  ? "transparent"
                  : getChargedModuleIDs().includes(module.id)
                  ? getRarityColor(module)
                  : Settings.theme.button
              }`,
              margin: "3px",
              background: getChargedModuleIDs().includes(module.id)
                ? Settings.theme.button
                : Settings.theme.backgroundprimary,
              display: "inline-flex",
            }}
            onMouseUp={() => socketDragEnd()}
            onMouseDown={openTooltipOnRightClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div>{getModuleIcon(module)}</div>
            <SocketIOPanel
              moduleId={module.id}
              sockets={module.sockets}
              currentDragSource={currentDragSource}
              draggingWireStarted={draggingWireStarted}
              draggingInstalledModule={draggingInstalledModule}
            />
          </div>
        </Tooltip>
      )}
    </Draggable>
  );
}
