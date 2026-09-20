import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getModuleById, getRandomSockets } from "../utils/moduleUtilities";
import { ComponentCounts, DeckMod } from "../Types";
import { ModType } from "../Enums";
import { createConnection, disconnectModule, moveModule } from "./moduleMutation";
import {
  ICEBreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "./constants";
import {
  getConsumableBuff,
  getDebuff,
  getID,
  getLevel,
  getNextCraftingPowerSupplyWHRNG,
  getNextCraftingProcessingModWHRNG,
  getNextCraftingUplinkWHRNG,
  getOtherStatBuff,
  getOtherStatDebuff,
  getPlayerStatBuff,
} from "../utils/statRng";
import { WHRNG } from "../../Casino/RNG";
import { clampNumber } from "../../utils/helpers/clampNumber";

import { gainComponentMessage } from "../ui/gainComponentToast";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { LocationName, ToastVariant } from "@enums";
import { mergeBuffs } from "../utils/modStatsUtils";

export const getCyberdeckIOPanel = (): DeckMod => {
  return {
    type: ModType.CyberdeckIOPanel,
    id: "cyberdeck-io-panel",
    sockets: [false, true, false, true, false, true, false, false],
    rarity: 10,
    stats: {},
    charged: true,
  };
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
  const debuff = getDebuff(level, rng);

  const extraSlotVariant = rng.random() < 0.1;
  const debuff2 = extraSlotVariant ? getOtherStatDebuff(level, rng) : {};
  const extraSockets = rng.random() < 0.08 ? 1 : 0;
  const bonus = Math.max((extraSlotVariant ? 2 : 1) + extraSockets, 2);

  const buff = rng.random() < 0.2 ? getPlayerStatBuff(level / 2, rng, 0.5) : {};

  return {
    type: ModType.PowerSupply,
    id: getID(rng),
    sockets: getRandomSockets(rng, 2 + level / 3, bonus, true),
    rarity: level,
    stats: {
      playerMults: mergeBuffs(debuff, buff),
      otherMults: debuff2,
    },
  };
}

export function createProcessingModule(
  level: number,
  rng: WHRNG,
  addDebuff = true,
  scalar = 1,
  debuffScalar = 1,
): DeckMod {
  const buff = getOtherStatBuff(level, rng, scalar);

  const applyStandardDebuff = rng.random() < 0.5;
  const debuff = addDebuff && applyStandardDebuff ? getDebuff(level, rng, debuffScalar) : {};
  const otherMultDebuff = addDebuff && !applyStandardDebuff ? getOtherStatDebuff(level, rng, debuffScalar) : {};
  const effects = mergeBuffs(otherMultDebuff, buff);

  return {
    type: ModType.ProcessingMod,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    rarity: level,
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
    rarity: level,
    stats: {
      playerMults: mergedStats,
      otherMults: otherMultDebuff,
    },
  };
}

function createRackExtension(level: number, rng: WHRNG): DeckMod {
  const debuff = getDebuff(level, rng);
  const buff = rng.random() < 0.2 ? getPlayerStatBuff(level / 2, rng, 0.5) : {};
  return {
    stats: {
      playerMults: mergeBuffs(debuff, buff),
      extraRackSlots: clampNumber(Math.floor(1 + level / 4), 1, 3),
    },
    type: ModType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1 + level / 3, 0, true),
    rarity: level,
  };
}

