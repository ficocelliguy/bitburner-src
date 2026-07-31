import React, { useState, useRef, useEffect, useCallback } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
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
import { cyberdeckStyles } from "./cyberdeckStyles";
import { prestigeCyberdeck } from "../utils/prestigeCyberdeck";

export const MODULE_STORAGE = "moduleStorage";
export const INSTALLED_MODULES = "installedModules";
export const TRASH_CAN = "trashcan";

export function ModuleRackAndInventoryPage(): React.ReactElement {
  const render = useRerender();
  const {classes} = cyberdeckStyles();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draggingInstalledModule, setDraggingInstalledModule] = useState(false);
  const [draggingStoredModule, setDraggingStoredModule] = useState(false);
  const [draggingWire, setDraggingWire] = useState<Socket | null>(null);

  const updateDisplay = useCallback(() => {
    render();
    DrawWiresOnCanvas(canvas.current);
  }, [render]);

  useEffect(() => {
    const clearSubscription = CyberdeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);

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
    setTimeout(() => clearInterval(interval), 400);
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
      <Typography variant={"h4"} sx={{ mx: 0, pb: 10 }}>
        Module Edit Page
      </Typography>
      <Button onClick={() => {prestigeCyberdeck(true); createInitialModules(); CyberdeckEvents.emit()}}>Generate new mods</Button>

      <Container disableGutters maxWidth={false}>
        <canvas
          ref={canvas}
          width={"800px"}
          height={"800px"}
          style={{ position: "absolute", zIndex: 5999, pointerEvents: "none" }}
        ></canvas>
        <div style={{ border: "1px solid blue", display: "flex", flexDirection: "row" }}>
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={() => updateDisplay()}>
            <Box
              display="flex"
              flexGrow="1"
              flexDirection="column"
              alignItems="center"
              whiteSpace="nowrap"
              style={{
                margin: "10px",
                height: "calc(100vh - 250px)",
                width: "476px",
                border: "1px solid red",
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
                      width: "476px",
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
                        <div
                          key={index}
                          className={classes.modulePanel}
                          style={{
                            height: "60px",
                            border: `1px solid ${Settings.theme.button}`,
                          }}
                        >
                          <div
                            key={index}
                            className={classes.emptyModuleSlot}
                            style={{
                              backgroundColor:
                                snapshot.isDraggingOver && draggingStoredModule
                                  ? Settings.theme.well
                                  : Settings.theme.backgroundprimary,
                            }}
                          ></div>
                        </div>
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
                margin: "10px",
                width: "476px",
                maxHeight: "calc(100vh - 250px)",
              }}
            >
              <Droppable droppableId={MODULE_STORAGE} direction="vertical">
                {(provided, snapshot) => (
                  <Box
                    display="flex"
                    flexGrow="1"
                    flexDirection="column"
                    alignItems="center"
                    whiteSpace="nowrap"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      maxHeight: "calc(100vh - 360px)",
                      border: "1px solid green",
                      backgroundColor: Settings.theme.backgroundprimary,
                      overflowX: "scroll",
                    }}
                  >
                    {CyberdeckState.storedModules.map((module, index) => (
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
                )}
              </Droppable>
              <Droppable droppableId={TRASH_CAN} direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100px",
                      width: "476px",
                      marginTop: "10px",
                      backgroundColor: snapshot.isDraggingOver
                        ? Settings.theme.warningdark
                        : Settings.theme.backgroundprimary,
                      border: `1px solid ${Settings.theme.error}`,
                    }}
                  >
                    <RecyclingOutlinedIcon style={{ fontSize: 40, color: Settings.theme.error }} />
                  </div>
                )}
              </Droppable>
            </Box>
          </DragDropContext>
        </div>
      </Container>
    </Container>
  );
}
