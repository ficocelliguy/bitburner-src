import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getRandomSockets } from "../utils/moduleUtilities";
import {
  ComponentCounts,
  ConsumableStats,
  CyberdeckStats,
  DeckModule,
  EndgameMults,
  MiscMults,
  ModuleType,
} from "../Types";
import { getStatRollRange } from "./StatBonuses";
import { disconnectModule, moveModule } from "./moduleMutation";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import {
  componentSymbols, ICEbreakerCraftingCost, powerSupplyCraftingCost, processingModuleCraftingCost, uplinkCraftingCost } from "./constants";
import { saveGame } from "../../SaveObject";
import { getRecordKeys } from "../../Types/Record";
import { Multipliers } from "@nsdefs";


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

function getAllStatRanges(level: number) {
  const playerMults: Partial<{ [K in keyof Multipliers]: [number, number] }> = {
    hacking_chance: getStatRollRange(level, 1.2, 1.5, 1.5),
    hacking_exp: getStatRollRange(level, 0.8, 0.8, 1),
    strength: getStatRollRange(level, 1.2, 1.2, 1.5),
    strength_exp: getStatRollRange(level, 1.2, 1.2, 1.5),
    defense: getStatRollRange(level, 1.2, 1.2, 1.5),
    defense_exp: getStatRollRange(level, 1.2, 1.2, 1.5),
    dexterity: getStatRollRange(level, 1.2, 1.2, 1.5),
    dexterity_exp: getStatRollRange(level, 1.2, 1.2, 1.5),
    agility: getStatRollRange(level, 1.2, 1.2, 1.5),
    agility_exp: getStatRollRange(level, 1.2, 1.2, 1.5),
    charisma: getStatRollRange(level, 1, 1, 1.5),
    charisma_exp: getStatRollRange(level, 1, 1, 1.5),
    hacknet_node_money: getStatRollRange(level, 1.2, 4, 2),
    hacknet_node_ram_cost: getStatRollRange(level, -1.2, -2, -1.5),
    hacknet_node_core_cost: getStatRollRange(level, -1.2, -2, -1.5),
    hacknet_node_level_cost: getStatRollRange(level, -1.2, -2, -1.5),
    company_rep: getStatRollRange(level, 1, 1.5, 2),
    work_money: getStatRollRange(level, 3, 10, 5),
    crime_success: getStatRollRange(level, 2, 5, 2),
    crime_money: getStatRollRange(level, 1.5, 3, 1.5),
  };
  const otherMults: { [K in keyof MiscMults]: [number, number] } = {
    romProduction: getStatRollRange(level, 10, 30, 8),
    chipProduction: getStatRollRange(level, 10, 30, 8),
    neurodeProduction: getStatRollRange(level, 10, 30, 8),
    program_creation_speed: getStatRollRange(level, 1.5, 3, 1.5),
    crime_speed: getStatRollRange(level, 1.5, 3, 1.5),
    stock_fees: getStatRollRange(level, -1.5, -3, -1.5), // getBuyTransactionCost
    cct_money: getStatRollRange(level, 3, 4, 2),
    IPvGO_power: getStatRollRange(level, 1, 3, 1),
    class_cost: getStatRollRange(level, -2, -4, -3),
  };
  const consumableStats: { [K in keyof ConsumableStats]: [number, number] } = {
    netrunning_lvl: getStatRollRange(level, 10, 30, 8),
    netrun_cooldown: getStatRollRange(level, -1.5, -3, -1.5),
    mod_storage: getStatRollRange(level, 20, 40, 10),
  };
  const endgameStats: { [K in keyof EndgameMults]: [number, number] } = {
    stamina_gain: getStatRollRange(level, 1.5, 1.5, 1.5),
    graft_speed: getStatRollRange(level, 0.8, 1.5, 1.2),
    sleeve_sync: getStatRollRange(level, 0.8, 1.5, 1.2),
    stanek_charge: getStatRollRange(level, 0.8, 1.5, 1.2),
    equipment_cost: getStatRollRange(level, -1.5, -3, -1.5),
  };

  return {
    playerMults,
    otherMults,
    consumableStats,
    endgameStats,
    extraRackSlots: Math.floor(Math.random() * (2 + level / 4)) || 1, // TODO-fico
  } as const;
}

function createPowerSupply(level: number): DeckModule {
  const debuff = getDebuff(level); // TODO: higher levels don't have debuff
  // TODO: debuff in exchange for more slots

  return {
    type: ModuleType.PowerSupply,
    id: `${(Math.random() * 1e4) | 0}`, // TODO: use seed
    sockets: getRandomSockets(2 + level / 2, 2), // TODO: use seed
    level,
    stats: {
      playerMults: debuff,
    },
  };
}

