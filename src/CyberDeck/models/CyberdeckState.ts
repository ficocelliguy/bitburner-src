import { ComponentCounts, ComponentStats, Connection, DeckMod, Socket } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";
import { getCyberdeckIOPanel } from "./createModule";
import { Player } from "@player";
import { Challenges } from "../Enums";
import { getCyberdeckLevel } from "./challenges";

/** Event emitter to allow the UI to subscribe to Cyberdeck gameplay updates in order to trigger rerenders properly */
export const CyberdeckEvents = new EventEmitter<[]>();

export const CyberdeckState = {
  hasCyberdeck: true, // TODO-fico: change this to false after testing is done
  unitCompleted: 0,
  storedCycles: 0,
  baseRackSize: 5,
  modStorageSize: 8,
  cortexSharedThreads: 0,
  netrunningCooldownLevel: 0,
  netrunningLevel: 1,
  craftingLevel: 1,
  serverRamUpgrades: 0,
  serverCoreUpgrades: 0,
  lastNetrunningTimestamp: 0,
  lastCorruptedNetrunningTimestamp: 0,
  hasDiscoveredGlitch: false,
  salvagedMods: 0,
  craftedMods: 0,
  installedModules: [] as DeckMod[],
  storedModules: [] as DeckMod[],
  connections: [] as Connection[],
  coveredSockets: [] as Socket[],
  components: {
    rom: 25,
    neurodes: 25,
    chips: 25,
    cores: 4,
    iceBreakers: 30,
  } as ComponentCounts,
  componentStats: {
    rom: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
      netrunning: 0,
      mods: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
      netrunning: 0,
      mods: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
      cortexShare: 0,
      netrunning: 0,
      mods: 0,
    },
    cores: {
      netrunning: 0,
    },
  } as ComponentStats,
  netrunningSeedUsages: 0,
  netrunningCorruptedSeedUsages: 0,
  craftingPowerSupplySeedUsages: 0,
  craftingProcessingModSeedUsages: 0,
  craftingUplinkSeedUsages: 0,
  tutorialSteps: {
    hasInstalledMod: false,
    hasMadeConnection: false,
    hasChargedModule: false,
    hasConsumedSkillchip: false,
    hasCraftedIcebreaker: false,
    hasNetrun: false,
  },
  completedChallenges: getDefaultCompletedChallenges(),
};

export function getDefaultCompletedChallenges(): Record<Challenges, boolean> {
  return Object.fromEntries(Object.values(Challenges).map((c) => [c, false])) as Record<Challenges, boolean>;
}

export function hasCompleted(challenge: Challenges): boolean {
  const currentLevel = getCyberdeckLevel();
  const challengeLevel = Object.values(Challenges).indexOf(challenge);
  if (challengeLevel > currentLevel) return false;

  return CyberdeckState.completedChallenges[challenge];
}

export function hasCyberdeck(): boolean {
  return CyberdeckState.hasCyberdeck || !!Player.sourceFiles.get(16) || Player.bitNodeN === 16;
}

export function getRackExtensionCap() {
  const base = 1;
  const challengeBonus = hasCompleted(Challenges.AutoWire) ? 1 : 0;
  const challengeBonus2 = hasCompleted(Challenges.ArcHazard) ? 1 : 0;
  return base + challengeBonus + challengeBonus2;
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
