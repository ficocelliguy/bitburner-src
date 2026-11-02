import { CyberdeckState, getChargedModuleIDs } from "../models/CyberdeckState";
import { clampInteger } from "../../utils/helpers/clampNumber";
import { Socket, SocketList } from "../Types";
import { WHRNG } from "../../Casino/RNG";
import { socketIsCovered } from "../models/moduleMutation";
import { Settings } from "../../Settings/Settings";

export function getCurrentRackSize() {
  const chargedModules = getChargedModuleIDs();
  const rackExtensionCount = CyberdeckState.installedModules
    .filter((module) => chargedModules.includes(module.id))
    .reduce((sum, module) => sum + (module.stats?.extraRackSlots ?? 0), 0);
  return CyberdeckState.baseRackSize + rackExtensionCount;
}

export function getRandomSockets(rng: WHRNG, level: number, bonusSocketScalar = 1, min = 1): SocketList {
  const bonusSocket1 = rng.random() < (0.1 + 0.005 * level) * bonusSocketScalar ? 1 : 0;
  const bonusSocket2 = rng.random() < (0.02 + 0.001 * level) * bonusSocketScalar ? 1 : 0;
  const bonusSocket3 = bonusSocketScalar > 1 ? (rng.random() < (0.03 + 0.001 * level) * bonusSocketScalar ? 1 : 0) : 0;
  const bonusSocket4 = bonusSocketScalar > 1 ? (rng.random() < 0.003 * level * bonusSocketScalar ? 1 : 0) : 0;
  const socketCount = min + bonusSocket1 + bonusSocket2 + bonusSocket3 + bonusSocket4;
  return getFixedCountSocketArray(rng, socketCount);
}

export function getFixedCountSocketArray(rng: WHRNG, socketCount: number): SocketList {
  const array: SocketList = [false, false, false, false, false, false, false, false];
  const count = clampInteger(socketCount, 1, array.length);
  for (let i = 0; i < count; i++) {
    array[i] = true;
  }
  return array.sort(() => rng.random() - 0.5);
}

export function isSocketList(value: unknown): value is SocketList {
  return Array.isArray(value) && value.length === 8 && value.every((v) => typeof v === "boolean");
}

export function getSocketId(socket: Socket | null) {
  if (!socket) return "";
  return `socket-${socket.modId}-${socket.socketIndex}`;
}

export function getSocketLocation(id: string) {
  const rect = document.getElementById(id)?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function getModuleById(modId: string) {
  return (
    CyberdeckState.installedModules.find((m) => m.id === modId) ||
    CyberdeckState.storedModules.find((m) => m.id === modId)
  );
}

export const getSocketColor = (index: number, moduleId: string = "") => {
  if (socketIsCovered({ socketIndex: index, modId: moduleId })) {
    return Settings.theme.welllight;
  }
  const t = Settings.theme;
  const colors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];
  return colors[index];
};
