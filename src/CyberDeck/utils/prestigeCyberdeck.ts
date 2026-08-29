import { CyberdeckState, hasCyberdeck } from "../models/CyberdeckState";
import { addCyberdeckServer } from "../models/cyberdeckServer";

export function prestigeCyberdeck(prestigeBitnode = false) {
  if (prestigeBitnode) {
    CyberdeckState.hasCyberdeck = true; // TODO-fico
    CyberdeckState.storedCycles = 0;
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    CyberdeckState.netrunningLevel = 0;
    CyberdeckState.netrunningSeedUsages = 0;
    CyberdeckState.craftingSeedUsages = 0;
    CyberdeckState.netrunningCorruptedSeedUsages = 0;
    CyberdeckState.serverRamUpgrades = 0;
    CyberdeckState.serverCoreUpgrades = 0;
  }
  CyberdeckState.components = {
    chips: 0,
    ROM: 0,
    neurodes: 0,
    cores: 0,
    ICE: 2,
  };
  CyberdeckState.componentStats = {
    ROM: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
      netrunning: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
      netrunning: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
      netrunning: 0,
    },
    cores: {
      netrunning: 0,
    }
  };
  CyberdeckState.lastNetrunningTimestamp = 0;
  CyberdeckState.lastCorruptedNetrunningTimestamp = 0;

  if (hasCyberdeck()) {
    addCyberdeckServer();
  }
}
