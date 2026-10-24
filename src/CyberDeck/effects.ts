import { Player } from "@player";
import { mergeMultipliers } from "../PersonObjects/Multipliers";
import { CyberdeckState, hasCyberdeck } from "./models/CyberdeckState";
import { getCyberdeckStatBonuses } from "./utils/modStatsUtils";
import { gainComponentMessage } from "./ui/gainComponentToast";
import { Server } from "../Server/Server";
import { DarknetServer } from "../Server/DarknetServer";
import { SimpleComponentCounts } from "./Types";
import { CompanyWork, isCompanyWork } from "../Work/CompanyWork";
import { isCreateProgramWork } from "../Work/CreateProgramWork";
import { ClassWork, isClassWork } from "../Work/ClassWork";
import { CONSTANTS } from "../Constants";
import { minCyclesToProcess } from "./models/constants";

export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses(1);
  const playerMults = mults.playerMults;
  mults.playerMults.bladeburner_stamina_gain = mults.endgameMults.stamina_gain;
  Player.mults = mergeMultipliers(Player.mults, playerMults);
  Player.updateSkillLevels();
}

export function gainCyberdeckComponentsFromSaveBackup() {
  if (!hasCyberdeck()) {
    return;
  }
  CyberdeckState.components.chips += 100;
  CyberdeckState.components.rom += 100;
  CyberdeckState.components.neurodes += 100;
  gainComponentMessage({ chips: 100, rom: 100, neurodes: 100 });
}

export function gainCyberdeckComponentsFromNukeOrBackdoor(
  server: Server | DarknetServer,
  showToast = true,
  backdoor = false,
) {
  if (!hasCyberdeck() || (backdoor && server.backdoorInstalled) || (!backdoor && server.hasAdminRights)) {
    return;
  }
  const difficulty = server instanceof Server ? server.requiredHackingSkill : server.requiredCharismaSkill;
  const romGained = backdoor ? Math.floor(difficulty / 5 + 30) : 10;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.rom.backdoors += romGained;
  if (showToast) {
    gainComponentMessage({ rom: romGained });
  }
  return romGained;
}

export function gainCyberdeckComponentsFromCCT(difficulty: number) {
  if (!hasCyberdeck()) {
    return;
  }
  const neurodesGained = Math.floor(difficulty * 4 + 10);
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.codingContracts += neurodesGained;
  return neurodesGained;
}

export function gainCyberdeckChipsFromIPvGO(nodesCaptured: number) {
  if (!hasCyberdeck()) {
    return;
  }
  const chipsGained = Math.floor(nodesCaptured * 0.6 + 3);
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.IPvGO += chipsGained;
  return chipsGained;
}

export function gainCyberdeckRomFromCache() {
  if (!hasCyberdeck()) {
    return;
  }
  const romGained = 20;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.rom.caches += romGained;
  return romGained;
}

export function getCyberdeckComponentsFromWork(ticks = 1): Partial<SimpleComponentCounts> {
  if (isCreateProgramWork(Player.currentWork)) {
    return getRomFromManualProgramCreation(ticks);
  }

  if (isClassWork(Player.currentWork)) {
    return getNeurodesFromClass(Player.currentWork, ticks);
  }

  if (isCompanyWork(Player.currentWork)) {
    return getChipsFromCompanyWork(Player.currentWork, ticks);
  }
  return {};
}

export function getCyberdeckComponentsFromMods(ticks = 1): SimpleComponentCounts {
  const stats = getCyberdeckStatBonuses();
  const chips = Math.max(stats.otherMults.chipProduction, 0) * ticks;
  const neurodes = Math.max(stats.otherMults.neurodeProduction, 0) * ticks;
  const rom = Math.max(stats.otherMults.romProduction, 0) * ticks;
  CyberdeckState.components.chips += chips;
  CyberdeckState.componentStats.chips.mods += chips;
  CyberdeckState.components.neurodes += neurodes;
  CyberdeckState.componentStats.neurodes.mods += neurodes;
  CyberdeckState.components.rom += rom;
  CyberdeckState.componentStats.rom.mods += rom;
  return {
    chips,
    neurodes,
    rom,
  };
}

export function getRomFromManualProgramCreation(ticks = 1) {
  const romGained = 4 * ticks;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.rom.programs += romGained;
  return { rom: romGained };
}

export function getNeurodesFromClass(work: ClassWork, ticks = 1) {
  const tuitionPriceMod = getCyberdeckStatBonuses(1).otherMults.class_cost;
  const tuition = (work.calculateRates().money * -1) / tuitionPriceMod;
  const newNeurodes = (0.5 + tuition / 50) * ticks;
  CyberdeckState.components.neurodes += newNeurodes;
  CyberdeckState.componentStats.neurodes.class += newNeurodes;
  return {
    neurodes: newNeurodes,
  };
}

export function getChipsFromCompanyWork(work: CompanyWork, ticks = 1) {
  const job = Player.jobs[work.companyName];
  if (!job) {
    return {};
  }
  const repPerTick = work.getGainRates(job).reputation;
  const newChips = (0.1 + (10 * repPerTick + 1000) / (repPerTick + 1000)) * ticks;
  CyberdeckState.components.chips += newChips;
  CyberdeckState.componentStats.chips.companyWork += newChips;
  return {
    chips: newChips,
  };
}

export function getCyberdeckComponentsFromHacknetIncome(income: number, ticks = 1): Partial<SimpleComponentCounts> {
  const newIncome = income / ticks;
  const magnitude = Math.log10(newIncome + 1);
  const newChips = newIncome ? (0.1 + magnitude / 3) * 1.2 * ticks : 0;
  CyberdeckState.components.chips += newChips;
  CyberdeckState.componentStats.chips.hacknet += newChips;
  return {
    chips: newChips,
  };
}

export function getNeurodesFromCortexShare(ticks = 1): Partial<SimpleComponentCounts> {
  const threads = CyberdeckState.cortexSharedThreads;
  const newNeurodes =
    ticks > 1
      ? getOfflineNeurodesFromCortexShare(ticks)
      : threads > 0
      ? (0.1 + (10 * threads + 600) / (threads + 600)) * ticks
      : 0;
  CyberdeckState.components.neurodes += newNeurodes;
  CyberdeckState.componentStats.neurodes.cortexShare += newNeurodes;
  return {
    neurodes: newNeurodes,
  };
}

function getOfflineNeurodesFromCortexShare(ticks = 1) {
  const totalNeurodesGained = CyberdeckState.componentStats.neurodes.cortexShare;
  const totalOnlineTime = Player.playtimeSinceLastAug;
  const onlineCycles = totalOnlineTime / (CONSTANTS.MilliPerCycle * minCyclesToProcess);
  return onlineCycles > 0 ? (totalNeurodesGained / onlineCycles) * ticks : 0;
}
