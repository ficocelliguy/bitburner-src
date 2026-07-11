import { Settings } from "../../Settings/Settings";
import { Connection, DeckModule, Socket } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";
import { createInitialModules } from "./CreateModule";

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
  netrunningBoost: 0
};

const t = Settings.theme;

export const socketColors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];

export function getChargedModuleIDs() : string[] {
  // TODO-fico: power port on deck rack instead of declaring that the first module is charged?
  if (!CyberDeckState.installedModules.length) return [];

  const chargedModules = [CyberDeckState.installedModules[0].id];
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

// TODO-fico: this is temporary rack setup
createInitialModules();
