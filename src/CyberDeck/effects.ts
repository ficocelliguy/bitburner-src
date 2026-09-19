import { Player } from "@player";
import { mergeMultipliers } from "../PersonObjects/Multipliers";
import { CyberdeckState, hasCyberdeck } from "./models/CyberdeckState";
import { getCyberdeckStatBonuses } from "./utils/modStatsUtils";
import { gainComponentMessage } from "./ui/gainComponentToast";
import { addCyberdeckServer } from "./models/cyberdeckServer";
import { createInitialModules } from "./models/createModule";
import { Server } from "../Server/Server";
import { DarknetServer } from "../Server/DarknetServer";

export function applyCyberdeckStatBonuses() {
  const mults = getCyberdeckStatBonuses(1);
  const playerMults = mults.playerMults;
  mults.playerMults.bladeburner_stamina_gain = mults.endgameStats.stamina_gain;
  Player.mults = mergeMultipliers(Player.mults, playerMults);
  Player.updateSkillLevels();
}

export function gainCyberdeckComponentsFromSaveBackup() {
  if (!hasCyberdeck()) {
    return;
  }
  CyberdeckState.components.chips += 100;
  CyberdeckState.components.rom += 100;
  CyberdeckState.components.neurodes += 100;
  gainComponentMessage({ chips: 100, rom: 100, neurodes: 100 });
}

export function gainCyberdeckComponentsFromNukeOrBackdoor(server: Server | DarknetServer, showToast = true, backdoor = false) {
  if (!hasCyberdeck() || (backdoor && server.backdoorInstalled) || (!backdoor && server.hasAdminRights)) {
    return;
  }
  const difficulty = server instanceof Server ? server.requiredHackingSkill : server.requiredCharismaSkill;
  const romGained = backdoor ? Math.floor(difficulty / 5 + 30) : 10;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.ROM.backdoors += romGained;
  if (showToast) {
    gainComponentMessage({ rom: romGained });
  }
  return romGained;
}

export function gainCyberdeckComponentsFromCCT(difficulty: number) {
  if (!hasCyberdeck()) {
    return;
  }
  const neurodesGained = Math.floor(difficulty * 2 + 5);
  CyberdeckState.components.neurodes += neurodesGained;
  CyberdeckState.componentStats.neurodes.codingContracts += neurodesGained;
  return neurodesGained;
}

export function gainCyberdeckChipsFromIPvGO(nodesCaptured: number) {
  if (!hasCyberdeck()) {
    return;
  }
  const chipsGained = nodesCaptured * 2 + 2;
  CyberdeckState.components.chips += chipsGained;
  CyberdeckState.componentStats.chips.IPvGO += chipsGained;
  return chipsGained;
}

export function gainCyberdeckRomFromCache() {
  if (!hasCyberdeck()) {
    return;
  }
  const romGained = 20;
  CyberdeckState.components.rom += romGained;
  CyberdeckState.componentStats.ROM.caches += romGained;
  return romGained;
}

export function gainCyberdeck() {
  CyberdeckState.hasCyberdeck = true;
  addCyberdeckServer();
  createInitialModules();
}
