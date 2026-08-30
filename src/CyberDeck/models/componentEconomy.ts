import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { minCyclesToProcess } from "./constants";
import { isClassWork } from "../../Work/ClassWork";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";

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
  CyberdeckState.components.chips += stats.otherMults.chipProduction;
  CyberdeckState.components.neurodes += stats.otherMults.neurodeProduction;
  CyberdeckState.components.ROM += stats.otherMults.romProduction;

  // Violent crime gives neurodes
  if (Player.numPeopleKilled > lastStatsSnapshot.killCount) {
    const newNeurodes = (Player.numPeopleKilled - lastStatsSnapshot.killCount) * 3;
    CyberdeckState.components.neurodes += newNeurodes;
    CyberdeckState.componentStats.neurodes.kills += newNeurodes;
    lastStatsSnapshot.killCount = Player.numPeopleKilled;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Petty crime gives ROM
  else if (Player.moneySourceA.crime > lastStatsSnapshot.crimeMoney) {
    const newMoney = Player.moneySourceA.crime - lastStatsSnapshot.crimeMoney;
    const newROM = 0.1 + (10 * newMoney + 1e7) / (newMoney + 1e7);
    CyberdeckState.components.ROM += newROM;
    CyberdeckState.componentStats.ROM.pettyCrime += newROM;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Making programs gives ROM
  if (isCreateProgramWork(Player.currentWork)) {
    CyberdeckState.components.ROM += 3;
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
    const newChips = 0.1 + (10 * newIncome + 1e6) / (newIncome + 1e6);
    CyberdeckState.components.chips += newChips;
    CyberdeckState.componentStats.chips.hacknet += newChips;
    lastStatsSnapshot.totalHacknetIncome = Player.moneySourceA.hacknet;
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
    ROM: 0,
    neurodes: 0,
    cores: 0,
    ICE: 2,
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
      netrunning: 0,
    },
    cores: {
      netrunning: 0,
    },
  };
}
