import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { minCyclesToProcess } from "./constants";
import { isClassWork } from "../../Work/ClassWork";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";
import { Crimes } from "../../Crime/Crimes";
import { isCrimeWork } from "../../Work/CrimeWork";

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
  CyberdeckState.components.neurodes += Math.max(stats.otherMults.neurodeProduction, 0);
  CyberdeckState.components.rom += Math.max(stats.otherMults.romProduction, 0);

  // Violent crime gives neurodes
  if (Player.numPeopleKilled > lastStatsSnapshot.killCount) {
    const factor = getCurrentCrimeDuration() > 10000 ? 5000 : 6;
    const newNeurodes = (Player.numPeopleKilled - lastStatsSnapshot.killCount) * factor;
    CyberdeckState.components.neurodes += newNeurodes;
    CyberdeckState.componentStats.neurodes.kills += newNeurodes;
    lastStatsSnapshot.killCount = Player.numPeopleKilled;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Petty crime gives ROM
  else if (Player.moneySourceA.crime > lastStatsSnapshot.crimeMoney) {
    const crimeMagnitude = getCurrentCrimeDuration() / 5000;
    const newMoney = Player.moneySourceA.crime - lastStatsSnapshot.crimeMoney;
    const newROM = 0.1 + ((10 * newMoney + 1e7) / (newMoney + 1e7)) * crimeMagnitude;

    CyberdeckState.components.rom += newROM;
    CyberdeckState.componentStats.ROM.pettyCrime += newROM;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Making programs gives ROM
  if (isCreateProgramWork(Player.currentWork)) {
    CyberdeckState.components.rom += 3;
    CyberdeckState.componentStats.ROM.programs += 3;
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
    ROM: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
      netrunning: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
      netrunning: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
      cortexShare: 0,
      netrunning: 0,
    },
    cores: {
      netrunning: 0,
    },
  };
}

function getCurrentCrimeDuration() {
  if (!Player.currentWork || !isCrimeWork(Player.currentWork)) {
    return 30000;
  }
  const crimeType = Player.currentWork.crimeType;
  return Object.values(Crimes).find((c) => c.type === crimeType)?.time ?? 30000;
}
