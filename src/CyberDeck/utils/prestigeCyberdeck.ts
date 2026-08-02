import { CyberdeckState } from "../models/CyberdeckState";
import { Player } from "@player";
import { setupCyberdeckRNG } from "./SaveLoad";

export function prestigeCyberdeck(prestigeBitnode = false) {
  if (prestigeBitnode) {
    CyberdeckState.hasCyberdeck = true; // TODO-fico
    CyberdeckState.storedCycles = 0;
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    CyberdeckState.netrunningLevel = 0;
    setupSeeds();
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
}

export function setupSeeds() {
  const ID = Player.identifier;
  const sourceFileCount = [...Player.sourceFiles].reduce((total, [__bn, lvl]) => (total += lvl), 0);
  CyberdeckState.netrunningSeed = stringToSeed(`${ID}-${sourceFileCount}-run`);
  CyberdeckState.craftingSeed = stringToSeed(`${ID}-${sourceFileCount}-craft`);
  CyberdeckState.netrunningCorruptedSeed = stringToSeed(`${ID}-${sourceFileCount}-glitch`);
  CyberdeckState.netrunningSeedUsages = 0;
  CyberdeckState.craftingSeedUsages = 0;
  CyberdeckState.netrunningCorruptedSeedUsages = 0;
  setupCyberdeckRNG();
}

function stringToSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Bitwise operations to turn the string into a 32-bit signed integer
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash); // Returns a positive integer seed
}
