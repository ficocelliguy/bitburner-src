import { DropResult } from "react-beautiful-dnd";
import { MODULE_STORAGE } from "../ui/ModuleRackAndInventory";
import { CyberDeckEvents, CyberDeckState, getChargedModuleIDs } from "./CyberDeckState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { getCurrentRackSize, getSocketId } from "../utils/moduleUtilities";
import { DeckModule, ModuleType, Socket } from "../Types";
import { DeckConnection } from "./createModule";
import { Player } from "@player";
import { formatNumber } from "../../ui/formatNumber";

export function handleModuleMoved(result: DropResult) {
  if (!result.destination) {
    return;
  }

  const sourceIsStorage = result.source.droppableId === MODULE_STORAGE;
  const destinationIsStorage = result.destination.droppableId === MODULE_STORAGE;

  const sourceLocation = sourceIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;
  const moduleToMove = sourceLocation[result.source.index]

  moveModule(moduleToMove, sourceIsStorage, destinationIsStorage, result.source.index, result.destination.index);

  // Undo the move if it causes invalid wiring
  if (CyberDeckState.connections.find(([s,d]) => wireOverlapsSocket(s) || wireOverlapsSocket(d))) {
    moveModule(moduleToMove, destinationIsStorage, sourceIsStorage, result.destination.index, result.source.index);
    SnackbarEvents.emit(`Failed to move module: wires cannot overlap.`, ToastVariant.ERROR, 2000);
  }
}

function moveModule(moduleToMove: DeckModule, sourceIsStorage: boolean, destinationIsStorage: boolean, sourceIndex: number, destinationIndex = 0) {
  const sourceLocation = sourceIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;
  const destinationLocation = destinationIsStorage ? CyberDeckState.storedModules : CyberDeckState.installedModules;

  sourceLocation.splice(sourceIndex, 1);
  destinationLocation.splice(destinationIndex, 0, moduleToMove);

  if (destinationIsStorage) {
    disconnectModule(moduleToMove);
  }
  updateConnectedModules();
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
  // TODO-fico: prevent overlap of unconnected socket. Or maybe hide it?

  const sourceModule = getInstalledModule(source.moduleId);
  const destinationModule = getInstalledModule(destination.moduleId);
  if (sourceModule == destinationModule) return;
  if (!destinationModule?.sockets[destination.socketIndex]) {
    SnackbarEvents.emit(`Target module does not have a socket of that color.`, ToastVariant.ERROR, 2000);
    return;
  }
  if (source.socketIndex !== destination.socketIndex || !sourceModule?.sockets[source.socketIndex]) {
    SnackbarEvents.emit(`Socket colors do not match.`, ToastVariant.ERROR, 2000);
    return;
  }
  disconnectSocket(source);
  disconnectSocket(destination);

  const overlapSocket = wireOverlapsSocket(source) || wireOverlapsSocket(destination);

  if (overlapSocket) {
    SnackbarEvents.emit(`Wires cannot overlap.`, ToastVariant.ERROR, 2000);
    return;
  }

  console.log("Connecting ", getSocketId(source), " to ", getSocketId(destination));
  CyberDeckState.connections.push([source, destination]);
  updateConnectedModules();
}

function updateConnectedModules() {
  consumeSkillChips();
  ejectOverloadedModules();
  updateCoveredSockets();

  // Apply cyberdeck stat bonuses
  Player.applyEntropy(Player.entropy);

  CyberDeckEvents.emit();
}

function getInstalledModule(moduleId: string) {
  if (moduleId == DeckConnection.id) {
    return DeckConnection;
  }
  return (
    CyberDeckState.installedModules.find((m) => m.id === moduleId) ||
    CyberDeckState.storedModules.find((m) => m.id === moduleId)
  );
}

export function wireOverlapsSocket(socket: Socket) {
  const socketModuleIndex = getModuleIndex(socket.moduleId);
  return CyberDeckState.connections.find(([s, d]) => {
    if (s.moduleId === socket.moduleId || d.moduleId === socket.moduleId) return false;
    const sModuleIndex = getModuleIndex(s.moduleId);
    const dModuleIndex = getModuleIndex(d.moduleId);
    return (
      s.socketIndex == socket.socketIndex &&
      sModuleIndex > socketModuleIndex !== dModuleIndex > socketModuleIndex && [s, d]
    );
  });
}

export function socketIsCovered(socket: Socket) {
  return CyberDeckState.coveredSockets.find((s) => s.moduleId === socket.moduleId && s.socketIndex === socket.socketIndex);
}

export function updateCoveredSockets() {
  CyberDeckState.coveredSockets = [];
  for (const module of CyberDeckState.installedModules) {
    for (const [index, isSocket] of module.sockets.entries()) {
      if (!isSocket) continue;
      const socket = { moduleId: module.id, socketIndex: index };
      if (determineIfSocketIsCovered(socket)) {
        CyberDeckState.coveredSockets.push(socket);
      }
    }
  }
}

function determineIfSocketIsCovered(socket: Socket) {
  return CyberDeckState.connections.find(([s, d]) => {
    const isUniqueSocket =
      s.socketIndex === socket.socketIndex && s.moduleId !== socket.moduleId && d.moduleId !== socket.moduleId;
    if (!isUniqueSocket) return false;
    const socketModuleIndex = getModuleIndex(socket.moduleId);
    const sModuleIndex = getModuleIndex(s.moduleId);
    const dModuleIndex = getModuleIndex(d.moduleId);
    return (
      s.socketIndex == socket.socketIndex &&
      sModuleIndex > socketModuleIndex !== dModuleIndex > socketModuleIndex && [s, d]
    );
  });
}

export function getModuleIndex(moduleId: string) {
  return CyberDeckState.installedModules.findIndex((m) => m.id == moduleId);
}

export function disconnectSocket(source: Socket | undefined) {
  if (!source) return;
  const sourceConnection = CyberDeckState.connections.findIndex(
    ([s, d]) =>
      (s.socketIndex === source.socketIndex && s.moduleId === source.moduleId) ||
      (d.socketIndex === source.socketIndex && d.moduleId === source.moduleId),
  );
  if (sourceConnection !== -1) {
    CyberDeckState.connections.splice(sourceConnection, 1);
    updateConnectedModules();
  }
}

export function disconnectModule(module: DeckModule) {
  for (let i = 0; i < module.sockets.length; i++) {
    if (!module.sockets[i]) continue;
    disconnectSocket({ moduleId: module.id, socketIndex: i });
  }
}

function consumeSkillChips() {
  const chargedModuleIDs = getChargedModuleIDs();
  const chargedSkillModules = CyberDeckState.installedModules.filter(
    (m) => m.type === ModuleType.SkillChip && chargedModuleIDs.includes(m.id),
  );
  for (const module of chargedSkillModules) {
    const stats = module.consumableStats;
    if (stats?.netrunningBoost) {
      CyberDeckState.netrunningBoost += stats.netrunningBoost;
      SnackbarEvents.emit(`Consumed SkillChip. Gained ${formatNumber(stats.netrunningBoost, 2)} netrunning boost.`, ToastVariant.SUCCESS, 4000);
    }
    // TODO-fico: other consumable types (crafting boost, components, etc)

    disconnectModule(module);
  }
  CyberDeckState.installedModules = CyberDeckState.installedModules.filter((m) => !chargedSkillModules.includes(m));
}
