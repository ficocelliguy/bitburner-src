import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";
import { getRandomSockets } from "../utils/moduleUtilities";
import { ComponentCounts, DeckModule, ModuleStats, ModuleType } from "../Types";
import { generateStatBonus } from "./StatBonuses";
import { disconnectModule, moveModule } from "./moduleMutation";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import {
  componentSymbols, ICEbreakerCraftingCost, powerSupplyCraftingCost, processingModuleCraftingCost, uplinkCraftingCost } from "./constants";
import { saveGame } from "../../SaveObject";


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

function getFullStatBlock(level: number): ModuleStats {
  const highWeight = level > 4 && Math.random() < 0.4;
  return {
    playerMults: {
      hacking_exp: generateStatBonus(0.001 + 0.001 * level, 0.004 + 0.0003 * level, highWeight),
      strength: generateStatBonus(0.001 + 0.0001 * level, 0.004 + 0.0003 * level, highWeight),
      strength_exp: 0,
      defense: 0,
      defense_exp: 0,
      dexterity: 0,
      dexterity_exp: 0,
      agility: 0,
      agility_exp: 0,
      charisma: 0,
      charisma_exp: 0,
      hacknet_node_money: 0,
      hacknet_node_purchase_cost: 0,
      hacknet_node_ram_cost: 0,
      hacknet_node_core_cost: 0,
      hacknet_node_level_cost: 0,
      company_rep: 0,
      work_money: 0,
      crime_success: 0,
      crime_money: 0,
    },
    otherMults: {
      romProduction: generateStatBonus(0.01 + 0.05 * level, 0.15 + 0.08 * level, highWeight),
      chipProduction: generateStatBonus(0.01 + 0.05 * level, 0.15 + 0.08 * level, highWeight),
      neurodeProduction: generateStatBonus(0.01 + 0.05 * level, 0.15 + 0.08 * level, highWeight),
      stock_commission: 0, // getBuyTransactionCost
    },
    consumableStats: {
      netrunning: Math.random() * (level / 25) + level / 40 + 0.1,
    },
    endgameStats: {
      bladeburner_stamina_gain: 0,
      graft_speed: 0,
      sleeve_sync: 0,
      stanek_charge: 0,
    },
    extraRackSlots: Math.floor(Math.random() * (2 + level / 4)) || 1,
  };
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
// TODO-fico: save modules
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