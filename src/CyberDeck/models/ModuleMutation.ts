
import { DropResult } from "react-beautiful-dnd";
import { MODULE_STORAGE } from "../ui/ModuleManagement";
import { CyberDeckState, Socket } from "./CyberDeckState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { getSocketId } from "./moduleRack";

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
  sourceLocation.splice(sourceIndex, 1);
  destinationLocation.splice(destinationIndex, 0, moduleToMove);
}

export function createConnection(source: Socket, destination: Socket) {
  // TODO-fico: validation
  const sourceModule = CyberDeckState.installedModules.find(m => m.id == source.moduleId);
  const destinationModule = CyberDeckState.installedModules.find((m) => m.id == destination.moduleId);
  if(source.socketIndex !== destination.socketIndex || !sourceModule?.sockets[source.socketIndex] || !destinationModule?.sockets[destination.socketIndex]) {
    SnackbarEvents.emit(`Socket colors do not match`, ToastVariant.ERROR, 2000);
    return;
  }

  console.log("Connecting ", getSocketId(source), " to ", getSocketId(destination));
  CyberDeckState.connections.push([source, destination]);
}
