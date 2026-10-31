import { CyberdeckState, hasCompleted } from "./CyberdeckState";
import {
  corruptedNetrunningHardCooldownMs,
  netrunningInitialTraceDecayWindowMs,
  netrunningTraceDecayMs,
} from "./constants";
import { NetrunningRewards } from "../Types";
import { Brand, Challenges, ModType } from "../Enums";
import { getLevel, getNextNetrunningCorruptedWHRNG, getNextNetrunningWHRNG } from "../utils/statRng";
import { createModule, createSpecialFirstTimeMod, getBrandedModMaker, moduleStorageAvailable } from "./createModule";
import { createCorruptedModule, getCorruptedSkillChip, getEndgameStatModule } from "./createCorruptedModule";
import { Player } from "@player";
import { completeNetrunChallenges } from "./challenges";
import { NetrunningState } from "./NetrunningState";
import { WHRNG } from "../../Casino/RNG";

export function getCurrentNetrunningIceCost(corrupted = false): number {
  const timeSinceLastRun =
    Date.now() - (corrupted ? CyberdeckState.lastCorruptedNetrunningTimestamp : CyberdeckState.lastNetrunningTimestamp);
  const traceDecay = netrunningTraceDecayMs * (corrupted ? 2 : 1);
  const diminishingCosts = 0.95 + traceDecay / timeSinceLastRun;
  const recencyWindow = corrupted ? corruptedNetrunningHardCooldownMs : netrunningInitialTraceDecayWindowMs;
  const recencyMultiplier = Math.max(Math.max((recencyWindow - timeSinceLastRun) / 200, 0) * (corrupted ? 1000 : 1), 1);
  const netrunningCooldownBoost =
    1 - (CyberdeckState.netrunningCooldownLevel / (CyberdeckState.netrunningCooldownLevel + 5)) * 0.4;
  const cost =
    Math.max(diminishingCosts * recencyMultiplier * netrunningCooldownBoost, 1) * minimumNetrunCost(corrupted);
  return Math.floor(cost);
}

export function getNetrunningTraceFraction(corrupted = false): number {
  return getCurrentNetrunningIceCost(corrupted) / minimumNetrunCost(corrupted) - 1;
}

export function minimumNetrunCost(corrupted: boolean) {
  return corrupted ? 40 : 10;
}

export function canNetrun(corrupted = false): boolean {
  return CyberdeckState.components.iceBreakers >= getCurrentNetrunningIceCost(corrupted) && moduleStorageAvailable();
}

export function netrunRewards(): NetrunningRewards {
  const corrupted = NetrunningState.corrupted;
  NetrunningState.isNetrunning = false;
  CyberdeckState.components.iceBreakers -= getCurrentNetrunningIceCost(corrupted);
  completeNetrunChallenges();

  if (corrupted) {
    return corruptedNetrun();
  }

  const rng = getNextNetrunningWHRNG();

  const scoreFactor = NetrunningState.rewardScore / 25;

  const rewards = getNetrunningRewards(rng, NetrunningState.rewardScore);
  CyberdeckState.lastNetrunningTimestamp = Date.now();
  NetrunningState.target = Brand.Unknown;

  const chipsGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.netrunning += chipsGained;
  const neurodesGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.netrunning += neurodesGained;
  const ROMGained = Math.floor(rng.random() * (scoreFactor * 2 + 2));
  CyberdeckState.components.rom += ROMGained;
  CyberdeckState.componentStats.rom.netrunning += ROMGained;

  const bonusCores = hasCompleted(Challenges.Homebrew) ? 1.5 : 0.5;
  const coresGained = Math.floor(rng.random() * (scoreFactor + bonusCores));
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
  const rewards = getBrandedNetrunningRewards(rng, score);
  const sortedRewards = rewards.sort((m1, m2) => m1.rarity - m2.rarity);
  CyberdeckState.storedModules.unshift(...sortedRewards);
  return sortedRewards;
}

export function getBrandedNetrunningRewards(rng: WHRNG, score: number, brand = NetrunningState.target) {
  const modMaker = getBrandedModMaker(brand);
  if (!modMaker) {
    return getGenericNetrunningRewards(rng, score);
  }
  const firstModBoost = score > 100 ? 4 : score > 70 ? 2 : 0;
  const rewards = [modMaker(rng, firstModBoost, 1.2)];
  const boost = isEligibleForSpecialReward(score);
  rewards.push(
    boost ? createSpecialFirstTimeMod(rng) : score > 70 ? modMaker(rng, score > 100 ? 4 : 2) : createModule(rng),
  );
  rewards.push(createModule(rng));
  if (score > 120) {
    rewards.push(createModule(rng));
  }
  return rewards;
}

export function getGenericNetrunningRewards(rng: WHRNG, score: number) {
  const specialReward = isEligibleForSpecialReward(score)
    ? createModule(rng, ModType.ProcessingMod, 5)
    : createModule(rng);
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
  return rewards;
}

function isEligibleForSpecialReward(score: number) {
  const isEarlyRun = CyberdeckState.netrunningSeedUsages <= 3;
  const hasRareMod = [...CyberdeckState.storedModules, ...CyberdeckState.installedModules].some((m) => m.rarity >= 5);
  return score > 70 && isEarlyRun && !hasRareMod;
}

function corruptedNetrun(): NetrunningRewards {
  const rng = getNextNetrunningCorruptedWHRNG();

  const rewards = getCorruptedNetrunningRewards(rng, NetrunningState.rewardScore);
  CyberdeckState.lastCorruptedNetrunningTimestamp = Date.now();

  const coresGained = Math.floor(rng.random() * (NetrunningState.rewardScore / 25 + 2));
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
  if (score > 55) {
    const boost = score > 80 ? 2 : 0;
    rewards.push(createCorruptedModule(rng, boost));
  }
  if (score > 120) {
    rewards.push(createCorruptedModule(rng));
  }

  const sortedRewards = rewards.sort((m1, m2) => m1.rarity - m2.rarity);

  CyberdeckState.storedModules.unshift(...sortedRewards);
  return sortedRewards;
}
