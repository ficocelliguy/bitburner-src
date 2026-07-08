import React, {useState} from "react";
import { Container, Typography, Box } from "@mui/material";
import { DragDropContext, Droppable, DropResult, DragUpdate, DragStart } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";
import { useRerender } from "../../ui/React/hooks";
import { CyberDeckState } from "../models/CyberDeckState";
import { ModuleComponent } from "./ModuleComponent";
import { handleModuleMoved } from "../models/ModuleMovement";

export const MODULE_STORAGE = "moduleStorage";
export const INSTALLED_MODULES = "installedModules";

export function ModuleManagement(): React.ReactElement {
  const render = useRerender();
  const [draggingInstalledModule, setDraggingInstalledModule] = useState(false);
  const [draggingWire, setDraggingWire] = useState(false);

  function onDragStart(result: DragStart) {
    setDraggingInstalledModule(result.source.droppableId === INSTALLED_MODULES);
  }

  function onDragEnd(result: DropResult) {
    handleModuleMoved(result);
    setDraggingInstalledModule(false);
    render();
  }

  function onDragUpdate(result: DragUpdate) {
    console.log(result);
  }

  function draggingWireStarted(moduleId: string, socketId: number) {
    setDraggingWire(true);
    console.log("draggingWireStarted", moduleId, socketId);
  }

  function onMouseLeave() {
    setDraggingWire(false);
  }

  function onMouseUp() {
    setDraggingWire(false);
  }

  function maxModulesInstalled() {
    return CyberDeckState.installedModules.filter(m => m).length >= CyberDeckState.baseRackSize;
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }} onMouseLeave={onMouseLeave} onMouseUp={onMouseUp}>
      <Typography>Module Edit Page</Typography>

      <Container disableGutters maxWidth={false} sx={{ mt: 20 }}>
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
                      draggingWireStarted={draggingWireStarted}
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
