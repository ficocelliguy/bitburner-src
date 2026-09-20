import {
  ConsumableStats,
  CyberdeckStats,
  DeckMod,
  EndgameMults,
  MiscMults,
  ModKey,
  ModStats,
  statBonusLongNames,
  statBonusShortNames,
} from "../Types";
import { CyberdeckState, getChargedModules } from "../models/CyberdeckState";
import { Multipliers } from "@nsdefs";
import { getFullStatRollRanges } from "./statRng";
import { SOFT_CAP_DECAY_RATIO, SOFT_CAP_DEFAULT_DECAY_CHUNK_SIZE } from "../models/constants";
import { clampNumber } from "../../utils/helpers/clampNumber";

export function getFormattedStatBonus(keyName: ModKey, value: number, useShortName = false) {
  const keyNameSource = useShortName ? statBonusShortNames : statBonusLongNames;
  const formattedKey = keyNameSource[keyName];

  const valueStr = keyName.includes("RackSlots")
    ? Math.floor(value)
    : keyName.includes("Production") || keyName.includes("lvl") || keyName.includes("storage")
    ? value.toPrecision(3)
    : formatAsPercent(value, useShortName);

  return {
    formattedKey,
    valueStr,
  };
}

export function getStatBonusList(stats: ModStats = {}) {
  const statList = [
    ...Object.entries(stats.playerMults ?? {}),
    ...Object.entries(stats.otherMults ?? {}),
    ...Object.entries(stats.consumableStats ?? {}),
    ...Object.entries(stats.endgameStats ?? {}),
  ] as [ModKey, number][];

  if (stats.extraRackSlots) {
    statList.push([`extraRackSlots`, stats.extraRackSlots]);
  }

  return statList
    .filter(([__, value]) => !!value)
    .sort(([keyA, valueA], [keyB, valueB]) => Number(isBuff(keyB, valueB)) - Number(isBuff(keyA, valueA)));
}

export function getDefaultPlayerMults(basis = 0): Multipliers {
  return {
    agility: basis,
    agility_exp: basis,
    bladeburner_analysis: basis,
    bladeburner_max_stamina: basis,
    bladeburner_stamina_gain: basis,
    bladeburner_success_chance: basis,
    charisma: basis,
    charisma_exp: basis,
    company_rep: basis,
    crime_money: basis,
    crime_success: basis,
    defense: basis,
    defense_exp: basis,
    dexterity: basis,
    dexterity_exp: basis,
    dnet_money: basis,
    faction_rep: basis,
    hacking: basis,
    hacking_exp: basis,
    hacknet_node_core_cost: basis,
    hacknet_node_level_cost: basis,
    hacknet_node_money: basis,
    hacknet_node_purchase_cost: basis,
    hacknet_node_ram_cost: basis,
    strength: basis,
    strength_exp: basis,
    work_money: basis,
    hacking_speed: basis,
    hacking_money: basis,
    hacking_chance: basis,
    hacking_grow: basis,
  };
}

export function getDefaultMiscMults(basis = 0): MiscMults {
  return {
    chipProduction: basis,
    neurodeProduction: basis,
    romProduction: basis,
    program_creation_speed: basis,
    crime_speed: basis,
    stock_fees: basis,
    cct_money: basis,
    IPvGO_power: basis,
    class_cost: basis,
  };
}

export function getDefaultEndgameMults(basis = 0): EndgameMults {
  return {
    stamina_gain: basis,
    graft_speed: basis,
    sleeve_sync: basis,
    stanek_charge: basis,
    equipment_cost: basis,
    int_exp: basis,
  };
}

export function getDefaultConsumableStats(): ConsumableStats {
  return {
    netrunning_lvl: 0,
    netrun_cooldown_lvl: 0,
    mod_storage: 0,
    crafting_lvl: 0,
  };
}

export function isBuff(key: ModKey, value: number): boolean {
  return key.includes("_cost") || key.includes("_fee") ? value < 0 : value > 0;
}

export function formatAsPercent(value: number, shorten = true): string {
  const precision = shorten ? 2 : 4;
  const percent = value * 100;
  if (percent > 100) {
    return `${(value * 100).toPrecision(precision)}%`;
  }
  return `${(value * 100).toFixed(precision)}%`;
}

function getModStatString(module: DeckMod) {
  const statString = getStatBonusList(module.stats)
    .map(([key, value]) => {
      const shortNames = getFormattedStatBonus(key, value, true);
      const longNames = getFormattedStatBonus(key, value, false);
      return `${shortNames.formattedKey} : ${shortNames.valueStr} , ${longNames.formattedKey} : ${longNames.valueStr}`;
    })
    .join(" ");

  return `rarity:${module.rarity} ${module.corrupted ? "corrupted" : ""} ${module.type} ${statString}`.toLowerCase();
}

export function getFilteredStoredModules(modFilter: string) {
  if (!modFilter) return CyberdeckState.storedModules;
  const isPositiveFilter = !modFilter.startsWith("-");
  const filterLower = (isPositiveFilter ? modFilter : modFilter.slice(1)).toLowerCase();

  return CyberdeckState.storedModules.filter(
    (module) => getModStatString(module).includes(filterLower) == isPositiveFilter,
  );
}

