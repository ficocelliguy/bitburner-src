import {
  ConsumableStats,
  CyberdeckStats,
  DeckMod,
  EndgameMults,
  MiscMults,
  ModKey,
  ModStats, ModType,
  statBonusLongNames,
  statBonusShortNames,
} from "../Types";
import { CyberdeckState, getChargedModules } from "../models/CyberdeckState";
import { Multipliers } from "@nsdefs";
import { roundToFour } from "../../utils/helpers/roundToTwo";
import { getAllStatRanges, getDebuff, getID, getNextNetrunningWHRNG } from "./statRng";


export function getFormattedStatBonus(keyName: ModKey, value: number, useShortName = false) {
  const keyNameSource = useShortName ? statBonusShortNames : statBonusLongNames;
  const formattedKey = keyNameSource[keyName];

  const valueStr = keyName.includes("RackSlots")
    ? Math.floor(value)
    : keyName.includes("Production") ||
      keyName.includes("lvl") ||
      keyName.includes("storage")
    ? value.toFixed(2)
    : formatAsPercent(value);

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

// At the max of level 12, the min is 0.7% and the max is 10%.
// At 1 min and max scaling and growth scaling, the min is 0.1% + 0.1% per level and the max is 0.6% + 0.8% per level.
export function getStatRollRange(level: number, minScaling: number = 1, maxScaling: number = 1, growthScaling: number = 1): [number, number] {
  return [
    roundToFour(0.001 * minScaling + 0.002 * level * growthScaling),
    roundToFour(0.006 * maxScaling + 0.008 * level * growthScaling),
  ];
}

export function isBuff(key: ModKey, value: number): boolean {
  return key.includes("_cost") || key.includes("_fee") ? value < 0 : value > 0;
}

export function formatAsPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getModStatString(module: DeckMod) {
  const statString = getStatBonusList(module.stats).map(([key, value]) => {
    const shortNames = getFormattedStatBonus(key, value, true);
    const longNames = getFormattedStatBonus(key, value, false);
    return `${shortNames.formattedKey} : ${shortNames.valueStr} , ${longNames.formattedKey} : ${longNames.valueStr}`;
  }).join(" ");

  return `rarity:${module.level} ${module.type} ${statString}`.toLowerCase()
}

export function getFilteredStoredModules(modFilter: string) {
  if (!modFilter) return CyberdeckState.storedModules;
  const isPositiveFilter = !modFilter.startsWith("-");
  const filterLower = (isPositiveFilter ? modFilter : modFilter.slice(1)).toLowerCase();

  return CyberdeckState.storedModules.filter((module) => getModStatString(module).includes(filterLower) == isPositiveFilter);
}

export function getCyberdeckStatBonuses(basis = 0): CyberdeckStats {
  const chargedModules = getChargedModules();

  const playerMultsFromModules = chargedModules.map((m) => m.stats?.playerMults);
  const playerMults = mergeBuffs(getDefaultPlayerMults(basis), ...playerMultsFromModules);

  const miscMultsFromModules = chargedModules.map((m) => m.stats?.otherMults);
  const otherMults = mergeBuffs(getDefaultMiscMults(basis), ...miscMultsFromModules);

  const endgameMultsFromModules = chargedModules.map((m) => m.stats?.endgameStats);
  const endgameStats = mergeBuffs(getDefaultEndgameMults(basis), ...endgameMultsFromModules);

  playerMults.bladeburner_stamina_gain = endgameStats.stamina_gain;

  return {
    playerMults,
    otherMults,
    endgameStats,
    consumableStats: getDefaultConsumableStats(),
    extraRackSlots: chargedModules.reduce((sum, m) => sum + (m.stats?.extraRackSlots ?? 0), 0),
  };
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


// TODO-fico: remove later after testing
export function logStatRanges() {
  const maxBonuses = getAllStatRanges(12);
  const statList = [
    ...Object.entries(maxBonuses.playerMults ?? {}),
    ...Object.entries(maxBonuses.otherMults ?? {}),
    ...Object.entries(maxBonuses.consumableStats ?? {}),
    ...Object.entries(maxBonuses.endgameStats ?? {}),
  ] as [ModKey, [number, number]][];

  const stats = statList.map(([k, [v1, v2]]) => `${k.padEnd(30)} ${getFormattedStatBonus(k, v1).valueStr} ${getFormattedStatBonus(k, v2).valueStr}`).join("\n");
  console.log(stats);
}