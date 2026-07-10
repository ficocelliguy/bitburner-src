
import { DropResult } from "react-beautiful-dnd";
import { MODULE_STORAGE } from "../ui/ModuleManagement";
import { CyberDeckEvents, CyberDeckState } from "./CyberDeckState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { getCurrentRackSize, getSocketId } from "../utils/moduleUtilities";
import { DeckModule, Socket } from "../Types";

export function handleModuleMoved(result: DropResult) {
  if (!result.destination) {
    return;
  }

  const sourceIsStorage = result.source.droppableId === MODULE_STORAGE;
  const destinationIsStorage = result.destination.droppableId === MODULE_STORAGE;

  const sourceLocation = sourceIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;

  moveModule(sourceLocation[result.source.index], sourceIsStorage, destinationIsStorage, result.source.index, result.destination.index);
}

function moveModule(moduleToMove: DeckModule, sourceIsStorage: boolean, destinationIsStorage: boolean, sourceIndex: number, destinationIndex = 0) {
  const sourceLocation = sourceIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;
  const destinationLocation = destinationIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;

  sourceLocation.splice(sourceIndex, 1);
  destinationLocation.splice(destinationIndex, 0, moduleToMove);

  if (destinationIsStorage) {
    disconnectModule(moduleToMove);
  }
  ejectOverloadedModules();
  CyberDeckEvents.emit();
}

export function ejectOverloadedModules() {
  for (const module of CyberDeckState.installedModules.slice(getCurrentRackSize())) {
    disconnectModule(module);
    moveModule(module, false, true, CyberDeckState.installedModules.indexOf(module));
  }
}

export function createConnection(source: Socket, destination: Socket) {
  // TODO-fico: validation
  // TODO: what happens when you go over a socket but not connect to it?
  const sourceModule = CyberDeckState.installedModules.find(m => m.id == source.moduleId);
  const destinationModule = CyberDeckState.installedModules.find((m) => m.id == destination.moduleId);
  if (sourceModule == destinationModule) return;
  if (!destinationModule?.sockets[destination.socketIndex]) {
    SnackbarEvents.emit(`Target module does not have a socket of that color.`, ToastVariant.ERROR, 2000);
    return;
  }
  if(source.socketIndex !== destination.socketIndex || !sourceModule?.sockets[source.socketIndex]) {
    SnackbarEvents.emit(`Socket colors do not match.`, ToastVariant.ERROR, 2000);
    return;
  }
  disconnectSocket(source);
  disconnectSocket(destination);

  // TODO-fico: prevent overlap

  console.log("Connecting ", getSocketId(source), " to ", getSocketId(destination));
  CyberDeckState.connections.push([source, destination]);
}

export function disconnectSocket(source: Socket) {
  const sourceConnection = CyberDeckState.connections.findIndex(
    ([s, d]) =>
      (s.socketIndex === source.socketIndex && s.moduleId === source.moduleId) ||
      (d.socketIndex === source.socketIndex && d.moduleId === source.moduleId),
  );
  if (sourceConnection !== -1) {
    CyberDeckState.connections.splice(sourceConnection, 1);
  }
}

export function disconnectModule(module: DeckModule) {
  for (let i = 0; i < module.sockets.length; i++) {
    if (!module.sockets[i]) continue;
    disconnectSocket({ moduleId: module.id, socketIndex: i });
  }
}
