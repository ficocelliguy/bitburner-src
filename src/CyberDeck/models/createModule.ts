import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getRandomSockets } from "../utils/moduleUtilities";
import { ComponentCounts, DeckModule, ModuleType } from "../Types";
import { disconnectModule, moveModule } from "./moduleMutation";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import {
  componentSymbols,
  ICEbreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "./constants";
import { saveGame } from "../../SaveObject";
import { getRecordKeys } from "../../Types/Record";
import { Multipliers } from "@nsdefs";
import {
  getAllStatRanges, getConsumableBuff,
  getDebuff,
  getID,
  getLevel,
  getNextCraftingWHRNG,
  getPlayerStatBuff,
} from "../utils/statRng";
import { WHRNG } from "../../Casino/RNG";
import { clampNumber } from "../../utils/helpers/clampNumber";


export const DeckConnection: DeckModule = {
  type: ModuleType.DeckConnection,
  id: "Hosaka Mk 1 Cyberdeck",
  sockets: [false, true, false, true, false, true, false, false],
  level: 10,
};

export function createModule(rng: WHRNG, type: ModuleType = getRandomModuleType(rng), level: number = getLevel(rng)) {
  if (type == ModuleType.PowerSupply) {
    return createPowerSupply(level, rng);
  }
  if (type == ModuleType.RackExtension) {
    return createRackExtension(level, rng);
  }
  if (type == ModuleType.SkillChip) {
    return createSkillChip(level, rng);
  }
  if (type == ModuleType.Uplink) {
    return createUplink(level, rng);
  }
  return createProcessingModule(level, rng);
}

function createPowerSupply(level: number, rng: WHRNG): DeckModule {
  const debuff = getDebuff(level, rng); // TODO: higher levels don't have debuff
  // TODO: debuff in exchange for more slots

  return {
    type: ModuleType.PowerSupply,
    id: getID(rng),
    sockets: getRandomSockets(rng, 2 + level / 2, 2),
    level,
    stats: {
      playerMults: debuff,
    },
  };
}

function createProcessingModule(level: number, rng: WHRNG, addDebuff = true): DeckModule {
  const fullStats = getAllStatRanges(Math.max(level, 1));
  const otherStatKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherStatKeys[Math.floor(rng.random() * otherStatKeys.length)];
  const valueRange: [number, number] = fullStats.otherMults[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng.random();

  const debuff = addDebuff ? getDebuff(level, rng) : {};


  return {
    type: ModuleType.ProcessingModule,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: debuff,
      otherMults: {
        [statToAdd]: value,
      },
    },
  };
}

function createUplink(level: number, rng: WHRNG, addDebuff = true): DeckModule {

  const buff = getPlayerStatBuff(level, rng);
  const debuff = addDebuff ? getDebuff(level, rng) : {};
  const mergedStats = mergeBuffs(debuff, buff);

  return {
    type: ModuleType.Uplink,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: mergedStats,
    },
  };
}


function createRackExtension(level: number, rng: WHRNG): DeckModule {
  const debuff = getDebuff(level, rng);
  return {
    stats: {
      playerMults: debuff,
      extraRackSlots: clampNumber(Math.floor(1 + level / 4), 1, 3),
    },
    type: ModuleType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
  };
}

function createSkillChip(level: number, rng: WHRNG): DeckModule {
  return {
    type: ModuleType.SkillChip,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level,
    stats: {
      consumableStats: getConsumableBuff(level, rng),
    },
  };
}

export function mergeBuffs(...buffs: Partial<Multipliers>[]): Partial<Multipliers> {
  const merged: Partial<Multipliers> = {};
  const keys = new Set([...buffs.flatMap(buff => (buff ? Object.keys(buff) : []))]);

  for (const key of keys) {
    merged[key as keyof Multipliers] = buffs.reduce((sum, buff) => {
      if (buff && key in buff) {
        return sum + (buff[key as keyof Multipliers] ?? 0);
      }
      return sum;
    }, 0);
  }

  return merged;
}

