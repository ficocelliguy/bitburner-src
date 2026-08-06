import { CyberdeckState, getChargedModuleIDs } from "../models/CyberdeckState";
import { clampInteger } from "../../utils/helpers/clampNumber";
import { shuffle } from "lodash";
import { Socket, SocketList } from "../Types";
import { WHRNG } from "../../Casino/RNG";


export function getCurrentRackSize() {
  const chargedModules = getChargedModuleIDs();
  const rackExtensionCount = CyberdeckState.installedModules
    .filter((module) => chargedModules.includes(module.id))
    .reduce((sum, module) => sum + (module.stats?.extraRackSlots ?? 0), 0);
  return CyberdeckState.baseRackSize + rackExtensionCount;
}

export function getRandomSockets(rng: WHRNG, baseCap: number, bonus: number = 0, disadvantage = false): SocketList {
  const socketCount1 = rng.random() * baseCap + bonus;
  const socketCount2 = rng.random() * baseCap + bonus;
  return getFixedCountSocketArray(disadvantage ? Math.min(socketCount1, socketCount2) : socketCount1);
}

function getFixedCountSocketArray(socketCount: number): SocketList {
  const array: SocketList = [false, false, false, false, false, false, false, false];
  const count = clampInteger(socketCount, 1, array.length);
  for (let i = 0; i < count; i++) {
    array[i] = true;
  }
  const result = shuffle(array); // TODO: use seed
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