export function getCyberdeckStatBonuses(basis = 0): CyberdeckStats {
  const chargedModules = getChargedModules();

  const playerMultsFromModules = chargedModules.map((m) => m.stats?.playerMults);
  const playerMults = mergeBuffs(getDefaultPlayerMults(basis), ...playerMultsFromModules);

  const miscMultsFromModules = chargedModules.map((m) => m.stats?.otherMults);
  const otherMults = mergeBuffs(getDefaultMiscMults(basis), ...miscMultsFromModules);

  const endgameMultsFromModules = chargedModules.map((m) => m.stats?.endgameStats);
  const endgameStats = mergeBuffs(getDefaultEndgameMults(basis), ...endgameMultsFromModules);

  return applyCaps(
    {
      playerMults,
      otherMults,
      endgameStats,
      consumableStats: getDefaultConsumableStats(),
      extraRackSlots: chargedModules.reduce((sum, m) => sum + (m.stats?.extraRackSlots ?? 0), 0),
    },
    basis,
  );
}

export function mergeBuffs<T extends { [K in keyof T]: number }>(
  base: T,
  ...buffs: (Partial<T> | null | undefined)[]
): T;
export function mergeBuffs<T extends { [K in keyof T]: number }>(
  ...buffs: (Partial<T> | null | undefined)[]
): Partial<T> {
  const merged: Partial<T> = {};
  const keys = new Set(buffs.flatMap((buff) => (buff ? Object.keys(buff) : []))) as Set<keyof T>;

  for (const key of keys) {
    let sum = 0;
    for (const buff of buffs) {
      sum += buff?.[key] ?? 0;
    }
    merged[key] = sum as T[keyof T];
  }

  return merged;
}

export function applyCaps(stats: CyberdeckStats, basis: number): CyberdeckStats {
  const result: CyberdeckStats = structuredClone(stats);
  const allStatRanges = getFullStatRollRanges();

  for (const key of Object.keys(stats?.playerMults ?? {}) as Array<keyof Multipliers>) {
    const value = stats.playerMults?.[key];
    if (value == null) {
      continue;
    }
    const { hardCap, hardMin, softCap } = allStatRanges.playerMults[key] ?? {};
    result.playerMults[key] = applySoftCap(value, softCap, hardCap, hardMin,  basis);
  }

  for (const key of Object.keys(stats?.otherMults ?? {}) as Array<keyof MiscMults>) {
    const value = stats.otherMults?.[key];
    if (value == null) {
      continue;
    }
    const { hardCap, hardMin,  softCap } = allStatRanges.otherMults[key] ?? {};
    result.otherMults[key] = applySoftCap(value, softCap, hardCap, hardMin, basis);
  }

  for (const key of Object.keys(stats?.consumableStats ?? {}) as Array<keyof ConsumableStats>) {
    const value = stats.consumableStats?.[key];
    if (value == null) {
      continue;
    }
    const { hardCap, hardMin,  softCap } = allStatRanges.consumableStats[key] ?? {};
    result.consumableStats[key] = applySoftCap(value, softCap, hardCap, hardMin, basis);
  }

  for (const key of Object.keys(stats?.endgameStats ?? {}) as Array<keyof EndgameMults>) {
    const value = stats.endgameStats?.[key];
    if (value == null) {
      continue;
    }
    const { hardCap, hardMin, softCap } = allStatRanges.endgameStats[key] ?? {};
    result.endgameStats[key] = applySoftCap(value, softCap, hardCap, hardMin, basis);
  }

  return result;
}

function applySoftCap(
  value: number,
  softCap: number = 1,
  hardCap: number = 1e10,
  hardMin: number = -1e10,
  basis: number = 0,
): number {
  const bonus = value - basis;
  const sign = Math.sign(bonus);
  const magnitude = Math.abs(bonus);

  let effectiveMagnitude: number;
  if (magnitude <= softCap) {
    effectiveMagnitude = magnitude;
  } else {
    const excess = magnitude - softCap;
    // Each additional chunk of raw bonus past softCap is SOFT_CAP_DECAY_RATIO as effective as the previous chunk
    const ratio = SOFT_CAP_DECAY_RATIO;
    const chunk = SOFT_CAP_DEFAULT_DECAY_CHUNK_SIZE;
    const diminishedExcess = (ratio * chunk * (1 - Math.pow(ratio, excess / chunk))) / (1 - ratio);
    effectiveMagnitude = softCap + diminishedExcess;
  }

  return basis + clampNumber(sign * effectiveMagnitude, hardMin, hardCap);
}

// TODO-fico: remove later after testing
export function logStatRanges() {
  const maxBonuses = getFullStatRollRanges();
  const statList = [
    ...Object.entries(maxBonuses.playerMults ?? {}),
    ...Object.entries(maxBonuses.otherMults ?? {}),
    ...Object.entries(maxBonuses.consumableStats ?? {}),
    ...Object.entries(maxBonuses.endgameStats ?? {}),
  ] as [ModKey, { minRoll: number; maxRoll: number }][];

  const stats = statList
    .map(
      ([k, { minRoll, maxRoll }]) =>
        `${k.padEnd(30)} ${getFormattedStatBonus(k, minRoll).valueStr} ${getFormattedStatBonus(k, maxRoll).valueStr}`,
    )
    .join("\n");
  console.log(stats);
}

/**
 * Rounds a number to four decimal places. NOT TO BE USED FOR RAM.
 * @param decimal A decimal value to trim to four places.
 */
export function roundToFour(decimal: number): number {
  return Math.round(decimal * 10000) / 10000;
}
