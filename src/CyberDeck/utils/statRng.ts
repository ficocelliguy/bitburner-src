import { CyberdeckState } from "../models/CyberdeckState";
import { Player } from "@player";
import { WHRNG } from "../../Casino/RNG";
import { Multipliers } from "@nsdefs";
import { ConsumableStats, EndgameMults, MiscMults } from "../Types";
import { getRecordKeys } from "../../Types/Record";
import { getModuleById } from "./moduleUtilities";

export function getNextNetrunningWHRNG() {
  CyberdeckState.netrunningSeedUsages++;
  return new WHRNG(getSeed(CyberdeckState.netrunningSeedUsages, "run"));
}

export function getNextNetrunningCorruptedWHRNG() {
  CyberdeckState.netrunningCorruptedSeedUsages++;
  return new WHRNG(getSeed(CyberdeckState.netrunningCorruptedSeedUsages, "corrupted"));
}

export function getNextCraftingPowerSupplyWHRNG() {
  CyberdeckState.craftingPowerSupplySeedUsages++;
  return new WHRNG(getSeed(CyberdeckState.craftingPowerSupplySeedUsages, "craftingPowerSupply"));
}

export function getNextCraftingProcessingModWHRNG() {
  CyberdeckState.craftingProcessingModSeedUsages++;
  return new WHRNG(getSeed(CyberdeckState.craftingProcessingModSeedUsages, "craftingProcessingMod"));
}

export function getNextCraftingUplinkWHRNG() {
  CyberdeckState.craftingUplinkSeedUsages++;
  return new WHRNG(getSeed(CyberdeckState.craftingUplinkSeedUsages, "craftingUplink"));
}

function getSeed(usages: number, type: string) {
  const ID = Player.identifier;
  const sourceFileCount = [...Player.sourceFiles].reduce((total, [__bn, lvl]) => (total += lvl), 0);
  return stringToSeed(`${ID}-${Player.bitNodeN}-${sourceFileCount}-${usages}-${type}`);
}

function stringToSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Bitwise operations to turn the string into a 32-bit signed integer
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash); // Returns a positive integer seed
}

export type StatRollBounds = { minRoll: number; maxRoll: number; softCap?: number; hardCap?: number, hardMin?: number };

export function getFullStatRollRanges() {
  const playerMults: Partial<{ [K in keyof Multipliers]: StatRollBounds }> = {
    hacking_chance: { minRoll: 0.0012, maxRoll: 0.16 },
    hacking_exp: { minRoll: 0.0008, maxRoll: 0.16 },
    hacking: { minRoll: 0.0005, maxRoll: 0.11 },
    strength: { minRoll: 0.0016, maxRoll: 0.19 },
    strength_exp: { minRoll: 0.0016, maxRoll: 0.19 },
    defense: { minRoll: 0.0016, maxRoll: 0.19 },
    defense_exp: { minRoll: 0.0016, maxRoll: 0.19 },
    dexterity: { minRoll: 0.0016, maxRoll: 0.19 },
    dexterity_exp: { minRoll: 0.0016, maxRoll: 0.19 },
    agility: { minRoll: 0.0016, maxRoll: 0.19 },
    agility_exp: { minRoll: 0.0016, maxRoll: 0.19 },
    charisma: { minRoll: 0.001, maxRoll: 0.15 },
    charisma_exp: { minRoll: 0.001, maxRoll: 0.15 },
    hacknet_node_money: { minRoll: 0.0012, maxRoll: 0.22 },
    hacknet_node_ram_cost: { minRoll: -0.0012, maxRoll: -0.16 },
    hacknet_node_level_cost: { minRoll: -0.0012, maxRoll: -0.16 },
    company_rep: { minRoll: 0.001, maxRoll: 0.21 },
    faction_rep: { minRoll: 0.0005, maxRoll: 0.11 },
    work_money: { minRoll: 0.001, maxRoll: 0.54 },
    crime_success: { minRoll: 0.002, maxRoll: 0.23 },
    crime_money: { minRoll: 0.002, maxRoll: 0.17 },
  };
  const otherMults: { [K in keyof MiscMults]: StatRollBounds } = {
    romProduction: { minRoll: 0.01, maxRoll: 4.1 },
    chipProduction: { minRoll: 0.01, maxRoll: 4.1 },
    neurodeProduction: { minRoll: 0.01, maxRoll: 4.1 },
    program_creation_speed: { minRoll: 0.002, maxRoll: 0.17 },
    crime_speed: { minRoll: 0.0015, maxRoll: 0.17, hardCap: 5 },
    stock_fees: { minRoll: -0.0015, maxRoll: -0.17, hardMin: -0.9 },
    cct_money: { minRoll: 0.003, maxRoll: 0.22 },
    IPvGO_power: { minRoll: 0.001, maxRoll: 0.12 },
    class_cost: { minRoll: -0.002, maxRoll: -0.32, hardMin: -1 },
  };
  const consumableStats: { [K in keyof ConsumableStats]: StatRollBounds } = {
    netrunning_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    crafting_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    netrun_cooldown_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    mod_storage: { minRoll: 0.02, maxRoll: 1.7 },
  };
  const endgameStats: { [K in keyof EndgameMults]: StatRollBounds } = {
    stamina_gain: { minRoll: 0.001, maxRoll: 0.16 },
    graft_speed: { minRoll: 0.0004, maxRoll: 0.13, hardCap: 5 },
    sleeve_sync: { minRoll: 0.0008, maxRoll: 0.13 },
    stanek_charge: { minRoll: 0.0008, maxRoll: 0.13 },
    equipment_cost: { minRoll: -0.0015, maxRoll: -0.17, hardMin: -0.9 },
    int_exp: { minRoll: 0.0012, maxRoll: 0.082 },
  };

  return {
    playerMults,
    otherMults,
    consumableStats,
    endgameStats,
    extraRackSlots: 0,
  } as const;
}

