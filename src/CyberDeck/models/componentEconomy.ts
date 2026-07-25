import { CyberDeckState } from "./CyberDeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { getCyberdeckStatBonuses } from "./StatBonuses";
import { createModule } from "./createModule";
import { minCyclesToProcess, netrunningCooldownMs } from "./constants";

const lastStatsSnapshot = {
  killCount: null as number | null,
  crimeMoney: null as number | null,

  totalWorkRep: null as number | null,
  totalHacknetIncome: null as number | null,
}

export function gainCyberdeckComponents(cycles: number) {
  CyberDeckState.storedCycles += cycles;
  initStats();

  if (
    CyberDeckState.storedCycles < minCyclesToProcess ||
    lastStatsSnapshot.killCount === null ||
    lastStatsSnapshot.totalWorkRep === null ||
    lastStatsSnapshot.crimeMoney === null ||
    lastStatsSnapshot.totalHacknetIncome === null
  ) {
    return;
  }
  CyberDeckState.storedCycles -= minCyclesToProcess;

  const stats = getCyberdeckStatBonuses();
  CyberDeckState.components.chips += stats.otherMults.chipProduction;
  CyberDeckState.components.neurodes += stats.otherMults.neurodeProduction;
  CyberDeckState.components.ROM += stats.otherMults.romProduction;


  // Violent crime gives neurodes
  // TODO-fico: classes and ccts should give neurodes
  if (Player.numPeopleKilled > lastStatsSnapshot.killCount) {
    const newNeurodes = (Player.numPeopleKilled - lastStatsSnapshot.killCount);
    CyberDeckState.components.neurodes += newNeurodes;
    CyberDeckState.componentStats.neurodes.kills += newNeurodes;
    lastStatsSnapshot.killCount = Player.numPeopleKilled;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Petty crime gives ROM
  // TODO-fico: nuke/backdoor, caches, programs should also give ROM
  else if (Player.moneySourceA.crime > lastStatsSnapshot.crimeMoney) {
    const newMoney = Player.moneySourceA.crime - lastStatsSnapshot.crimeMoney;
    const newROM = 0.1 + (10 * newMoney + 1e7) / (newMoney + 1e7);
    CyberDeckState.components.ROM += newROM;
    CyberDeckState.componentStats.ROM.pettyCrime += newROM;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }

  // Working gives chips
  // TODO-fico: IPvGO should also give chips
  if (getAllWorkRep() > lastStatsSnapshot.totalWorkRep) {
    const newRep = getAllWorkRep() - lastStatsSnapshot.totalWorkRep;
    const newChips = 0.1 + (10 * newRep + 1000) / (newRep + 1000);
    CyberDeckState.components.chips += newChips;
    CyberDeckState.componentStats.chips.companyWork += newChips;
    lastStatsSnapshot.totalWorkRep = getAllWorkRep();
  }

  // hacknet gives chips
  if (Player.moneySourceA.hacknet > lastStatsSnapshot.totalHacknetIncome) {
    const newIncome = Player.moneySourceA.hacknet - lastStatsSnapshot.totalHacknetIncome;
    const newChips = 0.1 + (10 * newIncome + 1e6) / (newIncome + 1e6);
    CyberDeckState.components.chips += newChips;
    CyberDeckState.componentStats.chips.hacknet += newChips;
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

export function getNetrunningCooldown(): number {
  const timeSinceLastRun = Date.now() - (CyberDeckState.lastNetrunningTimestamp ?? 1);
  return Math.max(netrunningCooldownMs - timeSinceLastRun, 0);
}

export function getCurrentNetrunningIceCost(): number {
  const timeSinceLastRun = Date.now() - (CyberDeckState.lastNetrunningTimestamp ?? 1);
  if (timeSinceLastRun < netrunningCooldownMs) {
    return Infinity;
  }

  const diminishingCosts = 1 + 5e5 / (timeSinceLastRun - netrunningCooldownMs);
  return Math.floor(diminishingCosts) || 1;
}

export function netRun() {
  if (CyberDeckState.components.ICE < getCurrentNetrunningIceCost()) {
    return;
  }
  const rewards = [createModule(), createModule(), createModule()].sort((m1, m2) => m1.level - m2.level);
  CyberDeckState.storedModules.unshift(...rewards);
  CyberDeckState.lastNetrunningTimestamp = Date.now();
  CyberDeckState.components.ICE -= getCurrentNetrunningIceCost();
  return rewards;
}