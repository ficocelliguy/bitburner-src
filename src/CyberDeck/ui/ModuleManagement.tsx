import React, { useState, useRef } from "react";
import { Container, Typography, Box } from "@mui/material";
import { DragDropContext, Droppable, DropResult, DragUpdate, DragStart } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";
import { useRerender } from "../../ui/React/hooks";
import { CyberDeckState } from "../models/CyberDeckState";
import { ModuleComponent } from "./ModuleComponent";
import { createConnection, disconnect, handleModuleMoved } from "../models/ModuleMutation";
import { DrawWiresOnCanvas } from "./WireCanvasDrawing";
import { Socket } from "../Types";

export const MODULE_STORAGE = "moduleStorage";
export const INSTALLED_MODULES = "installedModules";

export function ModuleManagement(): React.ReactElement {
  const render = useRerender();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draggingInstalledModule, setDraggingInstalledModule] = useState(false);
  const [draggingWire, setDraggingWire] = useState<Socket | null>(null);

  function onDragStart(result: DragStart) {
    setDraggingInstalledModule(result.source.droppableId === INSTALLED_MODULES);
  }

  function onDragEnd(result: DropResult) {
    handleModuleMoved(result);
    setDraggingInstalledModule(false);
    render();
    DrawWiresOnCanvas(canvas.current);
  }

  function onDragUpdate(result: DragUpdate) {
    console.log(result);
    DrawWiresOnCanvas(canvas.current);
  }

  function draggingWireStarted(moduleId: string, socketIndex: number) {
    disconnect({ moduleId, socketIndex });
    setDraggingWire({ moduleId, socketIndex });
    console.log("draggingWireStarted", moduleId, socketIndex);
  }

  function draggingWireEnded(moduleId: string) {
    if (!draggingWire) return;
    setDraggingWire(null);
    createConnection(draggingWire, { moduleId, socketIndex: draggingWire.socketIndex });
    DrawWiresOnCanvas(canvas.current);
  }

  function onMouseLeave() {
    setDraggingWire(null);
    DrawWiresOnCanvas(canvas.current);
  }

  function onMouseUp() {
    setDraggingWire(null);
    DrawWiresOnCanvas(canvas.current);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!draggingWire && !draggingInstalledModule) return;
    DrawWiresOnCanvas(canvas.current, draggingWire, {x: e.clientX, y: e.clientY});
  }

  function maxModulesInstalled() {
    return CyberDeckState.installedModules.filter(m => m).length >= CyberDeckState.baseRackSize;
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ mx: 0 }}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
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
              isDropDisabled={maxModulesInstalled() && !draggingInstalledModule}
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
