import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getModuleById, getRandomSockets } from "../utils/moduleUtilities";
import { ComponentCounts, DeckMod, ModType } from "../Types";
import { createConnection, disconnectModule, moveModule } from "./moduleMutation";
import {
  ICEbreakerCraftingCost, isCustomBuild,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "./constants";
import { saveGame } from "../../SaveObject";
import { getRecordKeys } from "../../Types/Record";
import {
  getAllStatRanges,
  getConsumableBuff,
  getDebuff,
  getID,
  getLevel,
  getNextCraftingWHRNG,
  getNextNetrunningWHRNG,
  getOtherStatDebuff,
  getPlayerStatBuff,
} from "../utils/statRng";
import { WHRNG } from "../../Casino/RNG";
import { clampNumber } from "../../utils/helpers/clampNumber";

import { gainComponentMessage } from "../ui/gainComponentToast";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { LocationName, ToastVariant } from "@enums";
import { getFormattedStatBonus, mergeBuffs } from "../utils/modStatsUtils";

export const getCyberdeckIOPanel = (): DeckMod => {
  const id = isCustomBuild() ? "Ono-Sendai Mk7 Cyberdeck" : "Hosaka Mk 1 Cyberdeck";
  return {
    type: ModType.CyberdeckIOPanel,
    id,
    sockets: [false, true, false, true, false, true, false, false],
    level: 10,
    stats: {},
  };
}

export function createModule(rng: WHRNG, type: ModType = getRandomModuleType(rng), level: number = getLevel(rng)) {
  if (type == ModType.PowerSupply) {
    return createPowerSupply(level, rng);
  }
  if (type == ModType.RackExtension) {
    return createRackExtension(level, rng);
  }
  if (type == ModType.SkillChip) {
    return createSkillChip(level, rng);
  }
  if (type == ModType.Uplink) {
    return createUplink(level, rng);
  }
  return createProcessingModule(level, rng);
}

function createPowerSupply(level: number, rng: WHRNG): DeckMod {
  const debuff = getDebuff(level, rng);
  const extraSlotVariant = rng.random() < 0.1;
  const debuff2 = extraSlotVariant? getOtherStatDebuff(level,rng) : {};
  const bonus = extraSlotVariant ? 3 : 2;

  return {
    type: ModType.PowerSupply,
    id: getID(rng),
    sockets: getRandomSockets(rng, 2 + level / 3, bonus),
    level,
    stats: {
      playerMults: debuff,
      otherMults: debuff2,
    },
  };
}

export function createProcessingModule(level: number, rng: WHRNG, addDebuff = true, scalar = 1, debuffScalar = 1): DeckMod {
  const fullStats = getAllStatRanges(Math.max(level, 1));
  const otherStatKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherStatKeys[Math.floor(rng.random() * otherStatKeys.length)];
  const valueRange: [number, number] = fullStats.otherMults[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng.random() * scalar + valueRange[0];

  const applyStandardDebuff = rng.random() < 0.5;
  const debuff = addDebuff && applyStandardDebuff ? getDebuff(level, rng, debuffScalar) : {};
  const otherMultDebuff = addDebuff && !applyStandardDebuff ? getOtherStatDebuff(level, rng, debuffScalar) : {};
  const effects = mergeBuffs(otherMultDebuff, { [statToAdd]: value });

  return {
    type: ModType.ProcessingMod,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: debuff,
      otherMults: effects,
    },
  };
}

export function createUplink(level: number, rng: WHRNG, addDebuff = true, scalar = 1, debuffScalar = 1): DeckMod {
  const buff = getPlayerStatBuff(level, rng, scalar);

  const applyStandardDebuff = rng.random() < 0.8;
  const debuff = addDebuff && applyStandardDebuff ? getDebuff(level, rng, debuffScalar) : {};
  const otherMultDebuff = addDebuff && !applyStandardDebuff ? getOtherStatDebuff(level, rng, debuffScalar) : {};
  const mergedStats = mergeBuffs(debuff, buff);

  return {
    type: ModType.Uplink,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: mergedStats,
      otherMults: otherMultDebuff,
    },
  };
}


function createRackExtension(level: number, rng: WHRNG): DeckMod {
  const debuff = getDebuff(level, rng);
  return {
    stats: {
      playerMults: debuff,
      extraRackSlots: clampNumber(Math.floor(1 + level / 4), 1, 3),
    },
    type: ModType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    level,
  };
}

function createSkillChip(level: number, rng: WHRNG): DeckMod {
  return {
    type: ModType.SkillChip,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level,
    stats: {
      consumableStats: getConsumableBuff(level, rng),
    },
  };
}

function getRandomModuleType(rng: WHRNG) {
  const roll = rng.random();
  if (roll < 0.2) {
    return ModType.PowerSupply;
  }
  if (roll < 0.3) {
    return ModType.RackExtension;
  }
  if (roll < 0.6) {
    return ModType.ProcessingMod;
  }
  if (roll < 0.9) {
    return ModType.Uplink;
  }
  return ModType.SkillChip;
}

