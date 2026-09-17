import { CyberdeckState } from "./CyberdeckState";
import {
  corruptedNetrunningHardCooldownMs,
  netrunningInitialTraceDecayWindowMs,
  netrunningTraceDecayMs,
} from "./constants";
import { NetrunningRewards } from "../Types";
import { ModType } from "../Enums";
import { getLevel, getNextNetrunningCorruptedWHRNG, getNextNetrunningWHRNG } from "../utils/statRng";
import { createModule } from "./createModule";
import { createCorruptedModule, getCorruptedSkillChip, getEndgameStatModule } from "./createCorruptedModule";
import { Player } from "@player";
import { completeNetrunTutorial } from "./tutorial";
import { NetrunningState } from "./NetrunningState";
import { WHRNG } from "../../Casino/RNG";

export function getCurrentNetrunningIceCost(corrupted = false): number {
  if (corrupted) {
    return getCorruptedNetrunningIceCost();
  }
  const timeSinceLastRun = Date.now() - CyberdeckState.lastNetrunningTimestamp;
  return Math.floor(getNetrunningCost(timeSinceLastRun));
}

function getCorruptedNetrunningIceCost(): number {
  const timeSinceLastRun =
    Date.now() - CyberdeckState.lastCorruptedNetrunningTimestamp - corruptedNetrunningHardCooldownMs;
  if (timeSinceLastRun <= 0) {
    return Infinity;
  }
  return Math.floor(getNetrunningCost(timeSinceLastRun, true) * 4);
}

function getNetrunningCost(timeSinceLastRun: number, corrupted = false): number {
  const traceDecay = netrunningTraceDecayMs * (corrupted ? 2 : 1);
  const diminishingCosts = 0.95 + traceDecay / timeSinceLastRun;
  const recencyMultiplier = Math.max((netrunningInitialTraceDecayWindowMs - timeSinceLastRun) / 200, 1);
  const netrunningCooldownBoost =
    1 - (CyberdeckState.netrunningCooldownLevel / (CyberdeckState.netrunningCooldownLevel + 5)) * 0.4;
  return Math.max(diminishingCosts * recencyMultiplier * netrunningCooldownBoost, 1) * 10;
}

export function getNetrunningTraceFraction(corrupted = false): number {
  if (corrupted) {
    const timeSinceLastRun = Date.now() - CyberdeckState.lastCorruptedNetrunningTimestamp;
    if (timeSinceLastRun <= corruptedNetrunningHardCooldownMs) {
      const timeFactor = (corruptedNetrunningHardCooldownMs - timeSinceLastRun) / 100;
      return getNetrunningCost(timeFactor, true) / 10 - 1;
    }
    const timeFactor = Date.now() - CyberdeckState.lastCorruptedNetrunningTimestamp
    return getNetrunningCost(timeFactor, true) / 10 - 1;
  }
  return getNetrunningCost(Date.now() - CyberdeckState.lastNetrunningTimestamp, corrupted) / 10 - 1;
}

export function canNetrun(corrupted = false): boolean {
  return (
    CyberdeckState.components.iceBreakers >= getCurrentNetrunningIceCost(corrupted) &&
    CyberdeckState.modStorageSize >= CyberdeckState.storedModules.length
  );
}

export function netrunRewards(corrupted: boolean): NetrunningRewards {
  NetrunningState.isNetrunning = false;
  CyberdeckState.components.iceBreakers -= getCurrentNetrunningIceCost(corrupted);
  completeNetrunTutorial();

  if (corrupted) {
    return corruptedNetrun();
  }

  const rng = getNextNetrunningWHRNG();

  const scoreFactor = NetrunningState.rewardScore / 25;

  const rewards = getNetrunningRewards(rng, NetrunningState.rewardScore);
  CyberdeckState.lastNetrunningTimestamp = Date.now();

  const chipsGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.netrunning += chipsGained;
  const neurodesGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.netrunning += neurodesGained;
  const ROMGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.rom += ROMGained;
  CyberdeckState.componentStats.ROM.netrunning += ROMGained;
  const coresGained = Math.floor(rng.random() * (scoreFactor + 1.5));
  CyberdeckState.components.cores += coresGained;
  CyberdeckState.componentStats.cores.netrunning += coresGained;

  return {
    mods: rewards,
    components: {
      chips: chipsGained,
      neurodes: neurodesGained,
      rom: ROMGained,
      cores: coresGained,
    },
  };
}

export function getNetrunningRewards(rng: WHRNG, score: number) {
  const isEarlyRun = CyberdeckState.netrunningSeedUsages <= 2;
  const hasRareMod = [...CyberdeckState.storedModules, ...CyberdeckState.installedModules].some(m => m.rarity >= 5);
  const eligibleForSpecialReward = score > 70 && isEarlyRun && !hasRareMod;
  const specialReward = eligibleForSpecialReward ? createModule(rng, ModType.ProcessingMod, 5) : createModule(rng);
  const rewards = [specialReward];

  if (score > 30) {
    rewards.push(createModule(rng));
  }
  if (score > 75) {
    rewards.push(createModule(rng, undefined, getLevel(rng, CyberdeckState.netrunningLevel + 1)));
  }
  if (score > 120) {
    rewards.push(createModule(rng, undefined, getLevel(rng, CyberdeckState.netrunningLevel + 2)));
  }

  const sortedRewards = rewards.sort((m1, m2) => m1.rarity - m2.rarity)
  CyberdeckState.storedModules.unshift(...sortedRewards);
  return sortedRewards;
}

function corruptedNetrun(): NetrunningRewards {
  const rng = getNextNetrunningCorruptedWHRNG();

  const rewards = getCorruptedNetrunningRewards(rng, NetrunningState.rewardScore);
  CyberdeckState.lastCorruptedNetrunningTimestamp = Date.now();

  const coresGained = Math.floor(rng.random() * (NetrunningState.rewardScore/25 + 2));
  CyberdeckState.components.cores += coresGained;
  CyberdeckState.componentStats.cores.netrunning += coresGained;

  return {
    mods: rewards,
    components: {
      cores: coresGained,
    },
  };
}

export function getCorruptedNetrunningRewards(rng: WHRNG, score: number) {
  const isFirstRun = CyberdeckState.netrunningCorruptedSeedUsages <= 1;

  const hasEndgame = !!Player.sourceFiles.get(1);
  const specialReward = isFirstRun
    ? hasEndgame
      ? getEndgameStatModule(rng)
      : getCorruptedSkillChip(rng)
    : createCorruptedModule(rng);
  const rewards = [specialReward];

  if (score > 30) {
    rewards.push(createCorruptedModule(rng));
  }
  if (score > 75) {
    rewards.push(createCorruptedModule(rng));
  }
  if (score > 120) {
    rewards.push(createCorruptedModule(rng));
  }

  const sortedRewards = rewards.sort((m1, m2) => m1.rarity - m2.rarity);

  CyberdeckState.storedModules.unshift(...sortedRewards);
  return sortedRewards;
}
