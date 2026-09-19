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

export type StatRollBounds = { minRoll: number; maxRoll: number; softCap?: number; hardCap?: number };

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
    crime_speed: { minRoll: 0.0015, maxRoll: 0.17 },
    stock_fees: { minRoll: -0.0015, maxRoll: -0.17 },
    cct_money: { minRoll: 0.003, maxRoll: 0.22 },
    IPvGO_power: { minRoll: 0.001, maxRoll: 0.12 },
    class_cost: { minRoll: -0.002, maxRoll: -0.32 },
  };
  const consumableStats: { [K in keyof ConsumableStats]: StatRollBounds } = {
    netrunning_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    crafting_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    netrun_cooldown_lvl: { minRoll: 0.01, maxRoll: 2.1 },
    mod_storage: { minRoll: 0.02, maxRoll: 1.7 },
  };
  const endgameStats: { [K in keyof EndgameMults]: StatRollBounds } = {
    stamina_gain: { minRoll: 0.001, maxRoll: 0.16 },
    graft_speed: { minRoll: 0.0004, maxRoll: 0.13 },
    sleeve_sync: { minRoll: 0.0008, maxRoll: 0.13 },
    stanek_charge: { minRoll: 0.0008, maxRoll: 0.13 },
    equipment_cost: { minRoll: -0.0015, maxRoll: -0.17 },
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

export function getPlayerStatBuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const rng3 = rng.random();
  const rng4 = rng.random();

  const fullStats = getFullStatRollRanges();

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange = fullStats.playerMults[statToAdd] ?? EMPTY_BOUNDS;
  // Roll three times and take the sum of the two lowest rolls, to create a range that makes higher values more rare
  const valueRoll1 = (valueRange.maxRoll - valueRange.minRoll) * scalar * rng2 * 0.5;
  const valueRoll2 = (valueRange.maxRoll - valueRange.minRoll) * scalar * rng3 * 0.5;
  const valueRoll3 = (valueRange.maxRoll - valueRange.minRoll) * scalar * rng4 * 0.5;
  const weightedSum = valueRoll1 + valueRoll2 + valueRoll3 - Math.max(valueRoll1, valueRoll2, valueRoll3);

  const value = valueRange.minRoll + weightedSum;

  return {
    [statToAdd]: value,
  };
}

export function getDebuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const fullStats = getFullStatRollRanges();

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange = fullStats.playerMults[statToAdd] ?? EMPTY_BOUNDS;
  const value = ((valueRange.maxRoll - valueRange.minRoll) * scalar * rng2 + valueRange.minRoll) * -1;

  return {
    [statToAdd]: value,
  };
}

export function getConsumableBuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<ConsumableStats> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const fullStats = getFullStatRollRanges();

  const consumableKeys = getRecordKeys(fullStats.consumableStats);
  const statToAdd = consumableKeys[Math.floor(rng1 * consumableKeys.length)];
  const valueRange = fullStats.consumableStats[statToAdd];
  const value = (valueRange.maxRoll - valueRange.minRoll) * rng2 * scalar + valueRange.minRoll;

  return {
    [statToAdd]: value,
  };
}

export function getEndgameBuff(_level: number, rng: WHRNG): Partial<EndgameMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const fullStats = getFullStatRollRanges();

  const endgameKeys = getRecordKeys(fullStats.endgameStats);
  const statToAdd = endgameKeys[Math.floor(rng1 * endgameKeys.length)];
  const valueRange = fullStats.endgameStats[statToAdd];
  const value = (valueRange.maxRoll - valueRange.minRoll) * rng2 + valueRange.minRoll;

  return {
    [statToAdd]: value,
  };
}

export function getOtherStatBuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const fullStats = getFullStatRollRanges();

  const otherMultKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherMultKeys[Math.floor(rng1 * otherMultKeys.length)];
  const valueRange = fullStats.otherMults[statToAdd];
  const value = (valueRange.maxRoll - valueRange.minRoll) * rng2 * scalar + valueRange.minRoll;

  return {
    [statToAdd]: value,
  };
}

export function getOtherStatDebuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const fullStats = getFullStatRollRanges();

  const otherMultKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherMultKeys[Math.floor(rng1 * otherMultKeys.length)];
  const valueRange = fullStats.otherMults[statToAdd];
  const value = ((valueRange.maxRoll - valueRange.minRoll) * scalar * rng2 + valueRange.minRoll) * -1;

  return {
    [statToAdd]: value,
  };
}

export function getEndgameStatDebuff(_level: number, rng: WHRNG, scalar: number = 1): Partial<EndgameMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const fullStats = getFullStatRollRanges();

  const endgameKeys = getRecordKeys(fullStats.endgameStats);
  const statToAdd = endgameKeys[Math.floor(rng1 * endgameKeys.length)];
  const valueRange = fullStats.endgameStats[statToAdd];
  const value = ((valueRange.maxRoll - valueRange.minRoll) * scalar * rng2 + valueRange.minRoll) * -1;

  return {
    [statToAdd]: value,
  };
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
