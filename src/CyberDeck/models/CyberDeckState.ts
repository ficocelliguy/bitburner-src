import { Settings } from "../../Settings/Settings";
import { Connection, DeckModule, Socket } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";
import { createInitialModules, DeckConnection } from "./createModule";

/** Event emitter to allow the UI to subscribe to CyberDeck gameplay updates in order to trigger rerenders properly */
export const CyberDeckEvents = new EventEmitter<[]>();

export const CyberDeckState = {
  hasCyberdeck: true,
  baseRackSize: 6,
  installedModules: [] as DeckModule[],
  storedModules: [] as DeckModule[],
  connections: [] as Connection[],
  coveredSockets: [] as Socket[],
  components: {
    ROM: 0,
    neurodes: 0,
    chips: 0,
  },
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
    }
  },
  netrunning: 0,
};

const t = Settings.theme;

export const socketColors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];

export function getChargedModuleIDs() : string[] {
  if (!CyberDeckState.installedModules.length) return [];

  const chargedModules = [DeckConnection.id];
  for (const moduleId of chargedModules) {
    const connections = CyberDeckState.connections.filter(
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
  return CyberDeckState.installedModules.filter((m) => chargedModuleIDs.includes(m.id));
}

// TODO-fico: this is temporary rack setup
createInitialModules();
