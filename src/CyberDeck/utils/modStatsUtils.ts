import {
  ConsumableStats,
  CyberdeckStats,
  DeckModule,
  EndgameMults,
  MiscMults,
  ModKey,
  ModuleStats,
  statBonusLongNames,
  statBonusShortNames,
} from "../Types";
import { CyberdeckState, getChargedModules } from "../models/CyberdeckState";
import { getRecordKeys } from "../../Types/Record";
import { defaultMultipliers } from "../../PersonObjects/Multipliers";
import { Multipliers } from "@nsdefs";


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
    hacking_grow: 0
  }
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

export function getCyberdeckStatBonuses(basis = 0): CyberdeckStats {
  const chargedModules = getChargedModules();

  const playerMults = getDefaultPlayerMults(basis);
  const playerMultsFromModules = chargedModules.map((m) => m.stats?.playerMults);
  for (const mult of playerMultsFromModules) {
    if (!mult) continue;
    for (const key of getRecordKeys(playerMults)) {
      playerMults[key] += mult[key] ?? 0;
    }
  }

  const miscMultsFromModules = chargedModules.map((m) => m.stats?.otherMults);
  const otherMults = mergeOtherMults(miscMultsFromModules, basis);

  const endgameMultsFromModules = chargedModules.map((m) => m.stats?.endgameStats);
  const endgameStats = mergeEndgameMults(endgameMultsFromModules, basis);

  return {
    playerMults,
    otherMults,
    endgameStats,
    consumableStats: getDefaultConsumableStats(),
    extraRackSlots: chargedModules.reduce((sum, m) => sum + (m.stats?.extraRackSlots ?? 0), 0),
  };
}

export function mergeBuffs(buffs: Partial<Multipliers>[], basis = 0): Multipliers {
  const merged: Multipliers = getDefaultPlayerMults(basis);
  const keys = new Set([...buffs.flatMap((buff) => (buff ? Object.keys(buff) : []))]);

  for (const key of keys) {
    merged[key as keyof Multipliers] = buffs.reduce((sum, buff) => {
      if (buff && key in buff) {
        return sum + (buff[key as keyof Multipliers] ?? 0);
      }
      return sum;
    }, 0);
  }

  return merged;
}

export function mergeOtherMults(mults: Partial<MiscMults | null | undefined>[], basis = 0): MiscMults {
  const otherMults: MiscMults = getDefaultMiscMults(basis);
  for (const mult of mults) {
    if (!mult) continue;
    for (const key of getRecordKeys(otherMults)) {
      otherMults[key] += mult[key] ?? 0;
      // cap cost reductions at -80%
      if (key === "stock_fees" || key === "class_cost") {
        otherMults[key] = Math.max(otherMults[key], -0.8);
      }
    }
  }
  return otherMults;
}

export function mergeEndgameMults(mults: Partial<EndgameMults | null | undefined>[], basis = 0): EndgameMults {
  const endgameMults: EndgameMults = getDefaultEndgameMults(basis);
  for (const mult of mults) {
    if (!mult) continue;
    for (const key of getRecordKeys(endgameMults)) {
      endgameMults[key] += mult[key] ?? 0;
    }
  }
  return endgameMults;
}

export function mergeConsumableStats(...stats: Partial<ConsumableStats | null | undefined>[]): ConsumableStats {
  const consumableStats: ConsumableStats = getDefaultConsumableStats();
  for (const stat of stats) {
    if (!stat) continue;
    for (const key of getRecordKeys(consumableStats)) {
      consumableStats[key] += stat[key] ?? 0;
    }
  }
  return consumableStats;
}