import { CyberdeckState } from "../models/CyberdeckState";
import { Player } from "@player";
import { WHRNG } from "../../Casino/RNG";
import { Multipliers } from "@nsdefs";
import { ConsumableStats, EndgameMults, MiscMults } from "../Types";
import { getRecordKeys } from "../../Types/Record";
import { getStatRollRange } from "./modStatsUtils";
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

export function getAllStatRanges(level: number) {
  const playerMults: Partial<{ [K in keyof Multipliers]: [number, number] }> = {
    hacking_chance: getStatRollRange(level, 1.2, 1.5, 1.5),
    hacking_exp: getStatRollRange(level, 0.8, 1.2, 1.5),
    hacking: getStatRollRange(level, 0.5, 0.8, 1),
    strength: getStatRollRange(level, 1.6, 1.6, 1.8),
    strength_exp: getStatRollRange(level, 1.6, 1.6, 1.8),
    defense: getStatRollRange(level, 1.6, 1.6, 1.8),
    defense_exp: getStatRollRange(level, 1.6, 1.6, 1.8),
    dexterity: getStatRollRange(level, 1.6, 1.6, 1.8),
    dexterity_exp: getStatRollRange(level, 1.6, 1.6, 1.8),
    agility: getStatRollRange(level, 1.6, 1.6, 1.8),
    agility_exp: getStatRollRange(level, 1.6, 1.6, 1.8),
    charisma: getStatRollRange(level, 1, 1, 1.5),
    charisma_exp: getStatRollRange(level, 1, 1, 1.5),
    hacknet_node_money: getStatRollRange(level, 1.2, 4, 2),
    hacknet_node_ram_cost: getStatRollRange(level, -1.2, -2, -1.5),
    hacknet_node_level_cost: getStatRollRange(level, -1.2, -2, -1.5),
    company_rep: getStatRollRange(level, 1, 1.5, 2),
    faction_rep: getStatRollRange(level, 0.5, 0.8, 1),
    work_money: getStatRollRange(level, 1, 10, 5),
    crime_success: getStatRollRange(level, 2, 5, 2),
    crime_money: getStatRollRange(level, 2, 3, 1.5),
  };
  const otherMults: { [K in keyof MiscMults]: [number, number] } = {
    romProduction: getStatRollRange(level, 10, 30, 40),
    chipProduction: getStatRollRange(level, 10, 30, 40),
    neurodeProduction: getStatRollRange(level, 10, 30, 40),
    program_creation_speed: getStatRollRange(level, 2, 3, 1.5),
    crime_speed: getStatRollRange(level, 1.5, 3, 1.5),
    stock_fees: getStatRollRange(level, -1.5, -3, -1.5), // getBuyTransactionCost
    cct_money: getStatRollRange(level, 3, 4, 2),
    IPvGO_power: getStatRollRange(level, 1, 3, 1),
    class_cost: getStatRollRange(level, -2, -4, -3),
  };
  const consumableStats: { [K in keyof ConsumableStats]: [number, number] } = {
    netrunning_lvl: getStatRollRange(level, 10, 30, 20),
    crafting_lvl: getStatRollRange(level, 10, 30, 20),
    netrun_cooldown_lvl: getStatRollRange(level, 10, 30, 20),
    mod_storage: getStatRollRange(level, 20, 40, 15),
  };
  const endgameStats: { [K in keyof EndgameMults]: [number, number] } = {
    stamina_gain: getStatRollRange(level, 1, 1.5, 1.5),
    graft_speed: getStatRollRange(level, 0.4, 1.2, 1.2),
    sleeve_sync: getStatRollRange(level, 0.8, 1.5, 1.2),
    stanek_charge: getStatRollRange(level, 0.8, 1.5, 1.2),
    equipment_cost: getStatRollRange(level, -1.5, -4, -1.5),
    int_exp: getStatRollRange(level, 1.2, 0.8, 0.8),
  };

  return {
    playerMults,
    otherMults,
    consumableStats,
    endgameStats,
    extraRackSlots: 0,
  } as const;
}

