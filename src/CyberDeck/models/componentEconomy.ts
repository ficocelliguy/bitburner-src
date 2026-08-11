import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";
import { createModule } from "./createModule";
import { minCyclesToProcess, netrunningInitialTraceDecayWindowMs, netrunningTraceDecayMs } from "./constants";
import { saveGame } from "../../SaveObject";
import { isClassWork } from "../../Work/ClassWork";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";
import { NetrunningRewards } from "../Types";
import { getNextNetrunningWHRNG } from "../utils/statRng";

import { getCyberdeckStatBonuses } from "../effects";

const lastStatsSnapshot = {
  killCount: null as number | null,
  crimeMoney: null as number | null,

  totalWorkRep: null as number | null,
  totalHacknetIncome: null as number | null,
}

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
  // TODO-fico: ccts should give neurodes
  if (Player.numPeopleKilled > lastStatsSnapshot.killCount) {
    const newNeurodes = (Player.numPeopleKilled - lastStatsSnapshot.killCount) * 3;
    CyberdeckState.components.neurodes += newNeurodes;
    CyberdeckState.componentStats.neurodes.kills += newNeurodes;
    lastStatsSnapshot.killCount = Player.numPeopleKilled;
    lastStatsSnapshot.crimeMoney = Player.moneySourceA.crime;
  }
  // Petty crime gives ROM
  // TODO-fico: nuke/backdoor, caches should also give ROM
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
    // TODO-fico: IPvGO should also give chips
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

export function getCurrentNetrunningIceCost(): number {
  const timeSinceLastRun = Date.now() - CyberdeckState.lastNetrunningTimestamp;

  const diminishingCosts = 1 + netrunningTraceDecayMs / (timeSinceLastRun);
  const recencyMultiplier = Math.max((netrunningInitialTraceDecayWindowMs - timeSinceLastRun) / 200, 1);
  const netrunningCooldownBoost = ((CyberdeckState.netrunningCooldownLevel) / (CyberdeckState.netrunningCooldownLevel + 5)) * 0.4;
  return Math.floor(diminishingCosts * recencyMultiplier * netrunningCooldownBoost) || 1;
}

export function getNetrunningTraceFraction(): number {
  const timeSinceLastRun = Date.now() - CyberdeckState.lastNetrunningTimestamp;
  return ((netrunningTraceDecayMs - timeSinceLastRun) / netrunningTraceDecayMs) ** 2;
}

export function canNetrun() {
  return CyberdeckState.components.ICE >= getCurrentNetrunningIceCost() && CyberdeckState.modStorageSize > CyberdeckState.storedModules.length;
}

export async function netRun(): Promise<NetrunningRewards> {
  if (!canNetrun()) {
    return { success: false, modules: [], components: {} };
  }
  CyberdeckState.components.ICE -= getCurrentNetrunningIceCost();
  const rng = getNextNetrunningWHRNG();
  const rewards = [createModule(rng), createModule(rng), createModule(rng)].sort((m1, m2) => m1.level - m2.level);
  if (!rewards.some(m => m.level >= 3)) {
    rewards[2] = createModule(rng, undefined, 3);
  }
  CyberdeckState.storedModules.unshift(...rewards);
  CyberdeckState.lastNetrunningTimestamp = Date.now();

  const chipsGained = Math.floor(rng.random() * (CyberdeckState.netrunningLevel * 2 + 2));
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.netrunning += chipsGained;
  const neurodesGained = Math.floor(rng.random() * (CyberdeckState.netrunningLevel * 2 + 2));
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.netrunning += neurodesGained;
  const ROMGained = Math.floor(rng.random() * (CyberdeckState.netrunningLevel * 2 + 2));
  CyberdeckState.components.ROM += ROMGained;
  CyberdeckState.componentStats.ROM.netrunning += ROMGained;
  const coresGained = Math.floor(rng.random() * (CyberdeckState.netrunningLevel * 0.3 + 1.5));
  CyberdeckState.components.cores += coresGained;
  CyberdeckState.componentStats.cores.netrunning += coresGained;
  await saveGame();
  return {
    success: true,
    modules: rewards,
    components: {
      chips: chipsGained,
      neurodes: neurodesGained,
      ROM: ROMGained,
      cores: coresGained,
    },
  };
}