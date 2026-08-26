import { DropResult } from "react-beautiful-dnd";
import { MODULE_STORAGE, TRASH_CAN } from "../ui/ModuleRackAndInventoryPage";
import { CyberdeckEvents, CyberdeckState, getChargedModuleIDs } from "./CyberdeckState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { getCurrentRackSize } from "../utils/moduleUtilities";
import { DeckMod, ModType, Socket } from "../Types";
import { CyberdeckIOPanel, disassembleModule } from "./createModule";
import { Player } from "@player";
import { formatNumber } from "../../ui/formatNumber";

export function handleModuleMoved(result: DropResult) {
  if (!result.destination) {
    return;
  }

  const sourceIsStorage = result.source.droppableId === MODULE_STORAGE;
  const destinationIsStorage = result.destination.droppableId === MODULE_STORAGE;

  const sourceLocation = sourceIsStorage ? CyberdeckState.storedModules : CyberdeckState.installedModules;
  const moduleToMove = sourceLocation[result.source.index]


  if (result.destination.droppableId == TRASH_CAN) {
    disassembleModule(moduleToMove, true);
    return;
  }

  if (
    sourceIsStorage &&
    !destinationIsStorage &&
    moduleToMove.type === ModType.RackExtension &&
    getInstalledRackExtensionCount() >= CyberdeckState.maxInstalledRackExtensions
  ) {
    // TODO-fico: rack extension count is a SF reward?
    SnackbarEvents.emit(
      `Cannot install more than ${CyberdeckState.maxInstalledRackExtensions} Rack Extension modules.`,
      ToastVariant.ERROR,
      2000,
    );
    return;
  }

  moveModule(moduleToMove, sourceIsStorage, destinationIsStorage, result.destination.index);

  // Undo the move if it causes invalid wiring
  if (CyberdeckState.connections.find(([s,d]) => wireOverlapsSocket(s) || wireOverlapsSocket(d))) {
    moveModule(moduleToMove, destinationIsStorage, sourceIsStorage, result.source.index);
    SnackbarEvents.emit(`Failed to move module: wires cannot overlap.`, ToastVariant.ERROR, 2000);
  }
}

export function moveModule(moduleToMove: DeckMod, sourceIsStorage: boolean, destinationIsStorage: boolean, destinationIndex = 0) {
  const sourceLocation = sourceIsStorage ? CyberdeckState.storedModules : CyberdeckState.installedModules;
  const destinationLocation = destinationIsStorage ? CyberdeckState.storedModules : CyberdeckState.installedModules;
  const sourceIndex = sourceLocation.indexOf(moduleToMove);

  sourceLocation.splice(sourceIndex, 1);
  destinationLocation.splice(destinationIndex, 0, moduleToMove);

  if (destinationIsStorage) {
    disconnectModule(moduleToMove);
  }
  updateConnectedModules();
}

export function ejectOverloadedModules() {
  for (const module of CyberdeckState.installedModules.slice(getCurrentRackSize())) {
    disconnectModule(module);
    moveModule(module, false, true);
  }
}

export function createConnection(source: Socket, destination: Socket) {
  const sourceModule = getInstalledModule(source.modId);
  const destinationModule = getInstalledModule(destination.modId);
  if (!sourceModule) {
    return {
      success: false,
      error: `Cannot create connection: mod ${source.modId} is not installed on the deck rack.`,
    };
  }
  if (!destinationModule) {
    return {
      success: false,
      error: `Cannot create connection: mod ${destination.modId} is not installed on the deck rack.`,
    };
  }
  if (sourceModule == destinationModule) {
    return {
      success: false,
      error: "Modules cannot be connected to themselves."
    };
  }
  if (!destinationModule?.sockets[destination.socketIndex]) {
    return {
      success: false,
      error: `Target module does not have a socket of that color.`
    };
  }
  if (source.socketIndex !== destination.socketIndex || !sourceModule?.sockets[source.socketIndex]) {
    return {
      success: false,
      error: `Socket colors do not match.`,
    };
  }
  disconnectSocket(source);
  disconnectSocket(destination);

  const overlapSocket = wireOverlapsSocket(source) || wireOverlapsSocket(destination);

  if (overlapSocket) {
    return {
      success: false,
      error: `Wires cannot overlap. There is a wire in between those connection points connecting ${overlapSocket[0].modId} and ${overlapSocket[1].modId}`,
    };
  }

  CyberdeckState.connections.push([source, destination]);
  updateConnectedModules();
  return {
    success: true,
    error: "",
  };
}

function updateConnectedModules() {
  consumeSkillChips();
  ejectOverloadedModules();
  updateCoveredSockets();

  // Apply cyberdeck stat bonuses
  Player.applyEntropy(Player.entropy);

  CyberdeckEvents.emit();
}

function getInstalledModule(moduleId: string) {
  if (moduleId == CyberdeckIOPanel.id) {
    return CyberdeckIOPanel;
  }
  return (
    CyberdeckState.installedModules.find((m) => m.id === moduleId) ||
    CyberdeckState.storedModules.find((m) => m.id === moduleId)
  );
}

