import React from "react";
import { Typography } from "@mui/material";
import { getChargedModules } from "./CyberDeckState";
import { defaultMultipliers, mergeMultipliers } from "../../PersonObjects/Multipliers";
import { getRecordKeys } from "../../Types/Record";
import { CyberdeckStats, MiscMults, ModuleStats } from "../Types";
import { Player } from "@player";
import { Settings } from "../../Settings/Settings";


export function StatBonus({ stats }: { stats: ModuleStats | null | undefined }) {
  if (!stats) return <></>;
  const statList = [
    ...Object.entries(stats.playerMults ?? {}),
    ...Object.entries(stats.otherMults ?? {}),
    ...Object.entries(stats.consumableStats ?? {}),
    ...Object.entries(stats.endgameStats ?? {}),
  ];

  if (stats.extraRackSlots) {
    statList.push([`Rack Slots`, stats.extraRackSlots]);
  }

  const results = statList
    .filter(([__, value]) => !!value)
    .map(([key, value]) => formatStat(key, value));

  return (
    <>
      {results.map((result, index) => (
        <div key={index}>
          {result}
          {index < results.length - 1 ? ", " : ""}
        </div>
      ))}
    </>
  );
}


export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses().playerMults;
  Player.mults = mergeMultipliers(Player.mults, mults);
  Player.updateSkillLevels();
}

export function getCyberdeckStatBonuses(): CyberdeckStats {
  const chargedModules = getChargedModules();

  const playerMults = defaultMultipliers();
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

  return {
    playerMults,
    otherMults,
    extraRackSlots: chargedModules.reduce((sum, m) => sum + (m.stats?.extraRackSlots ?? 0), 0),
  };
}


function getDefaultMiscMults(): MiscMults {
  return {
    chipProduction: 0,
    neurodeProduction: 0,
    romProduction: 0,
    program_creation_speed: 0,
    stock_commission: 0,
  };
}

export function generateStatBonus(min: number, max: number, highWeighting = false) {
  const range = max - min;
  const weights = highWeighting ? [0.3, 0.3, 0.4] : [0.25, 0.25, 0.5];
  return weights.reduce((sum, weight) => sum + weight * range * Math.random(), min);
}

function formatStat(key: string, value: number): JSX.Element {
  const formattedKey = key
    .replaceAll("_", " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replaceAll(" Exp", "XP");

  const valueStr = key.includes("Rack Slots") ? Math.floor(value) : key.includes("Production") || key.includes("netrunning") ? value.toFixed(2) : formatAsPercent(value);
  const isBuff = key.includes("_cost") ? value < 0 : value > 0;

  return (
    <Typography style={{ fontSize: "10px", display: "inline-flex", paddingLeft: "4px", color: Settings.theme.rep }}>
      {`${formattedKey}: `}
      <span style={{ color: isBuff ? Settings.theme.primary : Settings.theme.warning, paddingLeft: "4px" }}>
        {value > 0 ? "+" : ""}{valueStr}
      </span>
    </Typography>
  );
}

function formatAsPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}