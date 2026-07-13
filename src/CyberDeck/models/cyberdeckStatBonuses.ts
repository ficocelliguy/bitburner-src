import { getChargedModules } from "./CyberDeckState";
import { defaultMultipliers, mergeMultipliers } from "../../PersonObjects/Multipliers";
import { getRecordKeys } from "../../Types/Record";
import { CyberdeckStats, MiscMults } from "../Types";
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
      playerMults[key] += (mult[key] ?? 1) - 1;
    }
  }

  const otherMults: MiscMults = getDefaultMiscMults();
  const miscMultsFromModules = chargedModules.map((m) => m.stats?.otherMults);
  for (const mult of miscMultsFromModules) {
    if (!mult) continue;
    for (const key of getRecordKeys(otherMults)) {
      otherMults[key] += (mult[key] ?? 1) - 1;
    }
  }
  return {
    playerMults,
    otherMults,
  };
}


function getDefaultMiscMults(): MiscMults {
  return {
    cyberdeckCraftingSpeed: 1,
  };
}