export function getPlayerStatBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const rng3 = rng.random();
  const rng4 = rng.random();

  const fullStats = getAllStatRanges(Math.max(level, 1));

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange: [number, number] = fullStats.playerMults[statToAdd] ?? [0, 0];
  // Roll three times and take the sum of the two lowest rolls, to create a range that makes higher values more rare
  const valueRoll1 = (valueRange[1] - valueRange[0]) * scalar * rng2 * 0.5;
  const valueRoll2 = (valueRange[1] - valueRange[0]) * scalar * rng3 * 0.5;
  const valueRoll3 = (valueRange[1] - valueRange[0]) * scalar * rng4 * 0.5;
  const weightedSum = valueRoll1 + valueRoll2 + valueRoll3 - Math.max(valueRoll1, valueRoll2, valueRoll3);

  const value = valueRange[0] + weightedSum;

  return {
    [statToAdd]: value,
  };
}

export function getDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  const fullStats = getAllStatRanges(debuffLevel);

  const playerMultKeys = getRecordKeys(fullStats.playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng1 * playerMultKeys.length)];
  const valueRange: [number, number] = fullStats.playerMults[statToAdd] ?? [0, 0];
  const value = ((valueRange[1] - valueRange[0]) * scalar * rng2 + valueRange[0]) * -1;

  return {
    [statToAdd]: value,
  };
}

export function getConsumableBuff(level: number, rng: WHRNG, scalar: number = 1): Partial<ConsumableStats> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const fullStats = getAllStatRanges(level);

  const consumableKeys = getRecordKeys(fullStats.consumableStats);
  const statToAdd = consumableKeys[Math.floor(rng1 * consumableKeys.length)];
  const valueRange: [number, number] = fullStats.consumableStats[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng2 * scalar + valueRange[0];

  return {
    [statToAdd]: value,
  };
}

export function getEndgameBuff(level: number, rng: WHRNG): Partial<EndgameMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();
  const fullStats = getAllStatRanges(level);

  const endgameKeys = getRecordKeys(fullStats.endgameStats);
  const statToAdd = endgameKeys[Math.floor(rng1 * endgameKeys.length)];
  const valueRange: [number, number] = fullStats.endgameStats[statToAdd];
  const value = (valueRange[1] - valueRange[0]) * rng2 + valueRange[0];

  return {
    [statToAdd]: value,
  };
}

export function getOtherStatDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  const fullStats = getAllStatRanges(debuffLevel);

  const otherMultKeys = getRecordKeys(fullStats.otherMults);
  const statToAdd = otherMultKeys[Math.floor(rng1 * otherMultKeys.length)];
  const valueRange: [number, number] = fullStats.otherMults[statToAdd];
  const value = ((valueRange[1] - valueRange[0]) * scalar * rng2 + valueRange[0]) * -1;

  return {
    [statToAdd]: value,
  };
}

export function getEndgameStatDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<EndgameMults> {
  const rng1 = rng.random();
  const rng2 = rng.random();

  const debuffLevel = rng.random() * Math.max(8 - level, 2) + Math.max(2 - level / 3, 0);
  const fullStats = getAllStatRanges(debuffLevel);

  const endgameKeys = getRecordKeys(fullStats.endgameStats);
  const statToAdd = endgameKeys[Math.floor(rng1 * endgameKeys.length)];
  const valueRange: [number, number] = fullStats.endgameStats[statToAdd];
  const value = ((valueRange[1] - valueRange[0]) * scalar * rng2 + valueRange[0]) * -1;

  return {
    [statToAdd]: value,
  };
}

export function getLevel(rng: WHRNG, levelBoost = CyberdeckState.netrunningLevel) {
  const levelUpAttempts = (levelBoost / (levelBoost + 1)) * 16 + 4;
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
