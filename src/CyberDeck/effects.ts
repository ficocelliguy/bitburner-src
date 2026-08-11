import { Player } from "@player";
import { defaultMultipliers, mergeMultipliers } from "../PersonObjects/Multipliers";
import { CyberdeckStats, EndgameMults, MiscMults } from "./Types";
import { getChargedModules } from "./models/CyberdeckState";
import { getRecordKeys } from "../Types/Record";
import { getDefaultConsumableStats, getDefaultEndgameMults, getDefaultMiscMults } from "./utils/modStatsUtils";

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

export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses().playerMults;
  Player.mults = mergeMultipliers(Player.mults, mults);
  Player.updateSkillLevels();
}