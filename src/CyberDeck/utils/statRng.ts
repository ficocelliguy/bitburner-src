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

export type StatRollBounds = { minRoll: number; maxRoll: number; softCap?: number; hardCap?: number; hardMin?: number };

export function getFullStatRollRanges() {
  const playerMults: Partial<{ [K in keyof Multipliers]: StatRollBounds }> = {
    /* mental mods */
    hacking_chance: { minRoll: 0.1, maxRoll: 0.4 },
    hacking_exp: { minRoll: 0.03, maxRoll: 0.22 },
    hacking: { minRoll: 0.02, maxRoll: 0.1 },
    hacking_speed: { minRoll: 0.02, maxRoll: 0.1 },
    hacknet_node_money: { minRoll: 0.05, maxRoll: 0.3 },
    hacknet_node_ram_cost: { minRoll: -0.05, maxRoll: -0.3 },
    hacknet_node_level_cost: { minRoll: -0.05, maxRoll: -0.3 },

    /* physical and crime mods */
    strength: { minRoll: 0.05, maxRoll: 0.26 },
    defense: { minRoll: 0.05, maxRoll: 0.26 },
    dexterity: { minRoll: 0.05, maxRoll: 0.26 },
    agility: { minRoll: 0.05, maxRoll: 0.26 },
    crime_success: { minRoll: 0.05, maxRoll: 0.31 },
    crime_money: { minRoll: 0.05, maxRoll: 0.23 },

    /* work and soft skills mods */
    charisma: { minRoll: 0.02, maxRoll: 0.1 },
    charisma_exp: { minRoll: 0.03, maxRoll: 0.21 },
    company_rep: { minRoll: 0.03, maxRoll: 0.28 },
    faction_rep: { minRoll: 0.02, maxRoll: 0.1 },
    work_money: { minRoll: 0.1, maxRoll: 0.72 },
  };
  const otherMults: Partial<{ [K in keyof MiscMults]: StatRollBounds }> = {
    /* mental mods */
    program_creation_speed: { minRoll: 0.1, maxRoll: 0.3 },

    /* physical and crime mods */
    crime_speed: { minRoll: 0.0375, maxRoll: 0.23, hardCap: 5 },

    /* work and soft skills mods */
    stock_fees: { minRoll: -0.0375, maxRoll: -0.23, hardMin: -0.9 },
    cct_money: { minRoll: 0.075, maxRoll: 0.3 },
    class_cost: { minRoll: -0.05, maxRoll: -0.44, hardMin: -0.99 },
    IPvGO_power: { minRoll: 0.03, maxRoll: 0.2 },

    /* cyberdeck mods */
    romProduction: { minRoll: 0.25, maxRoll: 5.5 },
    chipProduction: { minRoll: 0.25, maxRoll: 5.5 },
    neurodeProduction: { minRoll: 0.25, maxRoll: 5.5 },
  };
  const consumableStats: { [K in keyof ConsumableStats]: StatRollBounds } = {
    /* cyberdeck mods */
    netrunning_lvl: { minRoll: 0.25, maxRoll: 2.83 },
    crafting_lvl: { minRoll: 0.25, maxRoll: 2.83 },
    netrun_cooldown_lvl: { minRoll: 0.25, maxRoll: 2.83 },
    mod_storage: { minRoll: 0.2, maxRoll: 2.3 },
  };
  const endgameStats: { [K in keyof EndgameMults]: StatRollBounds } = {
    /* endgame mods */
    stamina_gain: { minRoll: 0.03, maxRoll: 0.22 },
    graft_speed: { minRoll: 0.03, maxRoll: 0.17, hardCap: 5 },
    sleeve_sync: { minRoll: 0.03, maxRoll: 0.17 },
    stanek_charge: { minRoll: 0.03, maxRoll: 0.17 },
    equipment_cost: { minRoll: -0.0375, maxRoll: -0.22, hardMin: -0.9 },
    int_exp: { minRoll: 0.03, maxRoll: 0.11 },
  };

  return {
    playerMults,
    otherMults,
    consumableStats,
    endgameStats,
    extraRackSlots: 0,
  } as const;
}

export function getHackingModStatRanges() {
  const { playerMults, otherMults } = getFullStatRollRanges();

  return {
    playerMults: {
      hacking_chance: playerMults.hacking_chance,
      hacking_exp: playerMults.hacking_exp,
      hacking: playerMults.hacking,
      hacking_speed: playerMults.hacking_speed,

      hacknet_node_money: playerMults.hacknet_node_money,
      hacknet_node_ram_cost: playerMults.hacknet_node_ram_cost,
      hacknet_node_level_cost: playerMults.hacknet_node_level_cost,
    },
    otherMults: {
      program_creation_speed: otherMults.program_creation_speed,
    },
  } as const;
}

export function getPhysicalModStatRanges() {
  const { playerMults, otherMults } = getFullStatRollRanges();

  return {
    playerMults: {
      strength: playerMults.strength,
      defense: playerMults.defense,
      dexterity: playerMults.dexterity,
      agility: playerMults.agility,
      crime_success: playerMults.crime_success,
      crime_money: playerMults.crime_money,
    },
    otherMults: {
      crime_speed: otherMults.crime_speed,
    },
  };
}

