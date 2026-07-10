import { CyberDeckState } from "./CyberDeckState";
import { getRandomSockets } from "../utils/moduleUtilities";
import { DeckModule, ModuleType } from "../Types";

export function createModule(type: ModuleType = getRandomModuleType(), level: number = getLevel()) {
  if (type == ModuleType.PowerSupply) {
    return createPowerSupply(level);
  }
  if (type == ModuleType.RackExtension) {
    return createRackExtension(level);
  }
  return createProcessingModule(level);
}

function createPowerSupply(level: number): DeckModule {
  return {
    extraRackSlots: 0,
    type: ModuleType.PowerSupply,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(2 + level/2, 2)
  };
}

function createProcessingModule(level: number): DeckModule {
  return {
    extraRackSlots: 0,
    type: ModuleType.ProcessingModule,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level/3, 0, true),
  };
}

function createRackExtension(level: number): DeckModule {
  return {
    extraRackSlots: Math.floor(Math.random() * (2 + level / 4)) || 1,
    type: ModuleType.RackExtension,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
  };
}

function getRandomModuleType() {
  const rng = Math.random();
  if (rng < 0.2) {
    return ModuleType.PowerSupply;
  }
  if (rng < 0.3) {
    return ModuleType.RackExtension;
  }
  if (rng < 0.6) {
    return ModuleType.ProcessingModule;
  }
  if (rng < 0.9) {
    return ModuleType.Uplink;
  }
  return ModuleType.SkillChip;
}

function getLevel() {
  let level = 0;
  for (let i = 0; i < CyberDeckState.netrunningBoost + Math.random() * 4; i++) {
    if (Math.random() < 0.5 - i/20) {
      level++
    }
  }
  return level;
}
