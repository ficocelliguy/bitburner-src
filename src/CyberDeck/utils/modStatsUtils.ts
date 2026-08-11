import {
  ConsumableStats,
  DeckModule,
  EndgameMults,
  MiscMults,
  ModKey,
  ModuleStats,
  statBonusLongNames,
  statBonusShortNames,
} from "../Types";
import { CyberdeckState } from "../models/CyberdeckState";


export function getFormattedStatBonus(keyName: ModKey, value: number, useShortName = false) {
  const keyNameSource = useShortName ? statBonusShortNames : statBonusLongNames;
  const formattedKey = keyNameSource[keyName];

  const valueStr = keyName.includes("RackSlots")
    ? Math.floor(value)
    : keyName.includes("Production") ||
      keyName.includes("netrunning") ||
      keyName.includes("crafting") ||
      keyName.includes("storage")
    ? value.toFixed(2)
    : formatAsPercent(value);

  return {
    formattedKey,
    valueStr,
  };
}

export function getStatBonusList(stats: ModuleStats = {}) {
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

export function getDefaultMiscMults(): MiscMults {
  return {
    chipProduction: 0,
    neurodeProduction: 0,
    romProduction: 0,
    program_creation_speed: 0,
    crime_speed: 0,
    stock_fees: 0,
    cct_money: 0,
    IPvGO_power: 0,
    class_cost: 0,
  };
}

export function getDefaultEndgameMults(): EndgameMults {
  return {
    stamina_gain: 0,
    graft_speed: 0,
    sleeve_sync: 0,
    stanek_charge: 0,
    equipment_cost: 0,
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

// At the max of level 12, the min is 0.7% and the max is 3%.
// At 1 min and max scaling and growth scaling, the min is 0.1% + 0.1% per level and the max is 0.6% + 0.2% per level.
export function getStatRollRange(level: number, minScaling: number = 1, maxScaling: number = 1, growthScaling: number = 1): [number, number] {
  return [
    0.001 * minScaling + 0.0005 * level * growthScaling,
    0.006 * maxScaling + 0.002 * level * growthScaling,
  ];
}

export function isBuff(key: ModKey, value: number): boolean {
  return key.includes("_cost") || key.includes("_fee") ? value < 0 : value > 0;
}

export function formatAsPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getModStatString(module: DeckModule) {
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