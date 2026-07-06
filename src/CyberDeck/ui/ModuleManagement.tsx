import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Settings } from "../../Settings/Settings";

export function ModuleManagement(): React.ReactElement {
  function onDragEnd(result: DropResult) {
    console.log(result)
    //TODO: handle reordering
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ mx: 0 }}>
      <Typography>Module Edit Page</Typography>

      <Container disableGutters maxWidth={false} sx={{ mt: 20 }}>
        <div style={{ border: "1px solid blue", display: "flex", flexDirection: "row" }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="activeModules" direction="vertical">
              {(provided, snapshot) => (
                <Box
                  display="flex"
                  flexGrow="1"
                  flexDirection="row"
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
                  <Draggable draggableId="module1" index={0}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style, border: "1px solid yellow" }}
                      >
                        <Typography sx={{ userSelect: "none" }}>Drag Me!</Typography>
                      </div>
                    )}
                  </Draggable>
                  <Draggable draggableId="module2" index={1}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style, border: "1px solid yellow" }}
                      >
                        <Typography sx={{ userSelect: "none" }}>Drag Me 2!</Typography>
                      </div>
                    )}
                  </Draggable>

                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
            <Droppable droppableId="moduleStorage" direction="vertical">
              {(provided, snapshot) => (
                <Box
                  display="flex"
                  flexGrow="1"
                  flexDirection="row"
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
                  <Draggable draggableId="module3" index={0}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style, border: "1px solid yellow" }}
                      >
                        <Typography sx={{ userSelect: "none" }}>Drag Me 3!</Typography>
                      </div>
                    )}
                  </Draggable>
                  <Draggable draggableId="module4" index={1}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style, border: "1px solid yellow" }}
                      >
                        <Typography sx={{ userSelect: "none" }}>Drag Me 4!</Typography>
                      </div>
                    )}
                  </Draggable>

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
