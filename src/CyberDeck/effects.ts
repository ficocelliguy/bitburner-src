import { Player } from "@player";
import { mergeMultipliers } from "../PersonObjects/Multipliers";
import { CyberdeckState, hasCyberdeck } from "./models/CyberdeckState";
import { getCyberdeckStatBonuses } from "./utils/modStatsUtils";
import { gainComponentMessage } from "./ui/gainComponentToast";
import { addCyberdeckServer } from "./models/cyberdeckServer";
import { createInitialModules, createInitialModules2 } from "./models/createModule";

export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses(1).playerMults;
  Player.mults = mergeMultipliers(Player.mults, mults);
  Player.updateSkillLevels();
}

export function gainCyberdeckComponentsFromSaveBackup() {
  if (!hasCyberdeck()) {
    return;
  }
  CyberdeckState.components.chips += 100;
  CyberdeckState.components.ROM += 100;
  CyberdeckState.components.neurodes += 100;
  gainComponentMessage({ chips: 100, ROM: 100, neurodes: 100 });
}

export function gainCyberdeckComponentsFromNukeOrBackdoor(requiredLevel: number, showToast = true, backdoor = false) {
  if (!hasCyberdeck()) {
    return;
  }
  const romGained = backdoor ? Math.floor(requiredLevel / 5 + 30) : 25;
  CyberdeckState.components.ROM += romGained;
  CyberdeckState.componentStats.ROM.backdoors += romGained;
  if (showToast) { gainComponentMessage({ ROM: romGained }) }
  return romGained;
}

export function gainCyberdeckComponentsFromCCT(difficulty: number, showToast = true) {
  if (!hasCyberdeck()) {
    return;
  }
  const neurodesGained = Math.floor(difficulty * 2 + 20);
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.codingContracts += neurodesGained;
  if (showToast) { gainComponentMessage({ neurodes: neurodesGained }) }
  return neurodesGained;
}

export function gainCyberdeckChipsFromIPvGO(nodesCaptured: number, showToast = true) {
  if (!hasCyberdeck()) {
    return;
  }
  const chipsGained = nodesCaptured * 2 + 2;
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.IPvGO += chipsGained;
  if (showToast) { gainComponentMessage({ chips: chipsGained }) }
  return chipsGained;
}

export function gainCyberdeckRomFromCache(showToast = true) {
  if (!hasCyberdeck()) {
    return;
  }
  const romGained = 20;
  CyberdeckState.components.ROM += romGained;
  CyberdeckState.componentStats.ROM.caches += romGained;
  if (showToast) { gainComponentMessage({ ROM: romGained }) }
  return romGained;
}

export function gainCyberdeck() {
  CyberdeckState.hasCyberdeck = true;
  addCyberdeckServer();
  createInitialModules2();
}
