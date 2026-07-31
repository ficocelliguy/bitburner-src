import { Settings } from "../../Settings/Settings";
import { ComponentCounts, ComponentStats, Connection, DeckModule, Socket } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";
import { createInitialModules, DeckConnection } from "./createModule";

/** Event emitter to allow the UI to subscribe to Cyberdeck gameplay updates in order to trigger rerenders properly */
export const CyberdeckEvents = new EventEmitter<[]>();

export const CyberdeckState = {
  hasCyberdeck: true,
  storedCycles: 0,
  baseRackSize: 6,
  installedModules: [] as DeckModule[],
  storedModules: [] as DeckModule[],
  connections: [] as Connection[],
  coveredSockets: [] as Socket[],
  lastNetrunningTimestamp: 0,
  components: {
    ROM: 0,
    neurodes: 0,
    chips: 0,
    cores: 0,
    ICE: 4,
  } as ComponentCounts,
  componentStats: {
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
    },
  } as ComponentStats,
  netrunningLevel: 0,
  netrunningSeed: 0,
  netrunningSeedUsages: 0,
  netrunningCorruptedSeed: 0,
  netrunningCorruptedSeedUsages: 0,
  craftingSeed: 0,
  craftingSeedUsages: 0,
};

const t = Settings.theme;

export const socketColors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];

export function getChargedModuleIDs() : string[] {
  if (!CyberdeckState.installedModules.length) return [];

  const chargedModules = [DeckConnection.id];
  for (const moduleId of chargedModules) {
    const connections = CyberdeckState.connections.filter(
      ([source, destination]) => source.moduleId === moduleId || destination.moduleId === moduleId,
    );
    for (const [source, destination] of connections) {
      if (!chargedModules.includes(source.moduleId)) {
        chargedModules.push(source.moduleId);
      }
      if (!chargedModules.includes(destination.moduleId)) {
        chargedModules.push(destination.moduleId);
      }
    }
  }
  return chargedModules;
}

export function getChargedModules() : DeckModule[] {
  const chargedModuleIDs = getChargedModuleIDs();
  return CyberdeckState.installedModules.filter((m) => chargedModuleIDs.includes(m.id));
}

// TODO-fico: this is temporary rack setup
createInitialModules();
