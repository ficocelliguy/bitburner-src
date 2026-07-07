
import { DragDropContext, Droppable, Draggable, DropResult, DragUpdate, DragStart } from "react-beautiful-dnd";
import { MODULE_STORAGE } from "../ui/ModuleManagement";
import { CyberDeckState } from "./CyberDeckState";

export function handleModuleMoved(result: DropResult) {
  if (!result.destination) {
    return;
  }

  const sourceIsStorage = result.source.droppableId === MODULE_STORAGE;
  const destinationIsStorage = result.destination.droppableId === MODULE_STORAGE;
  const sourceIndex = result.source.index;
  const destinationIndex = result.destination.index

  const sourceLocation = sourceIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;
  const destinationLocation = destinationIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;

  const moduleToMove = sourceLocation[sourceIndex];
  sourceLocation[sourceIndex] = null;
  destinationLocation.splice(destinationIndex, 0, moduleToMove);

  // Don't preserve gaps in stored module list
  CyberDeckState.storedModules = CyberDeckState.storedModules.filter((module) => module);
}