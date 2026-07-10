import { CyberDeckState, getChargedModuleIDs } from "../models/CyberDeckState";
import { clampInteger } from "../../utils/helpers/clampNumber";
import { shuffle } from "lodash";
import { Socket, SocketList } from "../Types";
import { createModule } from "../models/CreateModule";


export function getCurrentRackSize() {
  const chargedModules = getChargedModuleIDs();
  const rackExtensionCount = CyberDeckState.installedModules
    .filter((module) => chargedModules.includes(module.id))
    .reduce((sum, module) => sum + module.extraRackSlots, 0);
  return CyberDeckState.baseRackSize + rackExtensionCount;
}

export function getRandomSockets(baseCap: number, bonus: number, disadvantage = false): SocketList {
  const socketCount1 = Math.random() * baseCap + bonus;
  const socketCount2 = Math.random() * baseCap + bonus;
  return getFixedCountSocketArray(disadvantage ? Math.min(socketCount1, socketCount2) : socketCount1);
}

function getFixedCountSocketArray(socketCount: number): SocketList {
  const array: SocketList = [false, false, false, false, false, false, false, false];
  const count = clampInteger(socketCount, 1, array.length);
  for (let i = 0; i < count; i++) {
    array[i] = true;
  }
  const result = shuffle(array);
  if (!isSocketList(result)) {
    throw new Error(`Somehow mis-shuffled sockets: ${JSON.stringify(result, null, 2)}`);
  }
  return result;
}

export function isSocketList(value: unknown): value is SocketList {
  return (
    Array.isArray(value) &&
    value.length === 8 &&
    value.every((v) => typeof v === "boolean")
  );
}

export function getSocketId(socket: Socket | null) {
  if (!socket) return "";
  return `socket-${socket.moduleId}-${socket.socketIndex}`;
}

export function getSocketLocation(id: string) {
  const rect = document.getElementById(id)?.getBoundingClientRect()
  if (!rect) {
    return {x: 0, y: 0}
  }
  return {
    x: rect.left + rect.width/2,
    y: rect.top + rect.height/2
  }
}



export function createInitialModules() {
  for (let i = 0; i < 4; i++) {
    CyberDeckState.installedModules.push(createModule());
  }
  for (let i = 0; i < 10; i++) {
    CyberDeckState.storedModules.push(createModule());
  }
}
