import { CyberDeckState } from "../models/CyberDeckState";


export function prestigeCyberdeck(prestigeBitnode = false) {
  if (prestigeBitnode) {
    CyberDeckState.hasCyberdeck = true; // TODO-fico
    CyberDeckState.storedCycles = 0;
    CyberDeckState.installedModules = [];
    CyberDeckState.storedModules = [];
    CyberDeckState.connections = [];
    CyberDeckState.coveredSockets = [];
    CyberDeckState.netrunningLevel = 0;
  }
  CyberDeckState.components = {
    chips: 0,
    ROM: 0,
    neurodes: 0,
    ICE: 2,
  };
  CyberDeckState.componentStats = {
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
  CyberDeckState.lastNetrunningTimestamp = 0;
}