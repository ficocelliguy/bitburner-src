import React, { useState, useRef, useEffect, useCallback } from "react";
import { Container, Typography, Box } from "@mui/material";
import { DragDropContext, Droppable, DropResult, DragUpdate, DragStart } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";
import { useRerender } from "../../ui/React/hooks";
import { CyberDeckEvents, CyberDeckState } from "../models/CyberDeckState";
import { ModuleComponent } from "./ModuleComponent";
import {
  createConnection,
  disconnectSocket,
  ejectOverloadedModules,
  handleModuleMoved,
} from "../models/ModuleMutation";
import { DrawWiresOnCanvas } from "./socketWireConnections";
import { Socket } from "../Types";
import { getCurrentRackSize } from "../utils/moduleUtilities";

export const MODULE_STORAGE = "moduleStorage";
export const INSTALLED_MODULES = "installedModules";

export function ModuleRackAndInventory(): React.ReactElement {
  const render = useRerender();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draggingInstalledModule, setDraggingInstalledModule] = useState(false);
  const [draggingStoredModule, setDraggingStoredModule] = useState(false);
  const [draggingWire, setDraggingWire] = useState<Socket | null>(null);

  const updateDisplay = useCallback(() => {
    render();
    DrawWiresOnCanvas(canvas.current);
  }, [render]);

  useEffect(() => {
    const clearSubscription = CyberDeckEvents.subscribe(() => updateDisplay());
    updateDisplay();
    return () => clearSubscription();
  }, [updateDisplay]);

  function onDragStart(result: DragStart) {
    setDraggingInstalledModule(result.source.droppableId === INSTALLED_MODULES);
    setDraggingStoredModule(result.source.droppableId === MODULE_STORAGE);
  }

  function onDragEnd(result: DropResult) {
    handleModuleMoved(result);
    setDraggingInstalledModule(false);
    setDraggingStoredModule(false);
    // Continue animating for a short time as dragged components settle
    const interval = setInterval(() => {
      updateDisplay();
    }, 60);
    setTimeout(() => clearInterval(interval), 400);
  }

  function onDragUpdate(result: DragUpdate) {
    console.log(result);
    updateDisplay();
  }

  function draggingWireStarted(moduleId: string, socketIndex: number) {
    disconnectSocket({ moduleId, socketIndex });
    setDraggingWire({ moduleId, socketIndex });
    console.log("draggingWireStarted", moduleId, socketIndex);
  }

  function draggingWireEnded(moduleId: string) {
    if (!draggingWire) return;
    setDraggingWire(null);
    createConnection(draggingWire, { moduleId, socketIndex: draggingWire.socketIndex });
    ejectOverloadedModules();
    updateDisplay();
  }

  function onMouseLeave() {
    setDraggingWire(null);
    updateDisplay();
  }

  function onMouseUp() {
    setDraggingWire(null);
    updateDisplay();
  }

  function onMouseMove(e: React.MouseEvent) {
    if (draggingWire || draggingInstalledModule || draggingStoredModule) {
      DrawWiresOnCanvas(canvas.current, draggingWire, { x: e.clientX, y: e.clientY });
    }
  }

  function isMaxModulesInstalled() {
    return CyberDeckState.installedModules.length >= getCurrentRackSize();
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ mx: 0 }}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseEnter={() => updateDisplay()}
    >
      <Typography variant={"h4"} sx={{ mx: 0, pb: 10 }}>
        Module Edit Page
      </Typography>
      <div
        id="testPointer"
        style={{
          border: "2px solid white",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          pointerEvents: "none",
          position: "absolute",
          opacity: draggingWire ? 1 : 0,
        }}
      ></div>

      <Container disableGutters maxWidth={false}>
        <canvas
          ref={canvas}
          width={"1150px"}
          height={"550px"}
          style={{ position: "absolute", zIndex: 5999, pointerEvents: "none" }}
        ></canvas>
        <div style={{ border: "1px solid blue", display: "flex", flexDirection: "row" }}>
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
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
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    margin: "10px",
                    border: "1px solid red",
                    height: "500px",
                    width: "300px",
                    backgroundColor: snapshot.isDraggingOver
                      ? Settings.theme.backgroundsecondary
                      : Settings.theme.backgroundprimary,
                    overflowX: "scroll",
                  }}
                  onMouseUp={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                    }
                  }}
                >
                  {CyberDeckState.installedModules.map((module, index) => (
                    <ModuleComponent
                      key={module.id}
                      module={module}
                      index={index}
                      draggingWireStarted={draggingWireStarted}
                      draggingWireEnded={draggingWireEnded}
                      currentDragSource={draggingWire}
                      allowShift={!draggingWire}
                    />
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
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
                    margin: "10px",
                    height: "500px",
                    width: "300px",
                    border: "1px solid green",
                    backgroundColor: snapshot.isDraggingOver
                      ? Settings.theme.backgroundsecondary
                      : Settings.theme.backgroundprimary,
                    overflowX: "scroll",
                  }}
                  onMouseUp={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                    }
                  }}
                >
                  {CyberDeckState.storedModules.map((module, index) => (
                    <ModuleComponent
                      key={module.id}
                      module={module}
                      index={index}
                      draggingWireStarted={() => {}}
                      draggingWireEnded={() => {}}
                      allowShift={!draggingWire}
                    />
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Container>
    </Container>
  );
}
