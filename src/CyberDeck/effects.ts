import { Player } from "@player";
import { defaultMultipliers, mergeMultipliers } from "../PersonObjects/Multipliers";
import { CyberdeckStats, EndgameMults, MiscMults } from "./Types";
import { CyberdeckState, getChargedModules } from "./models/CyberdeckState";
import { getRecordKeys } from "../Types/Record";
import { getDefaultConsumableStats, getDefaultEndgameMults, getDefaultMiscMults } from "./utils/modStatsUtils";
import { gainComponentMessage } from "./ui/gainComponentToast";

export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses().playerMults;
  Player.mults = mergeMultipliers(Player.mults, mults);
  Player.updateSkillLevels();
}

export function gainCyberdeckComponentsFromSaveBackup() {
  if (!CyberdeckState.hasCyberdeck) {
    return;
  }
  CyberdeckState.components.chips += 100;
  CyberdeckState.components.ROM += 100;
  CyberdeckState.components.neurodes += 100;
  gainComponentMessage({ chips: 100, ROM: 100, neurodes: 100 });
}

export function gainCyberdeckComponentsFromNukeOrBackdoor(requiredLevel: number, showToast = true, backdoor = false) {
  if (!CyberdeckState.hasCyberdeck) {
    return;
  }
  const romGained = backdoor ? Math.floor(requiredLevel / 5 + 30) : 25;
  CyberdeckState.components.ROM += romGained;
  CyberdeckState.componentStats.ROM.backdoors += romGained;
  if (showToast) { gainComponentMessage({ ROM: romGained }) }
  return romGained;
}

export function gainCyberdeckComponentsFromCCT(difficulty: number, showToast = true) {
  if (!CyberdeckState.hasCyberdeck) {
    return;
  }
  const neurodesGained = Math.floor(difficulty * 2 + 20);
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.codingContracts += neurodesGained;
  if (showToast) { gainComponentMessage({ neurodes: neurodesGained }) }
  return neurodesGained;
}

export function gainCyberdeckChipsFromIPvGO(nodesCaptured: number, showToast = true) {
  if (!CyberdeckState.hasCyberdeck) {
    return;
  }
  const chipsGained = nodesCaptured * 2 + 2;
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.IPvGO += chipsGained;
  if (showToast) { gainComponentMessage({ chips: chipsGained }) }
  return chipsGained;
}

export function gainCyberdeckRomFromCache(showToast = true) {
  if (!CyberdeckState.hasCyberdeck) {
    return;
  }
  const romGained = 20;
  CyberdeckState.components.ROM += romGained;
  CyberdeckState.componentStats.ROM.caches += romGained;
  if (showToast) { gainComponentMessage({ ROM: romGained }) }
  return romGained;
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