export function getWorkModStatRanges() {
  const { playerMults, otherMults } = getFullStatRollRanges();

  return {
    playerMults: {
      charisma: playerMults.charisma,
      charisma_exp: playerMults.charisma_exp,
      company_rep: playerMults.company_rep,
      faction_rep: playerMults.faction_rep,
      work_money: playerMults.work_money,
    },
    otherMults: {
      stock_fees: otherMults.stock_fees,
      cct_money: otherMults.cct_money,
      class_cost: otherMults.class_cost,
      IPvGO_power: otherMults.IPvGO_power,
    },
  };
}

export function getCyberdeckModStatRanges() {
  const { otherMults, consumableStats } = getFullStatRollRanges();

  return {
    otherMults: {
      romProduction: otherMults.romProduction,
      chipProduction: otherMults.chipProduction,
      neurodeProduction: otherMults.neurodeProduction,
    },
    consumableStats: {
      netrunning_lvl: consumableStats.netrunning_lvl,
      crafting_lvl: consumableStats.crafting_lvl,
      netrun_cooldown_lvl: consumableStats.netrun_cooldown_lvl,
      mod_storage: consumableStats.mod_storage,
    },
  };
}

const EMPTY_BOUNDS: StatRollBounds = { minRoll: 0, maxRoll: 0 };

function getStatRoll(rng: WHRNG, valueRangeInfo: StatRollBounds, level: number, scalar: number) {
  const totalValueRange = valueRangeInfo.maxRoll - valueRangeInfo.minRoll;
  const scaledValueRange = totalValueRange / 12;
  const minRoll = scaledValueRange * level * 0.4;
  const maxRoll = scaledValueRange * (level + 1);

  // Roll three times and take the sum of the two lowest rolls, to create a range that makes higher values more rare
  const valueRoll1 = (maxRoll - minRoll) * rng.random();
  const valueRoll2 = (maxRoll - minRoll) * rng.random();
  const valueRoll3 = (maxRoll - minRoll) * rng.random();
  const weightedSum = valueRoll1 + valueRoll2 + valueRoll3 - Math.max(valueRoll1, valueRoll2, valueRoll3);

  return (valueRangeInfo.minRoll + weightedSum) * scalar;
}

export function getPlayerStatBuff(
  level: number,
  rng: WHRNG,
  scalar: number = 1,
  playerMults = getFullStatRollRanges().playerMults,
): Partial<Multipliers> {
  const playerMultKeys = getRecordKeys(playerMults);
  const statToAdd = playerMultKeys[Math.floor(rng.random() * playerMultKeys.length)];
  const valueRangeInfo = playerMults[statToAdd] ?? EMPTY_BOUNDS;

  return {
    [statToAdd]: getStatRoll(rng, valueRangeInfo, level, scalar),
  };
}

export function getDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<Multipliers> {
  const debuffLevel = rng.random() * Math.max(5 - level, 2) + Math.max(2 - level / 3, 0);
  return getPlayerStatBuff(debuffLevel, rng, scalar * -1);
}

export function getConsumableBuff(
  level: number,
  rng: WHRNG,
  scalar: number = 1,
  consumableStats = getFullStatRollRanges().consumableStats,
): Partial<ConsumableStats> {
  const consumableKeys = getRecordKeys(consumableStats);
  const statToAdd = consumableKeys[Math.floor(rng.random() * consumableKeys.length)];
  const valueRange = consumableStats[statToAdd] ?? EMPTY_BOUNDS;

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
  const debuffLevel = rng.random() * Math.max(5 - level, 2) + Math.max(2 - level / 3, 0);
  return getEndgameBuff(debuffLevel, rng, scalar * -1);
}

export function getOtherStatBuff(
  level: number,
  rng: WHRNG,
  scalar: number = 1,
  otherMults = getFullStatRollRanges().otherMults,
): Partial<MiscMults> {
  const otherMultKeys = getRecordKeys(otherMults);
  const statToAdd = otherMultKeys[Math.floor(rng.random() * otherMultKeys.length)];
  const valueRange = otherMults[statToAdd] ?? EMPTY_BOUNDS;

  return {
    [statToAdd]: getStatRoll(rng, valueRange, level, scalar),
  };
}

export function getOtherStatDebuff(level: number, rng: WHRNG, scalar: number = 1): Partial<MiscMults> {
  const debuffLevel = rng.random() * Math.max(5 - level, 2) + Math.max(2 - level / 3, 0);
  return getOtherStatBuff(debuffLevel, rng, scalar * -1);
}

export function getLevel(rng: WHRNG, levelBoost = CyberdeckState.netrunningLevel) {
  const bonusAttempts = rng.random() < 0.1 ? 9 : 6;
  const excess = Math.max(levelBoost - 10, 0);
  const ratio = 0.75;
  const chunk = 10;
  const diminishedExcess = (ratio * chunk * (1 - Math.pow(ratio, excess / chunk))) / (1 - ratio);

  const levelUpAttempts = (excess + diminishedExcess) * 0.6 + bonusAttempts;
  const stepSize = Math.max(levelUpAttempts / 100, 1);
  const startingValue = 0.3 + (0.7 * levelBoost) / (levelBoost + 20);
  let level = 0;
  for (let i = 0; i < levelUpAttempts; i += stepSize) {
    if (rng.random() < Math.max(startingValue - i / 20, 0.1)) {
      level += stepSize;
    }
  }
  return Math.floor(level);
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
