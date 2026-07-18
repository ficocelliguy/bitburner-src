import { getChargedModules } from "./CyberDeckState";
import { defaultMultipliers, mergeMultipliers } from "../../PersonObjects/Multipliers";
import { getRecordKeys } from "../../Types/Record";
import { CyberdeckStats, MiscMults, ModuleStats } from "../Types";
import { Player } from "@player";

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
    cyberdeckCraftingSpeed: 1,
  };
}

export function generateStatBonus(min: number, max: number, highWeighting = false) {
  const range = max - min;
  const weights = highWeighting ? [0.3, 0.3, 0.4] : [0.25, 0.25, 0.5];
  return weights.reduce((sum, weight) => sum + weight * range * Math.random(), min);
}

export function displayStatBonuses(stats: ModuleStats | null | undefined): string {
  if (!stats) return "";
  const results = [
      ...Object.entries(stats.playerMults ?? {}),
      ...Object.entries(stats.otherMults ?? {}),
      ...Object.entries(stats.consumableStats ?? {})
  ]
  .filter(([__, value]) => value !== 0)
  .map(([key, value]) => `${formatKey(key)}: ${formatAsPercent(+value)}`);


  if (stats.extraRackSlots) {
    results.push(`Rack Slots: ${stats.extraRackSlots}`);
  }

  return results.join(", ");
}

function formatKey(key: string): string {
  return key.replaceAll("_", " ").replaceAll(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAsPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}