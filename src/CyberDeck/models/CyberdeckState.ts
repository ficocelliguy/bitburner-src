import { ComponentCounts, ComponentStats, Connection, DeckMod, Socket } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";
import { getCyberdeckIOPanel } from "./createModule";
import { WHRNG } from "../../Casino/RNG";
import { Player } from "@player";

/** Event emitter to allow the UI to subscribe to Cyberdeck gameplay updates in order to trigger rerenders properly */
export const CyberdeckEvents = new EventEmitter<[]>();

export const CyberdeckState = {
  hasCyberdeck: false, //true, // TODO-fico: change this to false after testing is done
  unitCompleted: 0,
  storedCycles: 0,
  baseRackSize: 5,
  modStorageSize: 8,
  maxInstalledRackExtensions: 2,
  netrunningCooldownLevel: 0,
  netrunningLevel: 8, // TODO-fico: change this to 0 after testing is done
  craftingLevel: 8, // TODO-fico: change this to 0 after testing is done
  serverRamUpgrades: 0,
  serverCoreUpgrades: 0,
  lastNetrunningTimestamp: 0,
  lastCorruptedNetrunningTimestamp: 0,
  hasDiscoveredGlitch: false,
  installedModules: [] as DeckMod[],
  storedModules: [] as DeckMod[],
  connections: [] as Connection[],
  coveredSockets: [] as Socket[],
  components: {
    ROM: 25,
    neurodes: 25,
    chips: 25,
    cores: 4,
    ICE: 3,
  } as ComponentCounts,
  componentStats: {
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
    },
  } as ComponentStats,
  netrunningSeed: 0,
  netrunningSeedUsages: 0,
  netrunningCorruptedSeed: 0,
  netrunningCorruptedSeedUsages: 0,
  craftingSeed: 0,
  craftingSeedUsages: 0,
  netrunningWHRNG: null as WHRNG | null,
  netrunningCorruptedWHRNG: null as WHRNG | null,
  craftingWHRNG: null as WHRNG | null,
};

export function hasCyberdeck(): boolean {
  return CyberdeckState.hasCyberdeck || !!Player.sourceFiles.get(16) || Player.bitNodeN === 16;
}

export function getChargedModuleIDs(): string[] {
  const chargedModules = [getCyberdeckIOPanel().id];
  if (!CyberdeckState.installedModules.length) return chargedModules;

  for (const moduleId of chargedModules) {
    const connections = CyberdeckState.connections.filter(
      ([source, destination]) => source.modId === moduleId || destination.modId === moduleId,
    );
    for (const [source, destination] of connections) {
      if (!chargedModules.includes(source.modId)) {
        chargedModules.push(source.modId);
      }
      if (!chargedModules.includes(destination.modId)) {
        chargedModules.push(destination.modId);
      }
    }
  }
  return chargedModules;
}

export function getChargedModules(): DeckMod[] {
  const chargedModuleIDs = getChargedModuleIDs();
  return CyberdeckState.installedModules.filter((m) => chargedModuleIDs.includes(m.id));
}