function getRandomModuleType(rng: WHRNG) {
  const roll = rng.random();
  if (roll < 0.2) {
    return ModuleType.PowerSupply;
  }
  if (roll < 0.3) {
    return ModuleType.RackExtension;
  }
  if (roll < 0.6) {
    return ModuleType.ProcessingModule;
  }
  if (roll < 0.9) {
    return ModuleType.Uplink;
  }
  return ModuleType.SkillChip;
}

// TODO-fico: replace with better module set on prestige
export function createInitialModules(force = false) {
  if (CyberdeckState.storedModules.length > 0 && !force) {
    return;
  }
  CyberdeckState.installedModules = [];
  CyberdeckState.storedModules = [];
  CyberdeckState.connections = [];
  CyberdeckState.netrunningLevel = 8;
  for (let i = 0; i < 4; i++) {
    CyberdeckState.installedModules.push(createModule(getNextCraftingWHRNG()));
  }
  for (let i = 0; i < 5; i++) {
    CyberdeckState.storedModules.push(createModule(getNextCraftingWHRNG()));
  }
  CyberdeckState.netrunningLevel = 0;
  CyberdeckState.components.ROM = 25;
  CyberdeckState.components.chips = 25;
  CyberdeckState.components.neurodes = 25;
  CyberdeckState.components.ICE = 4;
  CyberdeckState.components.cores = 4;
}

export function canAffordComponentCost(cost: Partial<ComponentCounts>) {
  if (CyberdeckState.components.chips < (cost.chips ?? 0)) return false;
  if (CyberdeckState.components.ROM < (cost.ROM ?? 0)) return false;
  if (CyberdeckState.components.neurodes < (cost.neurodes ?? 0)) return false;
  if (CyberdeckState.components.ICE < (cost.ICE ?? 0)) return false;
  return true;
}

export function payComponentCost(cost: Partial<ComponentCounts>) {
  CyberdeckState.components.chips -= (cost.chips ?? 0);
  CyberdeckState.components.ROM -= (cost.ROM ?? 0);
  CyberdeckState.components.neurodes -= (cost.neurodes ?? 0);
  CyberdeckState.components.ICE -= (cost.ICE ?? 0);
}

export function craftICE() {
  if (!canAffordComponentCost(ICEbreakerCraftingCost)) {
    return false;
  }
  payComponentCost(ICEbreakerCraftingCost);
  CyberdeckState.components.ICE += 1;
  CyberdeckEvents.emit();
  return true;
}

export function craftPowerSupply() {
  if (!canAffordComponentCost(powerSupplyCraftingCost)) {
    return null;
  }
  payComponentCost(powerSupplyCraftingCost);
  const rng = getNextCraftingWHRNG();
  const newComponent = createPowerSupply(getLevel(rng, CyberdeckState.craftingLevel), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  void saveGame();
  return newComponent;
}

export function craftProcessingModule() {
  if (!canAffordComponentCost(processingModuleCraftingCost)) {
    return null;
  }
  payComponentCost(processingModuleCraftingCost);
  const rng = getNextCraftingWHRNG();
  const newComponent = createProcessingModule(getLevel(rng, CyberdeckState.craftingLevel), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  void saveGame();
  return newComponent;
}

export function craftUplink() {
  if (!canAffordComponentCost(uplinkCraftingCost)) {
    return null;
  }
  payComponentCost(uplinkCraftingCost);
  const rng = getNextCraftingWHRNG();
  const newComponent = createUplink(getLevel(rng, CyberdeckState.craftingLevel), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  void saveGame();
  return newComponent;
}

export function disassembleModule(module: DeckModule, showToast: boolean = false) {
  // TODO-fico: validation
  // TODO-fico: balance numbers
  CyberdeckState.components.chips += 2;
  CyberdeckState.components.ROM += 2;
  CyberdeckState.components.neurodes += 2;
  disconnectModule(module);
  if (CyberdeckState.installedModules.includes(module)) {
    moveModule(module, false, true, 0);
  }
  CyberdeckState.storedModules = CyberdeckState.storedModules.filter((m) => m !== module);
  if (showToast) {
    SnackbarEvents.emit(`Module disassembled. Gained +2 ${componentSymbols.chips}, +2 ${componentSymbols.ROM}, +2 ${componentSymbols.neurodes}.`, ToastVariant.INFO, 2000);
  }
  CyberdeckEvents.emit();
}