const EMPTY_BOUNDS: StatRollBounds = { minRoll: 0, maxRoll: 0 };

function getStatRoll(rng: WHRNG, valueRangeInfo: StatRollBounds, level: number, scalar: number) {
  const totalValueRange = valueRangeInfo.maxRoll - valueRangeInfo.minRoll;
  const scaledValueRange = totalValueRange / 12;
  const minRoll = scaledValueRange * level * 0.4;
  const maxRoll = scaledValueRange * level;

  // Roll three times and take the sum of the two lowest rolls, to create a range that makes higher values more rare
  const valueRoll1 = (maxRoll - minRoll) * scalar * rng.random() * 0.5;
  const valueRoll2 = (maxRoll - minRoll) * scalar * rng.random() * 0.5;
  const valueRoll3 = (maxRoll - minRoll) * scalar * rng.random() * 0.5;
  const weightedSum = valueRoll1 + valueRoll2 + valueRoll3 - Math.max(valueRoll1, valueRoll2, valueRoll3);

  return valueRangeInfo.minRoll + weightedSum;
}

export function getPlayerStatBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const fullStats = getFullStatRollRanges();

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng.random() * playerMultKeys.length)];
  const valueRangeInfo = fullStats.playerMults[statToAdd] ?? EMPTY_BOUNDS;

  return {
    [statToAdd]: getStatRoll(rng, valueRangeInfo, level, scalar),
  };
}

export function getDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  return getPlayerStatBuff(debuffLevel, rng, scalar * -1);
}

export function getConsumableBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<ConsumableStats> {
  const fullStats = getFullStatRollRanges();

  const consumableKeys = getRecordKeys(fullStats.consumableStats);
  const statToAdd = consumableKeys[Math.floor(rng.random() * consumableKeys.length)];
  const valueRange = fullStats.consumableStats[statToAdd];

  return {
    [statToAdd]: getStatRoll(rng, valueRange, level, scalar),
  };
}

export function getEndgameBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<EndgameMults> {
  const fullStats = getFullStatRollRanges();

  const endgameKeys = getRecordKeys(fullStats.endgameStats);
  const statToAdd = endgameKeys[Math.floor(rng.random() * endgameKeys.length)];
  const valueRange = fullStats.endgameStats[statToAdd];

  return {
    [statToAdd]: getStatRoll(rng, valueRange, level, scalar),
  };
}

export function getEndgameStatDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<EndgameMults> {
  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  return getEndgameBuff(debuffLevel, rng, scalar * -1);
}

export function getOtherStatBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const fullStats = getFullStatRollRanges();

  const otherMultKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherMultKeys[Math.floor(rng.random() * otherMultKeys.length)];
  const valueRange = fullStats.otherMults[statToAdd];

  return {
    [statToAdd]: getStatRoll(rng, valueRange, level, scalar),
  };
}

export function getOtherStatDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  return getOtherStatBuff(debuffLevel, rng, scalar * -1);
}

export function getLevel(rng: WHRNG, levelBoost = CyberdeckState.netrunningLevel) {
  const bonusAttempts = rng.random() < 0.08 ? 2 : 0;
  const levelUpAttempts = (levelBoost / (levelBoost + 1)) * 16 + 4 + bonusAttempts;
  const startingValue = 0.3 + (0.7 * levelBoost) / (levelBoost + 20);
  let level = 0;
  for (let i = 0; i < levelUpAttempts; i++) {
    if (rng.random() < startingValue - i / 20) {
      level++;
    }
  }
  return Math.min(level, 12);
}

export function getID(rng: WHRNG) {
  let ID = "";
  do {
    const base = baseOptions[Math.floor(rng.random() * baseOptions.length)];
    const idNumberString = Math.floor(rng.random() * base ** 5)
      .toString(base)
      .toUpperCase();
    ID = `${basePrefixes[base]}${idNumberString}`;
  } while (getModuleById(ID));
  return ID;
}

const baseOptions: number[] = [2, 8, 12, 16] as const;
const basePrefixes: Record<(typeof baseOptions)[number], string> = {
  2: "0b",
  8: "0o",
  12: "0z",
  16: "0x",
} as const;
