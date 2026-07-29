import { CyberdeckState } from "../models/CyberdeckState";


export function prestigeCyberdeck(prestigeBitnode = false) {
  if (prestigeBitnode) {
    CyberdeckState.hasCyberdeck = true; // TODO-fico
    CyberdeckState.storedCycles = 0;
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    CyberdeckState.netrunningLevel = 0;
  }
  CyberdeckState.components = {
    chips: 0,
    ROM: 0,
    neurodes: 0,
    ICE: 2,
  };
  CyberdeckState.componentStats = {
    ROM: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
    }
  };
  CyberdeckState.lastNetrunningTimestamp = 0;
}