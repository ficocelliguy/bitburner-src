import React from "react";
import { Typography } from "@mui/material";
import { getChargedModules } from "../models/CyberdeckState";
import { defaultMultipliers, mergeMultipliers } from "../../PersonObjects/Multipliers";
import { getRecordKeys } from "../../Types/Record";
import {
  ConsumableStats,
  CyberdeckStats,
  EndgameMults,
  MiscMults,
  ModKey,
  ModuleStats,
  statBonusLongNames,
  statBonusShortNames,
} from "../Types";
import { Player } from "@player";
import { Settings } from "../../Settings/Settings";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";


export function StatBonus({
  stats = {},
  emptyMessage = "",
  fontSize = 10,
  useShortStatNames = true,
}: {
  stats?: ModuleStats;
  emptyMessage?: string;
  fontSize?: number;
  useShortStatNames?: boolean;
}) {
  // TODO-fico: cache this with useEffect or similar
  const statList = [
    ...Object.entries(stats.playerMults ?? {}),
    ...Object.entries(stats.otherMults ?? {}),
    ...Object.entries(stats.consumableStats ?? {}),
    ...Object.entries(stats.endgameStats ?? {}),
  ] as [ModKey, number][];

  if (stats.extraRackSlots) {
    statList.push([`extraRackSlots`, stats.extraRackSlots]);
  }

  const results = statList
    .filter(([__, value]) => !!value)
    .sort(([keyA, valueA], [keyB, valueB]) => Number(isBuff(keyB, valueB)) - Number(isBuff(keyA, valueA)));

  if (!results.length) return <div>{emptyMessage}</div>;

  return (
    <>
      {results.map(([key, value], index) => (
        <FormatStat key={index} keyName={key} value={value} useShortName={useShortStatNames} fontSize={fontSize} />
      ))}
    </>
  );
}

function FormatStat({
  keyName,
  value,
  fontSize = 10,
  useShortName = true,
}: {
  keyName: ModKey;
  value: number;
  fontSize?: number;
  useShortName?: boolean;
}): JSX.Element {
  const keyNameSource = useShortName ? statBonusShortNames : statBonusLongNames;
  const formattedKey = keyNameSource[keyName];

  const valueStr = keyName.includes("RackSlots")
    ? Math.floor(value)
    : keyName.includes("Production") || keyName.includes("netrunning") || keyName.includes("crafting")
    ? value.toFixed(2)
    : formatAsPercent(value);

  return (
    <Typography
      style={{
        fontSize: `${fontSize}px`,
        display: "flex",
        justifyContent: "space-between",
        padding: `${Math.ceil(fontSize/10)}px 3px`,
        color: Settings.theme.rep,
        lineHeight: "11px",
      }}
    >
      <span>
        <FormattedKeyElement formattedKey={formattedKey} />:
      </span>
      <span
        style={{ color: isBuff(keyName, value) ? Settings.theme.primary : Settings.theme.hp, paddingLeft: "3px" }}
      >
        {value > 0 ? "+" : ""}
        {valueStr}
      </span>
    </Typography>
  );
}


export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses().playerMults;
  Player.mults = mergeMultipliers(Player.mults, mults);
  Player.updateSkillLevels();
}

export function getCyberdeckStatBonuses(startMultsAt1 = true): CyberdeckStats {
  const chargedModules = getChargedModules();

  const playerMults = defaultMultipliers();
  if (!startMultsAt1) {
    for (const key of getRecordKeys(playerMults)) {
      playerMults[key] = 0;
    }
  }
  const playerMultsFromModules = chargedModules.map((m) => m.stats?.playerMults);
  for (const mult of playerMultsFromModules) {
    if (!mult) continue;
    for (const key of getRecordKeys(playerMults)) {
      playerMults[key] += mult[key] ?? 0;
    }
  }

  const otherMults: MiscMults = getDefaultMiscMults();
  const miscMultsFromModules = chargedModules.map((m) => m.stats?.otherMults);
  for (const mult of miscMultsFromModules) {
    if (!mult) continue;
    for (const key of getRecordKeys(otherMults)) {
      otherMults[key] += mult[key] ?? 0;
    }
  }

  const endgameStats: EndgameMults = getDefaultEndgameMults();
  const endgameMultsFromModules = chargedModules.map((m) => m.stats?.endgameStats);
  for (const mult of endgameMultsFromModules) {
    if (!mult) continue;
    for (const key of getRecordKeys(endgameStats)) {
      endgameStats[key] += mult[key] ?? 0;
    }
  }

  return {
    playerMults,
    otherMults,
    endgameStats,
    consumableStats: getDefaultConsumableStats(),
    extraRackSlots: chargedModules.reduce((sum, m) => sum + (m.stats?.extraRackSlots ?? 0), 0),
  };
}


function getDefaultMiscMults(): MiscMults {
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

function getDefaultEndgameMults(): EndgameMults {
  return {
    stamina_gain: 0,
    graft_speed: 0,
    sleeve_sync: 0,
    stanek_charge: 0,
    equipment_cost: 0,
  };
}

function getDefaultConsumableStats(): ConsumableStats {
  return {
    netrunning_lvl: 0,
    netrun_cooldown_lvl: 0,
    mod_storage: 0,
    crafting_lvl: 0,
  };
}

// At 1 min and max scaling and growth scaling, the min is 0.1% + 0.1% per level and the max is 0.6% + 0.2% per level.
// At the max of level 12, the min is 0.7% and the max is 3%.
export function getStatRollRange(level: number, minScaling: number = 1, maxScaling: number = 1, growthScaling: number = 1): [number, number] {
  return [
    0.001 * minScaling + 0.0005 * level * growthScaling,
    0.006 * maxScaling + 0.002 * level * growthScaling,
  ];
}

export function isBuff(key: ModKey, value: number): boolean {
  return key.includes("_cost") || key.includes("_cooldown") || key.includes("_fee") ? value < 0 : value > 0;
}

function FormattedKeyElement({ formattedKey }: { formattedKey: string }): JSX.Element {
  if (formattedKey === "Rom Production") {
    return <ComponentSymbol symbol={componentSymbols.ROM} />;
  }
  if (formattedKey === "Chip Production") {
    return <ComponentSymbol symbol={componentSymbols.chips} />;
  }
  if (formattedKey === "Neurode Production") {
    return <ComponentSymbol symbol={componentSymbols.neurodes} />;
  }
  return <>{formattedKey}</>;
}

function formatAsPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