export function wireOverlapsSocket(socket: Socket) {
  const socketModuleIndex = getModuleIndex(socket.modId);
  return CyberdeckState.connections.find(([s, d]) => {
    if (s.modId === socket.modId || d.modId === socket.modId) return false;
    const sModuleIndex = getModuleIndex(s.modId);
    const dModuleIndex = getModuleIndex(d.modId);
    return (
      s.socketIndex == socket.socketIndex &&
      sModuleIndex > socketModuleIndex !== dModuleIndex > socketModuleIndex && [s, d]
    );
  });
}

export function socketIsCovered(socket: Socket) {
  return CyberdeckState.coveredSockets.find((s) => s.modId === socket.modId && s.socketIndex === socket.socketIndex);
}

export function updateCoveredSockets() {
  CyberdeckState.coveredSockets = [];
  for (const module of CyberdeckState.installedModules) {
    for (const [index, isSocket] of module.sockets.entries()) {
      if (!isSocket) continue;
      const socket = { modId: module.id, socketIndex: index };
      if (determineIfSocketIsCovered(socket)) {
        CyberdeckState.coveredSockets.push(socket);
      }
    }
  }
}

function determineIfSocketIsCovered(socket: Socket) {
  return CyberdeckState.connections.find(([s, d]) => {
    const isUniqueSocket =
      s.socketIndex === socket.socketIndex && s.modId !== socket.modId && d.modId !== socket.modId;
    if (!isUniqueSocket) return false;
    const socketModuleIndex = getModuleIndex(socket.modId);
    const sModuleIndex = getModuleIndex(s.modId);
    const dModuleIndex = getModuleIndex(d.modId);
    return (
      s.socketIndex == socket.socketIndex &&
      sModuleIndex > socketModuleIndex !== dModuleIndex > socketModuleIndex && [s, d]
    );
  });
}

export function getModuleIndex(moduleId: string) {
  return CyberdeckState.installedModules.findIndex((m) => m.id == moduleId);
}

export function disconnectSocket(source: Socket | undefined) {
  if (!source) return;
  const sourceConnectionIndex = CyberdeckState.connections.findIndex(
    ([s, d]) =>
      (s.socketIndex === source.socketIndex && s.modId === source.modId) ||
      (d.socketIndex === source.socketIndex && d.modId === source.modId),
  );
  if (sourceConnectionIndex !== -1) {
    CyberdeckState.connections.splice(sourceConnectionIndex, 1);
    updateConnectedModules();
  }
}

export function disconnectConnection(moduleId1: string, moduleId2: string, socketIndex: number) {
  const connectionIndex = CyberdeckState.connections.findIndex(
    ([s, d]) =>
      (s.socketIndex === socketIndex && s.modId === moduleId1 && d.modId === moduleId2) ||
      (s.socketIndex === socketIndex && s.modId === moduleId2 && d.modId === moduleId1),
  );
  if (connectionIndex !== -1) {
    CyberdeckState.connections.splice(connectionIndex, 1);
    updateConnectedModules();
    return true;
  }
  return false;
}

export function disconnectModule(module: DeckMod) {
  for (let i = 0; i < module.sockets.length; i++) {
    if (!module.sockets[i]) continue;
    disconnectSocket({ modId: module.id, socketIndex: i });
  }
}

function consumeSkillChips() {
  const chargedModuleIDs = getChargedModuleIDs();
  const chargedSkillModules = CyberdeckState.installedModules.filter(
    (m) => m.type === ModType.SkillChip && chargedModuleIDs.includes(m.id),
  );
  for (const module of chargedSkillModules) {
    const stats = module.stats?.consumableStats ?? {};
    if (stats.netrunning_lvl) {
      CyberdeckState.netrunningLevel += stats.netrunning_lvl;
      SnackbarEvents.emit(`Consumed SkillChip. Gained ${formatNumber(stats.netrunning_lvl, 2)} netrunning boost.`, ToastVariant.SUCCESS, 4000);
    }
    if (stats.crafting_lvl) {
      CyberdeckState.craftingLevel += stats.crafting_lvl;
      SnackbarEvents.emit(`Consumed SkillChip. Gained ${formatNumber(stats.crafting_lvl, 2)} crafting boost.`, ToastVariant.SUCCESS, 4000);
    }
    if (stats.netrun_cooldown_lvl) {
      CyberdeckState.netrunningCooldownLevel += stats.netrun_cooldown_lvl;
      SnackbarEvents.emit(
        `Consumed SkillChip. Gained ${formatNumber(stats.netrun_cooldown_lvl, 2)} trace decay reduction boost.`,
        ToastVariant.SUCCESS,
        4000,
      );
    }
    if (stats.mod_storage) {
      CyberdeckState.modStorageSize += stats.mod_storage;
      SnackbarEvents.emit(`Consumed SkillChip. Increased mod storage by ${formatNumber(stats.mod_storage, 2)} slots.`, ToastVariant.SUCCESS, 4000);
    }

    disconnectModule(module);
  }
  CyberdeckState.installedModules = CyberdeckState.installedModules.filter((m) => !chargedSkillModules.includes(m));
  CyberdeckEvents.emit();
}

function getInstalledRackExtensionCount() {
  return CyberdeckState.installedModules.filter((m) => m.type === ModType.RackExtension).length;
}