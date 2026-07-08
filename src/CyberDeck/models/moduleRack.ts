import { CyberDeckState, SocketList } from "./CyberDeckState";
import { clampInteger } from "../../utils/helpers/clampNumber";
import { shuffle } from "lodash";


export function getCurrentRackSize() {
  const rackExtensions = 0; // TODO-fico
  return CyberDeckState.baseRackSize + rackExtensions;
}

export function getRandomSockets(socketCount: number): SocketList {
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

export function createInitialModules() {
  for (let i = 0; i < 4; i++) {
    CyberDeckState.installedModules.push({
      id: `${(Math.random() * 1e3) | 0}`,
      sockets: getRandomSockets(Math.random() * 3),
      type: "Module",
    });
  }
  CyberDeckState.installedModules.push({
    id: `${(Math.random() * 1e3) | 0}`,
    sockets: getRandomSockets(8),
    type: "Module",
  });
  for (let i = 0; i < 10; i++) {
    CyberDeckState.storedModules.push({
      id: `${(Math.random() * 1e3) | 0}`,
      sockets: getRandomSockets(Math.random() * 3),
      type: "Module",
    });
  }
}