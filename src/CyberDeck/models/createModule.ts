import { CyberDeckEvents, CyberDeckState } from "./CyberDeckState";
import { getRandomSockets } from "../utils/moduleUtilities";
import { DeckModule, ModuleType } from "../Types";
import { generateStatBonus } from "./StatBonuses";
import { disconnectModule, moveModule } from "./moduleMutation";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";


export const DeckConnection: DeckModule = {
  type: ModuleType.DeckConnection,
  id: "deck-connection",
  sockets: [false, true, false, true, false, true, false, false],
  level: 0,
};

export function createModule(type: ModuleType = getRandomModuleType(), level: number = getLevel()) {
  if (type == ModuleType.PowerSupply) {
    return createPowerSupply(level);
  }
  if (type == ModuleType.RackExtension) {
    return createRackExtension(level);
  }
  if (type == ModuleType.SkillChip) {
    return createSkillChip(level);
  }
  if (type == ModuleType.Uplink) {
    return createUplink(level);
  }
  return createProcessingModule(level);
}

function createPowerSupply(level: number): DeckModule {
  return {
    type: ModuleType.PowerSupply,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(2 + level / 2, 2),
    level,
    stats: {
      playerMults: {
        hacking_exp: generateStatBonus(-0.03 + 0.001 * level, -0.005 + 0.002 * level, true),
      },
    },
  };
}

function createProcessingModule(level: number): DeckModule {
  return {
    type: ModuleType.ProcessingModule,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: {
        strength: generateStatBonus(0.001 + 0.0001 * level, 0.004 + 0.0003 * level, level > 4),
      },
    },
  };
}

function createUplink(level: number): DeckModule {
  return {
    type: ModuleType.Uplink,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
    stats: {
      otherMults: {
        romProduction: generateStatBonus(0.1 + 0.1 * level, 0.2 + 0.1 * level, level > 4),
      },
    },
  };
}


function createRackExtension(level: number): DeckModule {
  return {
    stats: {
      extraRackSlots: Math.floor(Math.random() * (2 + level / 4)) || 1,
    },
    type: ModuleType.RackExtension,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
  };
}

function createSkillChip(level: number): DeckModule {
  // TODO-fico: flesh out consumable stats
  // TODO-fico: balance numbers
  return {
    type: ModuleType.SkillChip,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1),
    level,
    stats: {
      consumableStats: {
        netrunning: Math.random() * (level / 25) + level / 40 + 0.1,
      },
    }
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
  for (let i = 0; i < CyberDeckState.netrunning + Math.random() * 4; i++) {
    if (Math.random() < 0.5 - i/20) {
      level++
    }
  }
  return level;
}



// TODO-fico: replace with better module set on prestige
// TODO-fico: save modules
export function createInitialModules() {
  CyberDeckState.netrunning =8;
  for (let i = 0; i < 4; i++) {
    CyberDeckState.installedModules.push(createModule());
  }
  for (let i = 0; i < 10; i++) {
    CyberDeckState.storedModules.push(createModule());
  }
}

export function craftICE() {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberDeckState.components.chips -= 20;
  CyberDeckState.components.ROM -= 20;
  CyberDeckState.components.neurodes -= 20;
  CyberDeckState.components.ICE += 1;
}

export function craftPowerSupply() {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberDeckState.components.chips -= 20;
  CyberDeckState.components.ROM -= 10;
  CyberDeckState.storedModules.push(createPowerSupply(0));
}

export function craftProcessingModule() {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberDeckState.components.chips -= 10;
  CyberDeckState.components.ROM -= 20;
  CyberDeckState.storedModules.push(createProcessingModule(0));
}

export function craftUplink() {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberDeckState.components.ROM -= 10;
  CyberDeckState.components.neurodes -= 20;
  CyberDeckState.storedModules.push(createUplink(0));
}

export function disassembleModule(module: DeckModule, showToast: boolean = false) {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberDeckState.components.chips += 2;
  CyberDeckState.components.ROM += 2;
  CyberDeckState.components.neurodes += 2;
  disconnectModule(module);
  if (CyberDeckState.installedModules.includes(module)) {
    moveModule(module, false, true, 0);
  }
  CyberDeckState.storedModules = CyberDeckState.storedModules.filter((m) => m !== module);
  if (showToast) {
    SnackbarEvents.emit(`Module disassembled. Gained +2 chips, +2 ROM, +2 neurodes.`, ToastVariant.INFO, 2000);
  }
  CyberDeckEvents.emit();
}