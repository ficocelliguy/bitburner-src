import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { minCyclesToProcess, NEURODES_PER_ASSASSINATION, NEURODES_PER_HOMICIDE } from "./constants";
import { isClassWork } from "../../Work/ClassWork";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";
import { Crime } from "../../Crime/Crime";
import { CrimeType } from "@enums";
import { ComponentCounts } from "../Types";

const lastStatsSnapshot = {
  killCount: null as number | null,
  crimeMoney: null as number | null,

  totalWorkRep: null as number | null,
  totalHacknetIncome: null as number | null,
};

export function gainCyberdeckComponents(cycles: number) {
  CyberdeckState.storedCycles += cycles;
  initStats();

  if (
    CyberdeckState.storedCycles < minCyclesToProcess ||
    lastStatsSnapshot.killCount === null ||
    lastStatsSnapshot.totalWorkRep === null ||
    lastStatsSnapshot.crimeMoney === null ||
    lastStatsSnapshot.totalHacknetIncome === null
  ) {
    return;
  }
  CyberdeckState.storedCycles -= minCyclesToProcess;

  const stats = getCyberdeckStatBonuses();
  CyberdeckState.components.chips += Math.max(stats.otherMults.chipProduction, 0);
  CyberdeckState.componentStats.chips.mods += Math.max(stats.otherMults.chipProduction, 0);
  CyberdeckState.components.neurodes += Math.max(stats.otherMults.neurodeProduction, 0);
  CyberdeckState.componentStats.neurodes.mods += Math.max(stats.otherMults.neurodeProduction, 0);
  CyberdeckState.components.rom += Math.max(stats.otherMults.romProduction, 0);
  CyberdeckState.componentStats.rom.mods += Math.max(stats.otherMults.romProduction, 0);

  // Making programs gives ROM
  if (isCreateProgramWork(Player.currentWork)) {
    CyberdeckState.components.rom += 3;
    CyberdeckState.componentStats.rom.programs += 3;
  }

  // Classes give neurodes
  if (isClassWork(Player.currentWork)) {
    const tuition = Player.currentWork.calculateRates().money * -1;
    const newNeurodes = 0.5 + tuition / 50;
    CyberdeckState.components.neurodes += newNeurodes;
    CyberdeckState.componentStats.neurodes.class += newNeurodes;
  }

  // Company job gives chips
  if (getAllWorkRep() > lastStatsSnapshot.totalWorkRep) {
    const newRep = getAllWorkRep() - lastStatsSnapshot.totalWorkRep;
    const newChips = 0.1 + (10 * newRep + 1000) / (newRep + 1000);
    CyberdeckState.components.chips += newChips;
    CyberdeckState.componentStats.chips.companyWork += newChips;
    lastStatsSnapshot.totalWorkRep = getAllWorkRep();
  }

  // Hacknet gives chips
  if (Player.moneySourceA.hacknet > lastStatsSnapshot.totalHacknetIncome) {
    const newIncome = Player.moneySourceA.hacknet - lastStatsSnapshot.totalHacknetIncome;
    const magnitude = Math.log10(newIncome + 1);
    const newChips = (0.1 + magnitude / 3) * 1.2;
    CyberdeckState.components.chips += newChips;
    CyberdeckState.componentStats.chips.hacknet += newChips;
    lastStatsSnapshot.totalHacknetIncome = Player.moneySourceA.hacknet;
  }

  // cortexShare() gives neurodes
  if (CyberdeckState.cortexSharedThreads > 0) {
    const newNeurodes =
      0.1 + (10 * CyberdeckState.cortexSharedThreads + 300) / (CyberdeckState.cortexSharedThreads + 300);
    CyberdeckState.components.neurodes += newNeurodes;
    CyberdeckState.componentStats.neurodes.cortexShare += newNeurodes;
  }
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
  if (lastStatsSnapshot.killCount === null) {
    lastStatsSnapshot.killCount = Player.numPeopleKilled;
  }
  if (lastStatsSnapshot.crimeMoney === null) {
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
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
  lastStatsSnapshot.killCount = null;
  lastStatsSnapshot.crimeMoney = null;
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