function createSkillChip(level: number, rng: WHRNG): DeckMod {
  return {
    type: ModType.SkillChip,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    rarity: level,
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
  const rng = getNextCraftingPowerSupplyWHRNG();
  const powerSupply: DeckMod = {
    type: ModType.PowerSupply,
    id: getID(rng),
    rarity: 1,
    sockets: [true, false, false, true, false, false, true, false],
    stats: {
      playerMults: {
        charisma: -0.03,
      },
    },
  };
  const processingModule: DeckMod = {
    type: ModType.ProcessingMod,
    id: getID(rng),
    rarity: 3,
    sockets: [true, false, false, false, false, false, false, false],
    stats: {
      playerMults: getDebuff(2, rng),
      otherMults: {
        neurodeProduction: 0.15,
      },
    },
  };
  const uplinkModule: DeckMod = {
    type: ModType.Uplink,
    id: getID(rng),
    rarity: 0,
    sockets: [false, false, false, false, false, false, true, false],
    stats: {
      playerMults: {
        hacknet_node_money: 0.05,
      },
      otherMults: getOtherStatDebuff(0, rng, 0.5),
    },
  };
  const skillChip: DeckMod = {
    type: ModType.SkillChip,
    id: getID(rng),
    rarity: 3,
    sockets: [false, true, false, false, false, false, false, false],
    stats: {
      consumableStats: {
        netrunning_lvl: 0.13,
      },
    },
  };
  const uplinkModule2: DeckMod = {
    type: ModType.Uplink,
    id: getID(rng),
    rarity: 3,
    sockets: [false, false, false, false, false, true, false, false],
    stats: {
      playerMults: {
        crime_success: 0.1,
      },
      otherMults: getOtherStatDebuff(0, rng, 0.5),
    },
  };

  CyberdeckState.storedModules = [skillChip, uplinkModule2];
  CyberdeckState.installedModules = [processingModule, powerSupply, uplinkModule];
  createConnection({ modId: powerSupply.id, socketIndex: 0 }, { modId: processingModule.id, socketIndex: 0 });

  CyberdeckState.components.rom = 25;
  CyberdeckState.components.neurodes = 25;
  CyberdeckState.components.chips = 25;
  CyberdeckState.components.cores = 2;
  CyberdeckState.components.iceBreakers = 30;

  CyberdeckState.tutorialSteps.hasMadeConnection = false;
  CyberdeckState.tutorialSteps.hasChargedModule = false;
}

export function canAffordComponentCost(cost: Partial<ComponentCounts>, count = 1) {
  if (CyberdeckState.components.chips < (cost.chips ?? 0) * count) return false;
  if (CyberdeckState.components.rom < (cost.rom ?? 0) * count) return false;
  if (CyberdeckState.components.neurodes < (cost.neurodes ?? 0) * count) return false;
  if (CyberdeckState.components.cores < (cost.cores ?? 0) * count) return false;
  if (CyberdeckState.components.iceBreakers < (cost.iceBreakers ?? 0) * count) return false;
  return true;
}

export function payComponentCost(cost: Partial<ComponentCounts>, count = 1) {
  CyberdeckState.components.chips -= (cost.chips ?? 0) * count;
  CyberdeckState.components.rom -= (cost.rom ?? 0) * count;
  CyberdeckState.components.neurodes -= (cost.neurodes ?? 0) * count;
  CyberdeckState.components.cores -= (cost.cores ?? 0) * count;
  CyberdeckState.components.iceBreakers -= (cost.iceBreakers ?? 0) * count;
}

export function craftICEBreaker(count = 1) {
  if (!canAffordComponentCost(ICEBreakerCraftingCost, count)) {
    return false;
  }
  payComponentCost(ICEBreakerCraftingCost, count);
  CyberdeckState.components.iceBreakers += count * 10;
  CyberdeckEvents.emit();
  return true;
}

export function craftPowerSupply() {
  if (!canAffordComponentCost(powerSupplyCraftingCost)) {
    return null;
  }
  payComponentCost(powerSupplyCraftingCost);
  const rng = getNextCraftingPowerSupplyWHRNG();
  const newComponent = createPowerSupply(getLevel(rng, CyberdeckState.craftingLevel + 1), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  return newComponent;
}

export function craftProcessingModule() {
  if (!canAffordComponentCost(processingModuleCraftingCost)) {
    return null;
  }
  payComponentCost(processingModuleCraftingCost);
  const rng = getNextCraftingProcessingModWHRNG();
  const newComponent = createProcessingModule(getLevel(rng, CyberdeckState.craftingLevel), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  return newComponent;
}

export function craftUplink() {
  if (!canAffordComponentCost(uplinkCraftingCost)) {
    return null;
  }
  payComponentCost(uplinkCraftingCost);
  const rng = getNextCraftingUplinkWHRNG();
  const newComponent = createUplink(getLevel(rng, CyberdeckState.craftingLevel), rng);
  CyberdeckState.storedModules.push(newComponent);
  CyberdeckEvents.emit();
  return newComponent;
}

export function disassembleModule(module: DeckMod, showToast: boolean = false): ComponentCounts {
  if (module.favorite) {
    if (showToast) {
      SnackbarEvents.emit(`Cannot disassemble favorited module!`, ToastVariant.ERROR, 2000);
    }
    return { chips: 0, rom: 0, neurodes: 0, cores: 0, iceBreakers: 0 };
  }
  if (!moduleExists(module.id)) {
    console.error(`Attempted to disassemble nonexistent mod ${module.id}`);
    return { chips: 0, rom: 0, neurodes: 0, cores: 0, iceBreakers: 0 };
  }

  disconnectModule(module);
  if (CyberdeckState.installedModules.includes(module)) {
    moveModule(module, false, true);
  }
  CyberdeckState.storedModules = CyberdeckState.storedModules.filter((m) => m !== module);

  if (module.id == LocationName.IshimaGlitch) {
    if (showToast) {
      SnackbarEvents.emit("Mod recycled.", ToastVariant.SUCCESS, 2000);
    }
    return { chips: 0, rom: 0, neurodes: 0, cores: 0, iceBreakers: 0 };
  }

  const chipsGained = module.type !== ModType.Uplink ? 2 : 0;
  const ROMGained = 2;
  const neurodesGained = module.type !== ModType.ProcessingMod ? 2 : 0;
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.components.rom += ROMGained;
  CyberdeckState.components.neurodes += neurodesGained;

  if (showToast) {
    gainComponentMessage({ chips: chipsGained, rom: ROMGained, neurodes: neurodesGained });
  }
  CyberdeckEvents.emit();
  return { chips: chipsGained, rom: ROMGained, neurodes: neurodesGained, cores: 0, iceBreakers: 0 };
}

export function getEasterEggModule(): DeckMod {
  const existingModule = getModuleById(LocationName.IshimaGlitch);
  if (existingModule) {
    return existingModule;
  }

  return {
    type: ModType.ProcessingMod,
    id: LocationName.IshimaGlitch,
    rarity: 2,
    sockets: [false, false, false, false, false, false, false, true],
    stats: {
      playerMults: {
        hacknet_node_money: 0.1729,
      },
      otherMults: {
        neurodeProduction: 1.729,
      },
    },
  };
}

export function moduleExists(id: string) {
  return (
    CyberdeckState.installedModules.some((m) => m.id === id) || CyberdeckState.storedModules.some((m) => m.id === id)
  );
}
