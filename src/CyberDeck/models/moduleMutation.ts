import { DropResult } from "react-beautiful-dnd";
import { CyberdeckEvents, CyberdeckState, getChargedModuleIDs, getChargedModules } from "./CyberdeckState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { getCurrentRackSize } from "../utils/moduleUtilities";
import { Connection, DeckMod, Socket } from "../Types";
import { ModType } from "../Enums";
import { getCyberdeckIOPanel, disassembleModule } from "./createModule";
import { Player } from "@player";
import { formatNumber } from "../../ui/formatNumber";
import {
  completeChargedModuleTutorial,
  completeInstalledModTutorial,
  completeMadeConnectionTutorial,
  hasConsumedSkillchipTutorial,
} from "./tutorial";
import { getFilteredStoredModules } from "../utils/modStatsUtils";
import { MODULE_STORAGE, TRASH_CAN } from "./constants";

export function handleModuleMoved(result: DropResult, filter: string = "") {
  if (!result.destination) {
    return;
  }

  const sourceIsStorage = result.source.droppableId === MODULE_STORAGE;
  const destinationIsStorage = result.destination.droppableId === MODULE_STORAGE;

  const sourceLocation = sourceIsStorage ? getFilteredStoredModules(filter) : CyberdeckState.installedModules;
  const moduleToMove = sourceLocation[result.source.index];

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

  if (!destinationIsStorage) {
    const sourceList = CyberdeckState.installedModules.filter((m) => m.id !== moduleToMove.id);
    const newInstalledModsList = sourceList.toSpliced(result.destination.index, 0, moduleToMove);
    // Prevent the move if it causes invalid wiring
    if (wouldCauseOverlaps(newInstalledModsList)) {
      SnackbarEvents.emit(`Failed to move module: wires cannot overlap.`, ToastVariant.ERROR, 2000);
      return;
    }
  }

  moveModule(moduleToMove, sourceIsStorage, destinationIsStorage, result.destination.index, filter);
}

export function moveModule(
  moduleToMove: DeckMod,
  sourceIsStorage: boolean,
  destinationIsStorage: boolean,
  destinationIndex = 0,
  filter = "",
) {
  const sourceLocation = sourceIsStorage ? CyberdeckState.storedModules : CyberdeckState.installedModules;
  const destinationLocation = destinationIsStorage ? CyberdeckState.storedModules : CyberdeckState.installedModules;
  const sourceIndex = sourceLocation.indexOf(moduleToMove);
  const adjustedDestinationIndex = destinationIsStorage
    ? getDestinationIndex(filter, destinationIndex)
    : destinationIndex;
  if (sourceIndex === -1) {
    console.error(
      `Attempted to move module ${moduleToMove.id} but it was not found in ${sourceIsStorage ? "storage" : "the rack"}`,
    );
    return;
  }

  sourceLocation.splice(sourceIndex, 1);
  destinationLocation.splice(adjustedDestinationIndex, 0, moduleToMove);

  if (destinationIsStorage) {
    disconnectModule(moduleToMove);
  }
  if (!destinationIsStorage && sourceIsStorage) {
    completeInstalledModTutorial();
  }
  updateConnectedModules();
}

function getDestinationIndex(filter: string, destinationIndex: number) {
  const modAtFilteredIndex = getFilteredStoredModules(filter)[destinationIndex];
  const targetLocation = CyberdeckState.storedModules.findIndex((m) => m.id == modAtFilteredIndex?.id);
  if (targetLocation === -1) {
    return CyberdeckState.storedModules.length;
  }
  return targetLocation;
}

export function ejectOverloadedModules() {
  while (CyberdeckState.installedModules.length > getCurrentRackSize()) {
    const module = CyberdeckState.installedModules[CyberdeckState.installedModules.length - 1];
    moveModule(module, false, true);
  }
}

