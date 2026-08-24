import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getModuleById, getRandomSockets } from "../utils/moduleUtilities";
import { ComponentCounts, DeckMod, ModType } from "../Types";
import { disconnectModule, moveModule } from "./moduleMutation";
import {
  ICEbreakerCraftingCost,
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
  getOtherStatDebuff,
  getPlayerStatBuff,
} from "../utils/statRng";
import { WHRNG } from "../../Casino/RNG";
import { clampNumber } from "../../utils/helpers/clampNumber";

import { gainComponentMessage } from "../ui/gainComponentToast";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { LocationName, ToastVariant } from "@enums";
import { mergeBuffs } from "../utils/modStatsUtils";


export const CyberdeckIOPanel: DeckMod = {
  type: ModType.CyberdeckIOPanel,
  id: "Hosaka Mk 1 Cyberdeck",
  sockets: [false, true, false, true, false, true, false, false],
  level: 10,
  stats: {},
};

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
  const debuff = getDebuff(level, rng); // TODO: higher levels don't have debuff
  // TODO: debuff in exchange for more slots

  return {
    type: ModType.PowerSupply,
    id: getID(rng),
    sockets: getRandomSockets(rng, 2 + level / 2, 2),
    level,
    stats: {
      playerMults: debuff,
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

// TODO-fico: replace with better module set on prestige / first time purchase
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
    moveModule(module, false, true, 0);
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