import { CyberdeckState, hasCyberdeck } from "./CyberdeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { minCyclesToProcess, NEURODES_PER_ASSASSINATION, NEURODES_PER_HOMICIDE } from "./constants";
import { ClassWork, isClassWork } from "../../Work/ClassWork";
import { CompanyWork, isCompanyWork } from "../../Work/CompanyWork";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";
import { Crime } from "../../Crime/Crime";
import { CrimeType } from "@enums";
import { ComponentCounts, SimpleComponentCounts } from "../Types";
import { checkSupplierChallenge } from "./challenges";
import { CONSTANTS } from "../../Constants";

const lastStatsSnapshot = {
  totalWorkRep: null as number | null,
  totalHacknetIncome: null as number | null,
};

export function gainCyberdeckComponents(cycles: number, hacknetMoney = 0) {
  if (!hasCyberdeck()) {
    return;
  }
  CyberdeckState.storedCycles += cycles;
  initStats();

  if (
    CyberdeckState.storedCycles < minCyclesToProcess ||
    lastStatsSnapshot.totalWorkRep === null ||
    lastStatsSnapshot.totalHacknetIncome === null
  ) {
    return;
  }
  CyberdeckState.storedCycles -= minCyclesToProcess;

  processCyberdeckComponentGains(hacknetMoney);

  checkSupplierChallenge();
}

export function processCyberdeckComponentGains(hacknetMoney = 0, time = minCyclesToProcess) {
  const ticks = time / minCyclesToProcess;
  const componentsGained = [
    getCyberdeckComponentsFromHacknetIncome(hacknetMoney, ticks),
    getCyberdeckComponentsFromWork(ticks),
    getCyberdeckComponentsFromMods(ticks),
    getNeurodesFromCortexShare(ticks),
  ];
  return componentsGained.reduce<ComponentCounts>(
    (acc, c) => ({
      chips: acc.chips + (c.chips ?? 0),
      neurodes: acc.neurodes + (c.neurodes ?? 0),
      rom: acc.rom + (c.rom ?? 0),
      cores: 0,
      iceBreakers: 0,
    }),
    { chips: 0, neurodes: 0, rom: 0, cores: 0, iceBreakers: 0 },
  );
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
  const romGained = 3 * ticks;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.rom.programs += romGained;
  return { rom: romGained };
}

export function getNeurodesFromClass(work: ClassWork, ticks = 1) {
  const tuition = work.calculateRates().money * -1;
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
  const repPerTick = work.getGainRates(job).reputation / ticks;
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
  const newChips = (0.1 + magnitude / 3) * 1.2 * ticks;
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
      ? (0.1 + (10 * threads + 300) / (threads + 300)) * ticks
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

export function getCrimeComponentReward(crime: Crime, isSleeve = false): Partial<ComponentCounts> {
  const scalar = isSleeve ? 0.4 : 1;
  if (crime.type === CrimeType.homicide) {
    return { neurodes: NEURODES_PER_HOMICIDE * scalar };
  }
  if (crime.type === CrimeType.assassination) {
    return { neurodes: NEURODES_PER_ASSASSINATION * scalar };
  }

  const newRom = (0.1 + (10 * crime.money + 1e7) / (crime.money + 1e7)) * (crime.time / 10000) * scalar;
  return { rom: newRom };
}

export function gainCrimeComponentReward(crime: Crime, isSleeve = false) {
  const { neurodes = 0, rom = 0 } = getCrimeComponentReward(crime, isSleeve);

  CyberdeckState.components.neurodes += neurodes;
  CyberdeckState.componentStats.neurodes.kills += neurodes;

  CyberdeckState.components.rom += rom;
  CyberdeckState.componentStats.rom.pettyCrime += rom;
}

function initStats() {
  if (lastStatsSnapshot.totalWorkRep === null) {
    lastStatsSnapshot.totalWorkRep = getAllWorkRep();
  }
  if (lastStatsSnapshot.totalHacknetIncome === null) {
    lastStatsSnapshot.totalHacknetIncome = Player.moneySourceA.hacknet;
  }
}

function getAllWorkRep() {
  const employers = Object.keys(Player.jobs);
  let total = 0;

  for (const companyName of employers) {
    if (!isMember("CompanyName", companyName)) continue;
    const company = Companies[companyName];
    total += company?.playerReputation ?? 0;
  }
  return total;
}

export function prestigeCyberdeckComponents() {
  lastStatsSnapshot.totalWorkRep = null;
  lastStatsSnapshot.totalHacknetIncome = null;

  CyberdeckState.components = {
    chips: 0,
    rom: 0,
    neurodes: 0,
    cores: 0,
    iceBreakers: 0,
  };
  CyberdeckState.componentStats = {
    rom: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
      netrunning: 0,
      mods: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
      netrunning: 0,
      mods: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
      cortexShare: 0,
      netrunning: 0,
      mods: 0,
    },
    cores: {
      netrunning: 0,
    },
  };
}