export function createInitialModules() {
  if (CyberdeckState.storedModules.length || CyberdeckState.installedModules.length) {
    return; // TODO-fico: throw error here later
  }
  const rng = getNextNetrunningWHRNG();
  const powerSupply: DeckMod = {
    type: ModType.PowerSupply,
    id: getID(rng),
    level: 1,
    sockets: [true, false, false, true, false, false, true, false],
    stats: {
      playerMults: {
        charisma: 0.97,
      },
    },
  };
  const processingModule: DeckMod = {
    type: ModType.ProcessingMod,
    id: getID(rng),
    level: 3,
    sockets: [true, false, false, false, false, false, false, false],
    stats: {
      playerMults: getDebuff(2, rng),
      otherMults: {
        neurodeProduction: 0.15,
      }
    }
  };
  const uplinkModule: DeckMod = {
    type: ModType.Uplink,
    id: getID(rng),
    level: 0,
    sockets: [false, false, false, false, false, false, true, false],
    stats: {
      playerMults: {
        hacknet_node_money: 0.05,
      },
      otherMults: getOtherStatDebuff(0, rng, 0.5),
    }
  };
  const skillChip: DeckMod = {
    type: ModType.SkillChip,
    id: getID(rng),
    level: 3,
    sockets: [false, true, false, false, false, false, false, false],
    stats: {
      consumableStats: {
        netrunning_lvl: 0.13,
      },
    },
  };
  const uplinkModule2 = createUplink(1, rng);
  uplinkModule2.sockets = [false,  false, false, false, false, true, false, false];

  const randomMod1 = createProcessingModule(0, rng);
  const randomMod2 = createRackExtension(0, rng);
  CyberdeckState.storedModules = [randomMod1, skillChip, randomMod2];
  CyberdeckState.installedModules = [processingModule, powerSupply, uplinkModule2, uplinkModule];
  createConnection({ modId: powerSupply.id, socketIndex: 3 }, { modId: getCyberdeckIOPanel().id, socketIndex: 3 });
  createConnection({ modId: powerSupply.id, socketIndex: 0 }, { modId: processingModule.id, socketIndex: 0 });
  createConnection({ modId: powerSupply.id, socketIndex: 6 }, { modId: uplinkModule.id, socketIndex: 6 });
}

export function canAffordComponentCost(cost: Partial<ComponentCounts>, count = 1) {
  if (CyberdeckState.components.chips < (cost.chips ?? 0) * count) return false;
  if (CyberdeckState.components.ROM < (cost.ROM ?? 0) * count) return false;
  if (CyberdeckState.components.neurodes < (cost.neurodes ?? 0) * count) return false;
  if (CyberdeckState.components.ICE < (cost.ICE ?? 0) * count) return false;
  return true;
}

export function payComponentCost(cost: Partial<ComponentCounts>, count = 1) {
  CyberdeckState.components.chips -= (cost.chips ?? 0) * count;
  CyberdeckState.components.ROM -= (cost.ROM ?? 0) * count;
  CyberdeckState.components.neurodes -= (cost.neurodes ?? 0) * count;
  CyberdeckState.components.ICE -= (cost.ICE ?? 0) * count;
}

export function craftICEbreaker(count = 1) {
  if (!canAffordComponentCost(ICEbreakerCraftingCost, count)) {
    return false;
  }
  payComponentCost(ICEbreakerCraftingCost, count);
  CyberdeckState.components.ICE += count;
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

export function disassembleModule(module: DeckMod, showToast: boolean = false): ComponentCounts {
  if (module.favorite) {
    if (showToast) { SnackbarEvents.emit(`Cannot disassemble favorited module!`, ToastVariant.ERROR, 2000); }
    return { chips: 0, ROM: 0, neurodes: 0, cores: 0, ICE: 0 };
  }
  if (module.id == LocationName.IshimaGlitch) {
    if (showToast) { SnackbarEvents.emit("Mod recycled.", ToastVariant.SUCCESS, 2000); }
    return { chips: 0, ROM: 0, neurodes: 0, cores: 0, ICE: 0 };
  }

  const chipsGained = module.type !== ModType.Uplink ? 2 : 0;
  const ROMGained = 2;
  const neurodesGained = module.type !== ModType.ProcessingMod ? 2 : 0;
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.components.ROM += ROMGained;
  CyberdeckState.components.neurodes += neurodesGained;

  disconnectModule(module);
  if (CyberdeckState.installedModules.includes(module)) {
    moveModule(module, false, true);
  }
  CyberdeckState.storedModules = CyberdeckState.storedModules.filter((m) => m !== module);

  if (showToast) { gainComponentMessage({ chips: chipsGained, ROM: ROMGained, neurodes: neurodesGained }); }
  CyberdeckEvents.emit();
  return { chips: chipsGained, ROM: ROMGained, neurodes: neurodesGained, cores: 0, ICE: 0 };
}


export function getEasterEggModule(): DeckMod {
  const existingModule = getModuleById(LocationName.IshimaGlitch);
  if (existingModule) {
    return existingModule;
  }

  return {
    type: ModType.ProcessingMod,
    id: LocationName.IshimaGlitch,
    level: 2,
    sockets: [false, false, false, false, false, false, false, true],
    stats: {
      playerMults: {
        hacknet_node_money: 0.1729,
      },
      otherMults: {
        neurodeProduction: 0.1729,
      },
    },
  };

}
