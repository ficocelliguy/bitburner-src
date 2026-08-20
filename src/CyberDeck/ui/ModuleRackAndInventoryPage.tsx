import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Container, Box, Button, Typography, FormControl, InputLabel, OutlinedInput } from "@mui/material";
import { DragDropContext, Droppable, DropResult, DragStart } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";
import { useRerender } from "../../ui/React/hooks";
import { CyberdeckEvents, CyberdeckState } from "../models/CyberdeckState";
import { ModuleComponent } from "./ModuleComponent";
import {
  createConnection,
  disconnectSocket,
  ejectOverloadedModules,
  handleModuleMoved,
} from "../models/moduleMutation";
import { DrawWiresOnCanvas } from "./socketWireConnections";
import { Socket } from "../Types";
import { getCurrentRackSize } from "../utils/moduleUtilities";
import { createInitialModules, DeckConnection } from "../models/createModule";
import { useCyberdeckStyles } from "./cyberdeckStyles";
import { TrashCan } from "./TrashCan";
import { getFilteredStoredModules } from "../utils/modStatsUtils";

export const MODULE_STORAGE = "moduleStorage";
export const INSTALLED_MODULES = "installedModules";
export const TRASH_CAN = "trashcan";

export function ModuleRackAndInventoryPage(): React.ReactElement {
  const render = useRerender();
  const styles = useCyberdeckStyles();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draggingInstalledModule, setDraggingInstalledModule] = useState(false);
  const [draggingStoredModule, setDraggingStoredModule] = useState(false);
  const [draggingWire, setDraggingWire] = useState<Socket | null>(null);
  const [modFilter, setModFilter] = useState("");

  const updateDisplay = useCallback(() => {
    render();
  }, [render]);

  useEffect(() => {
    const clearSubscription = CyberdeckEvents.subscribe(() => updateDisplay());
    return () => clearSubscription();
  }, [updateDisplay]);

  useLayoutEffect(() => {
    DrawWiresOnCanvas(canvas.current, draggingWire);
  });

  function onDragStart(result: DragStart) {
    document.body.style.overflow = "hidden";
    setDraggingInstalledModule(result.source.droppableId === INSTALLED_MODULES);
    setDraggingStoredModule(result.source.droppableId === MODULE_STORAGE);
  }

  function onDragEnd(result: DropResult) {
    document.body.style.overflow = "unset";
    handleModuleMoved(result);
    setDraggingInstalledModule(false);
    setDraggingStoredModule(false);
    // Continue animating for a short time as dragged components settle
    const interval = setInterval(() => {
      updateDisplay();
    }, 60);
    setTimeout(() => clearInterval(interval), 600);
  }

  function draggingWireStarted(moduleId: string, socketIndex: number) {
    disconnectSocket({ moduleId, socketIndex });
    setDraggingWire({ moduleId, socketIndex });
  }

  function draggingWireEnded(moduleId: string) {
    if (!draggingWire) return;
    setDraggingWire(null);
    createConnection(draggingWire, { moduleId, socketIndex: draggingWire.socketIndex });
    ejectOverloadedModules();
    updateDisplay();
  }

  function clearDraggedWire() {
    setDraggingWire(null);
    updateDisplay();
  }

  function redrawDraggedWire(e: React.MouseEvent) {
    if (draggingWire || draggingInstalledModule || draggingStoredModule) {
      DrawWiresOnCanvas(canvas.current, draggingWire, { x: e.clientX, y: e.clientY });
    }
  }

  function isMaxModulesInstalled() {
    return CyberdeckState.installedModules.length >= getCurrentRackSize();
  }

  function handleModFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    setModFilter(e.target.value);
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ mx: 0 }}
      onMouseLeave={clearDraggedWire}
      onMouseUp={clearDraggedWire}
      onMouseMove={redrawDraggedWire}
      onMouseEnter={() => updateDisplay()}
    >
      <Button
        onClick={() => {
          createInitialModules(true);
          CyberdeckEvents.emit();
        }}
      >
        Testing tool: Generate new mods
      </Button>

      <Container disableGutters maxWidth={false}>
        <canvas
          ref={canvas}
          width={"800px"}
          height={"800px"}
          style={{ position: "absolute", zIndex: 5999, pointerEvents: "none" }}
        ></canvas>
        <div style={{ display: "flex", flexDirection: "row", minWidth: "990px", maxWidth: "1100px" }}>
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={() => updateDisplay()}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              whiteSpace="nowrap"
              style={{
                margin: "10px",
                height: "calc(100vh - 250px)",
                width: "480px",
                backgroundColor: Settings.theme.backgroundprimary,
                overflowX: "scroll",
              }}
            >
              <Droppable droppableId={DeckConnection.id} direction="vertical" isDropDisabled>
                {(provided) => (
                  <span ref={provided.innerRef}>
                    <ModuleComponent
                      module={DeckConnection}
                      index={-1}
                      draggingWireStarted={draggingWireStarted}
                      draggingWireEnded={draggingWireEnded}
                      currentDragSource={draggingWire}
                      isAnyDragActive={!!draggingWire || draggingInstalledModule || draggingStoredModule}
                      allowShift={false}
                    />
                  </span>
                )}
              </Droppable>
              <Droppable
                droppableId={INSTALLED_MODULES}
                direction="vertical"
                isDropDisabled={isMaxModulesInstalled() && !draggingInstalledModule}
              >
                {(provided, snapshot) => (
                  <Box
                    display="flex"
                    flexGrow="1"
                    flexDirection="column"
                    alignItems="center"
                    whiteSpace="nowrap"
                    style={{
                      width: "462px",
                      backgroundColor: Settings.theme.backgroundprimary,
                    }}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {CyberdeckState.installedModules.map((module, index) => (
                      <ModuleComponent
                        key={module.id}
                        module={module}
                        index={index}
                        draggingWireStarted={draggingWireStarted}
                        draggingWireEnded={draggingWireEnded}
                        draggingInstalledModule={draggingInstalledModule}
                        currentDragSource={draggingWire}
                        isAnyDragActive={!!draggingWire || draggingInstalledModule || draggingStoredModule}
                        allowShift={!draggingWire}
                      />
                    ))}
                    {provided.placeholder}
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                      }}
                    >
                      {Array.from({ length: getCurrentRackSize() }).map((_, index) => (
                        <Box
                          key={index}
                          sx={styles.modulePanel}
                          style={{
                            height: "60px",
                            border: `1px solid ${Settings.theme.button}`,
                          }}
                        >
                          <Box
                            key={index}
                            sx={styles.emptyModuleSlot}
                            style={{
                              backgroundColor:
                                snapshot.isDraggingOver && draggingStoredModule
                                  ? Settings.theme.well
                                  : Settings.theme.backgroundprimary,
                            }}
                          />
                        </Box>
                      ))}
                    </div>
                  </Box>
                )}
              </Droppable>
            </Box>
            <Box
              display="flex"
              flexGrow="1"
              flexDirection="column"
              alignItems="center"
              whiteSpace="nowrap"
              style={{
                margin: "6px",
                width: "462px",
                maxHeight: "calc(100vh - 250px)",
              }}
            >
              <Droppable droppableId={MODULE_STORAGE} direction="vertical">
                {(provided) => (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    whiteSpace="nowrap"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      maxHeight: "calc(100vh - 360px)",
                      border: `1px solid ${Settings.theme.button}`,
                      backgroundColor: Settings.theme.backgroundprimary,
                      padding: "3px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        height: "60px",
                        width: "462px",
                        margin: "3px",
                        border: `1px solid ${Settings.theme.well}`,
                      }}
                    >
                      <Typography variant="h6" sx={{ padding: "10px" }}>
                        Mod Storage:{" "}
                        <span
                          style={{
                            color:
                              CyberdeckState.storedModules.length > CyberdeckState.modStorageSize
                                ? Settings.theme.warning
                                : Settings.theme.primary,
                          }}
                        >
                          {CyberdeckState.storedModules.length} / {Math.floor(CyberdeckState.modStorageSize)}
                        </span>
                      </Typography>
                      <div>
                        <FormControl sx={{ m: 0.5, width: "25ch", padding: "6px" }} variant="outlined">
                          <InputLabel sx={{ fontSize: "12px" }} size="small" htmlFor={`mod-filter-input`}>
                            Filter Stored Mods
                          </InputLabel>
                          <OutlinedInput
                            size="small"
                            sx={{ fontSize: "12px" }}
                            id={`mod-filter-input`}
                            type={"text"}
                            label="Filter Stored Mods"
                            onChange={handleModFilterChange}
                          />
                        </FormControl>
                      </div>
                    </div>
                    <Box
                      display="flex"
                      flexGrow="1"
                      flexDirection="column"
                      alignItems="center"
                      whiteSpace="nowrap"
                      style={{ height: "calc(100vh - 420px)", overflowY: "scroll" }}
                    >
                      {getFilteredStoredModules(modFilter).map((module, index) => (
                        <ModuleComponent
                          key={module.id}
                          module={module}
                          index={index}
                          allowShift={!draggingWire}
                          isAnyDragActive={!!draggingWire || draggingInstalledModule || draggingStoredModule}
                        />
                      ))}
                      {provided.placeholder}
                    </Box>
                  </Box>
                )}
              </Droppable>
              <TrashCan />
            </Box>
          </DragDropContext>
        </div>
      </Container>
    </Container>
  );
}