export function createConnection(source: Socket, destination: Socket) {
  const sourceModule = getModule(source.modId);
  const destinationModule = getModule(destination.modId);
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
      error: "Modules cannot be connected to themselves.",
    };
  }
  if (!destinationModule?.sockets[destination.socketIndex]) {
    return {
      success: false,
      error: `Target module ${destination.modId} does not have a socket of that color (${destination.socketIndex}).`,
    };
  }
  if (!sourceModule?.sockets[source.socketIndex]) {
    return {
      success: false,
      error: `Source module ${source.modId} does not have a socket of that color (${source.socketIndex}).`,
    };
  }
  if (source.socketIndex !== destination.socketIndex) {
    return {
      success: false,
      error: `Socket colors do not match.`,
    };
  }

  const overlapSocket = wireOverlapsSocket(source) || wireOverlapsSocket(destination);
  if (overlapSocket) {
    return {
      success: false,
      error: `Wires cannot overlap. There is a wire in between those connection points connecting ${overlapSocket[0].modId} and ${overlapSocket[1].modId}`,
    };
  }

  disconnectSocket(source);
  disconnectSocket(destination);

  CyberdeckState.connections.push([source, destination]);
  updateConnectedModules();
  if (source.modId !== getCyberdeckIOPanel().id && destination.modId !== getCyberdeckIOPanel().id) {
    completeMadeConnectionTutorial();
  }
  const chargedMods = getChargedModules();
  if (chargedMods.some((m) => m.id == sourceModule.id || m.id == destinationModule.id)) {
    completeChargedModuleTutorial();
  }
  return {
    success: true,
    error: "",
  };
}

function updateConnectedModules(consumeSkillchips = true) {
  consumeSkillchips && consumeSkillChips();
  ejectOverloadedModules();
  updateCoveredSockets();

  // Apply cyberdeck stat bonuses
  Player.applyEntropy(Player.entropy);

  CyberdeckEvents.emit();
}

function getModule(moduleId: string) {
  if (moduleId == getCyberdeckIOPanel().id) {
    return getCyberdeckIOPanel();
  }
  return (
    CyberdeckState.installedModules.find((m) => m.id === moduleId) ||
    CyberdeckState.storedModules.find((m) => m.id === moduleId)
  );
}

export function wouldCauseOverlaps(moduleList: DeckMod[], connections: Connection[] = CyberdeckState.connections) {
  for (const [socket1, socket2] of connections) {
    if (wireOverlapsSocket(socket1, moduleList, connections) || wireOverlapsSocket(socket2, moduleList, connections)) {
      return true;
    }
  }
}

export function wireOverlapsSocket(
  socket: Socket,
  moduleList = CyberdeckState.installedModules,
  connections = CyberdeckState.connections,
) {
  const socketModuleIndex = getModuleIndex(socket.modId, moduleList);
  return connections.find(([s, d]) => {
    if (s.modId === socket.modId || d.modId === socket.modId) return false;
    const sModuleIndex = getModuleIndex(s.modId, moduleList);
    const dModuleIndex = getModuleIndex(d.modId, moduleList);
    return (
      s.socketIndex == socket.socketIndex &&
      sModuleIndex > socketModuleIndex !== dModuleIndex > socketModuleIndex && [s, d]
    );
  });
}

export function socketIsCovered(socket: Socket) {
  if (!socket.modId) {
    return false;
  }
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
    const isUniqueSocket = s.socketIndex === socket.socketIndex && s.modId !== socket.modId && d.modId !== socket.modId;
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

export function getModuleIndex(moduleId: string, moduleList: DeckMod[] = CyberdeckState.installedModules) {
  return moduleList.findIndex((m) => m.id == moduleId);
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
  }
  updateConnectedModules(false);
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
      SnackbarEvents.emit(
        `Consumed SkillChip. Gained +${formatNumber(stats.netrunning_lvl, 2)} netrunning boost.`,
        ToastVariant.SUCCESS,
        4000,
      );
    }
    if (stats.crafting_lvl) {
      CyberdeckState.craftingLevel += stats.crafting_lvl;
      SnackbarEvents.emit(
        `Consumed SkillChip. Gained +${formatNumber(stats.crafting_lvl, 2)} crafting boost.`,
        ToastVariant.SUCCESS,
        4000,
      );
    }
    if (stats.netrun_cooldown_lvl) {
      CyberdeckState.netrunningCooldownLevel += stats.netrun_cooldown_lvl;
      SnackbarEvents.emit(
        `Consumed SkillChip. Gained +${formatNumber(stats.netrun_cooldown_lvl, 2)} trace decay reduction boost.`,
        ToastVariant.SUCCESS,
        4000,
      );
    }
    if (stats.mod_storage) {
      CyberdeckState.modStorageSize += stats.mod_storage;
      SnackbarEvents.emit(
        `Consumed SkillChip. Increased mod storage by +${formatNumber(stats.mod_storage, 2)} slots.`,
        ToastVariant.SUCCESS,
        4000,
      );
    }

    disconnectModule(module);
    hasConsumedSkillchipTutorial();
  }
  CyberdeckState.installedModules = CyberdeckState.installedModules.filter((m) => !chargedSkillModules.includes(m));
  CyberdeckEvents.emit();
}

export function getInstalledRackExtensionCount() {
  return CyberdeckState.installedModules.filter((m) => m.type === ModType.RackExtension).length;
}
