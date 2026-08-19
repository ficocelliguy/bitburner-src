import { CyberdeckState } from "./CyberdeckState";
import {
  corruptedNetrunningHardCooldownMs,
  netrunningInitialTraceDecayWindowMs,
  netrunningTraceDecayMs,
} from "./constants";
import { NetrunningRewards } from "../Types";
import { getNextNetrunningCorruptedWHRNG, getNextNetrunningWHRNG } from "../utils/statRng";
import { createModule } from "./createModule";
import { saveGame } from "../../SaveObject";
import { createCorruptedModule } from "./createCorruptedModule";

export function getCurrentNetrunningIceCost(corrupted = false): number {
  if (corrupted) {
    return getCorruptedNetrunningIceCost();
  }
  const timeSinceLastRun = Date.now() - CyberdeckState.lastNetrunningTimestamp;
  return Math.floor(getNetrunningCostBasedOnTimeSinceLastRun(timeSinceLastRun));
}

function getCorruptedNetrunningIceCost(): number {
  const timeSinceLastRun =
    Date.now() - CyberdeckState.lastCorruptedNetrunningTimestamp - corruptedNetrunningHardCooldownMs;
  if (timeSinceLastRun <= 0) {
    return Infinity;
  }
  return Math.floor(getNetrunningCostBasedOnTimeSinceLastRun(timeSinceLastRun, true) * 4);
}

function getNetrunningCostBasedOnTimeSinceLastRun(timeSinceLastRun: number, corrupted = false): number {
  const traceDecay = netrunningTraceDecayMs * (corrupted ? 2 : 1);
  const diminishingCosts = 1 + traceDecay / timeSinceLastRun;
  const recencyMultiplier = Math.max((netrunningInitialTraceDecayWindowMs - timeSinceLastRun) / 200, 1);
  const netrunningCooldownBoost = 1 - ((CyberdeckState.netrunningCooldownLevel) / (CyberdeckState.netrunningCooldownLevel + 5)) * 0.4;
  return Math.max(diminishingCosts * recencyMultiplier * netrunningCooldownBoost, 1);
}

export function getNetrunningTraceFraction(corrupted = false): number {
  const lastTimestamp = corrupted ? CyberdeckState.lastCorruptedNetrunningTimestamp : CyberdeckState.lastNetrunningTimestamp;
  const corruptionHardCooldown = corrupted ? corruptedNetrunningHardCooldownMs : 0;
  const timeSinceLastRun = Date.now() - lastTimestamp - corruptionHardCooldown;
  return (
    ((netrunningTraceDecayMs - timeSinceLastRun) / (netrunningTraceDecayMs)) ** 2
  );
}

export function canNetrun(corrupted = false): boolean {
  return (
    CyberdeckState.components.ICE >= getCurrentNetrunningIceCost(corrupted) &&
    CyberdeckState.modStorageSize >= CyberdeckState.storedModules.length
  );
}

export async function netRun(corrupted = false): Promise<NetrunningRewards> {
  if (!canNetrun(corrupted)) {
    return { success: false, modules: [], components: {} };
  }
  if (corrupted) {
    return corruptedNetrun();
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

async function corruptedNetrun(): Promise<NetrunningRewards> {
  if (!canNetrun(true)) {
    return { success: false, modules: [], components: {} };
  }
  CyberdeckState.components.ICE -= getCurrentNetrunningIceCost(true);
  const rng = getNextNetrunningCorruptedWHRNG();

  const normalizeLevel = (level: number): number => level === -1 ? 99 : level;

  const rewards = [createCorruptedModule(rng), createCorruptedModule(rng), createCorruptedModule(rng)]
    .sort((m1, m2) => normalizeLevel(m1.level) - normalizeLevel(m2.level));

  CyberdeckState.storedModules.unshift(...rewards);
  CyberdeckState.lastCorruptedNetrunningTimestamp = Date.now();

  const coresGained = Math.floor(rng.random() * (CyberdeckState.netrunningLevel * 0.3 + 2.5));
  CyberdeckState.components.cores += coresGained;
  CyberdeckState.componentStats.cores.netrunning += coresGained;
  await saveGame();

  return {
    success: true,
    modules: rewards,
    components: {
      cores: coresGained,
    },
  };
}