function createProcessingModule(level: number): DeckModule {

  const rng1 = Math.random();
  const rng2 = Math.random();

  const fullStats = getAllStatRanges(Math.max(level, 1));
  const otherStatKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherStatKeys[Math.floor(rng1 * otherStatKeys.length)];
  const valueRange: [number, number] = fullStats.otherMults[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng2;

  const debuff = getDebuff(level);


  return {
    type: ModuleType.ProcessingModule,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: debuff,
      otherMults: {
        [statToAdd]: value,
      },
    },
  };
}

function createUplink(level: number): DeckModule {

  const buff = getPlayerStatBuff(level);
  const debuff = getDebuff(level);
  const mergedStats = mergeBuffs(debuff, buff);

  return {
    type: ModuleType.Uplink,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
    stats: {
      playerMults: mergedStats,
    },
  };
}


function createRackExtension(level: number): DeckModule {
  const debuff = getDebuff(level);
  return {
    stats: {
      playerMults: debuff,
      extraRackSlots: Math.floor(Math.random() * (2 + level / 4)) || 1,
    },
    type: ModuleType.RackExtension,
    id: `${(Math.random() * 1e4) | 0}`,
    sockets: getRandomSockets(1 + level / 3, 0, true),
    level,
  };
}

function createSkillChip(level: number): DeckModule {
  const rng1 = Math.random();
  const rng2 = Math.random();

  const fullStats = getAllStatRanges(level);

  const consumableKeys = getRecordKeys(fullStats.consumableStats);
  const statToAdd = consumableKeys[Math.floor(rng1 * consumableKeys.length)];
  const valueRange: [number, number] = fullStats.consumableStats[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng2;

  return {
    type: ModuleType.SkillChip,
    id: `${(Math.random() * 1e4) | 0}`, // TODO: use seed
    sockets: getRandomSockets(1), // TODO: use seed
    level,
    stats: {
      consumableStats: {
        [statToAdd]: value,
      },
    },
  };
}

function getPlayerStatBuff(level: number): Partial<Multipliers> {
  const rng1 = Math.random();
  const rng2 = Math.random();

  const fullStats = getAllStatRanges(Math.max(level, 1));

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange: [number, number] = fullStats.playerMults[statToAdd] ?? [0,0];
  const value = (valueRange[1] - valueRange[0])  * rng2;

  return {
      [statToAdd]: value,
  };
}

function getDebuff(level: number): Partial<Multipliers> {
  const rng1 = Math.random(); // TODO: use seed
  const rng2 = Math.random();

  const fullStats = getAllStatRanges(Math.max(4 - level / 2, 1));

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange: [number, number] = fullStats.playerMults[statToAdd] ?? [0,0];
  const value = (valueRange[1] - valueRange[0]) * -1 * rng2;

  return {
      [statToAdd]: value,
  }
}

function mergeBuffs(buff1: Partial<Multipliers>, buff2: Partial<Multipliers>): Partial<Multipliers> {
  const merged: Partial<Multipliers> = {};
  const keys = new Set<string>([...(buff1 ? Object.keys(buff1) : []), ...(buff2 ? Object.keys(buff2) : [])]);

  for (const key of keys) {
    const value1 = buff1[key as keyof Multipliers] ?? 0;
    const value2 = buff2[key as keyof Multipliers] ?? 0;
    merged[key as keyof Multipliers] = value1 + value2;
  }

  return merged;
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
  const levelUpAttempts = (CyberdeckState.netrunningLevel / (CyberdeckState.netrunningLevel + 1)) * 16 + Math.random() * 4;
  let level = 0;
  for (let i = 0; i < levelUpAttempts ; i++) {
    if (Math.random() < 0.5 - i / 20) {
      level++;
    }
  }
  return level;
}

// TODO-fico: replace with better module set on prestige
export function createInitialModules() {
  CyberdeckState.netrunningLevel = 8;
  for (let i = 0; i < 4; i++) {
    CyberdeckState.installedModules.push(createModule());
  }
  for (let i = 0; i < 10; i++) {
    CyberdeckState.storedModules.push(createModule());
  }
  CyberdeckState.netrunningLevel = 0;
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
  const newComponent = createPowerSupply(1);
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
  const newComponent = createProcessingModule(1);
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
  const newComponent = createUplink(1);
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
