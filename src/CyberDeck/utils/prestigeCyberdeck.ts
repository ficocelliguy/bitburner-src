import { CyberdeckState, getRackExtensionCap, hasCyberdeck } from "../models/CyberdeckState";
import { addCyberdeckServer } from "../models/cyberdeckServer";
import { prestigeCyberdeckComponents } from "../models/componentEconomy";
import { Player } from "@player";
import { gainCyberdeck } from "../effects";

export function prestigeCyberdeck(prestigeBitnode = false) {
  if (prestigeBitnode) {
    CyberdeckState.hasCyberdeck = !!Player.sourceFiles.get(16) || Player.bitNodeN === 16;
    CyberdeckState.storedCycles = 0;
    CyberdeckState.unitCompleted = 0;
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    CyberdeckState.netrunningLevel = 0;
    CyberdeckState.craftingLevel = 0;
    CyberdeckState.netrunningCooldownLevel = 0;
    CyberdeckState.modStorageSize = 8;
    CyberdeckState.maxInstalledRackExtensions = getRackExtensionCap();
    CyberdeckState.netrunningSeedUsages = 0;
    CyberdeckState.craftingSeedUsages = 0;
    CyberdeckState.netrunningCorruptedSeedUsages = 0;
    CyberdeckState.serverRamUpgrades = 0;
    CyberdeckState.serverCoreUpgrades = 0;

    if (hasCyberdeck()) {
      gainCyberdeck();
    }
  }
  CyberdeckState.lastNetrunningTimestamp = 0;
  CyberdeckState.lastCorruptedNetrunningTimestamp = 0;

  prestigeCyberdeckComponents();

  if (hasCyberdeck()) {
    addCyberdeckServer();
  }
}
