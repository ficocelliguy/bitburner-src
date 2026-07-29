import React, { useCallback, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import { CyberdeckEvents, getChargedModuleIDs } from "../models/CyberdeckState";
import { Settings } from "../../Settings/Settings";
import { DeckModule, ModuleType, Socket } from "../Types";
import { useRerender } from "../../ui/React/hooks";
import { getModuleIcon, getRarityColor } from "./Icons";
import { SocketIOPanel } from "./SocketIOPanel";
import { Tooltip, Typography } from "@mui/material";
import { StatBonus } from "../models/StatBonuses";
import { cyberdeckStyles } from "./cyberdeckStyles";

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
  const { classes } = cyberdeckStyles();
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
    const clearSubscription = CyberdeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);

    const chargedModuleIDs = getChargedModuleIDs();

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
          title={
            <div>
              <h5 style={{ margin: "4px" }}>{module.type} [Rarity {module.level}]</h5>
             <div>{chargedModuleIDs.includes(module.id) ? "" : "(Not powered - no stat boosts.)"}</div>
              <div>
                <StatBonus stats={module.stats} />
              </div>
            </div>
          }
          open={!isAnyDragActive && (tooltipOpen || tooltipPinnedOpen)}
          placement={index % 2 === 0 ? "top-end" : "top-start"}
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
              zIndex: 1,
              ...provided.draggableProps.style,
              border: `2px solid ${
                module.type === ModuleType.DeckConnection
                  ? "transparent"
                  : getChargedModuleIDs().includes(module.id)
                  ? getRarityColor(module)
                  : Settings.theme.welllight
              }`,
              background: getChargedModuleIDs().includes(module.id)
                ? Settings.theme.button
                : Settings.theme.backgroundprimary,
            }}
            className={classes.modulePanel}
            onMouseUp={() => socketDragEnd()}
            onMouseDown={openTooltipOnRightClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div>{getModuleIcon(module)}</div>
            {module.type !== ModuleType.DeckConnection ? (
              <div className={classes.statsPanel}>
                <StatBonus stats={module.stats} />
              </div>
            ) : (
              <div style={{ width: "130px", margin: "3px" }}></div>
            )}
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
