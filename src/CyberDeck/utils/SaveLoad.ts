import { ComponentCounts, ComponentStats, Connection, DeckMod } from "../Types";
import { CyberdeckEvents, CyberdeckState, getDefaultCompletedChallenges, hasCyberdeck } from "../models/CyberdeckState";
import { Challenges } from "../Enums";
import { checkConnection, updateCoveredSockets } from "../models/moduleMutation";
import { assertObject } from "../../utils/TypeAssertion";

type CyberdeckSaveData = {
  hasCyberdeck: boolean;
  hasDiscoveredGlitch: boolean;
  unitCompleted: number;
  baseRackSize: number;
  modStorageSize: number;
  netrunningLevel: number;
  craftingLevel: number;
  netrunningCooldownLevel: number;
  serverRamUpgrades: number;
  serverCoreUpgrades: number;
  installedModules: DeckMod[];
  storedModules: DeckMod[];
  connections: Connection[];
  lastNetrunningTimestamp: number;
  lastCorruptedNetrunningTimestamp: number;
  components: ComponentCounts;
  componentStats: ComponentStats;
  netrunningSeedUsages: number;
  netrunningCorruptedSeedUsages: number;
  craftingPowerSupplySeedUsages: number;
  craftingProcessingModSeedUsages: number;
  craftingUplinkSeedUsages: number;
  completedChallenges: Record<Challenges, boolean>;
};

export function getCyberdeckSaveData(): CyberdeckSaveData {
  return {
    hasCyberdeck: hasCyberdeck(),
    hasDiscoveredGlitch: CyberdeckState.hasDiscoveredGlitch,
    unitCompleted: CyberdeckState.unitCompleted,
    baseRackSize: CyberdeckState.baseRackSize,
    modStorageSize: CyberdeckState.modStorageSize,
    netrunningCooldownLevel: CyberdeckState.netrunningCooldownLevel,
    serverCoreUpgrades: CyberdeckState.serverCoreUpgrades,
    serverRamUpgrades: CyberdeckState.serverRamUpgrades,
    installedModules: CyberdeckState.installedModules,
    storedModules: CyberdeckState.storedModules,
    connections: CyberdeckState.connections,
    lastNetrunningTimestamp: CyberdeckState.lastNetrunningTimestamp,
    lastCorruptedNetrunningTimestamp: CyberdeckState.lastCorruptedNetrunningTimestamp,
    components: CyberdeckState.components,
    componentStats: CyberdeckState.componentStats,
    netrunningLevel: CyberdeckState.netrunningLevel,
    craftingLevel: CyberdeckState.craftingLevel,
    craftingPowerSupplySeedUsages: CyberdeckState.craftingPowerSupplySeedUsages,
    craftingProcessingModSeedUsages: CyberdeckState.craftingProcessingModSeedUsages,
    craftingUplinkSeedUsages: CyberdeckState.craftingUplinkSeedUsages,
    netrunningSeedUsages: CyberdeckState.netrunningSeedUsages,
    netrunningCorruptedSeedUsages: CyberdeckState.netrunningCorruptedSeedUsages,
    completedChallenges: CyberdeckState.completedChallenges,
  };
}

export function loadCyberdeckSaveData(saveString: unknown) {
  if (saveString == null || typeof saveString !== "string" || saveString === "") {
    return;
  }

  try {
    const parsedData: unknown = JSON.parse(saveString);
    assertObject(parsedData);
    const {
      hasCyberdeck,
      hasDiscoveredGlitch,
      unitCompleted,
      baseRackSize,
      modStorageSize,
      netrunningLevel,
      craftingLevel,
      netrunningCooldownLevel,
      serverRamUpgrades,
      serverCoreUpgrades,
      installedModules,
      storedModules,
      connections,
      lastNetrunningTimestamp,
      lastCorruptedNetrunningTimestamp,
      components,
      componentStats,
      netrunningSeedUsages,
      netrunningCorruptedSeedUsages,
      craftingPowerSupplySeedUsages,
      craftingProcessingModSeedUsages,
      craftingUplinkSeedUsages,
      completedChallenges,
    } = parsedData;

    if (typeof hasCyberdeck !== "boolean") throw new Error("Invalid cyberdeck savestring value: hasCyberdeck");
    CyberdeckState.hasCyberdeck = hasCyberdeck;
    if (typeof hasDiscoveredGlitch !== "boolean")
      throw new Error("Invalid cyberdeck savestring value: hasDiscoveredGlitch");
    CyberdeckState.hasDiscoveredGlitch = hasDiscoveredGlitch;
    if (typeof unitCompleted !== "number") throw new Error("Invalid cyberdeck savestring value: unitCompleted");
    CyberdeckState.unitCompleted = unitCompleted;
    if (typeof baseRackSize !== "number") throw new Error("Invalid cyberdeck savestring value: baseRackSize");
    CyberdeckState.baseRackSize = baseRackSize;
    if (typeof modStorageSize !== "number") throw new Error("Invalid cyberdeck savestring value: modStorageSize");
    CyberdeckState.modStorageSize = modStorageSize;
    if (typeof craftingLevel !== "number") throw new Error("Invalid cyberdeck savestring value: craftingLevel");
    CyberdeckState.craftingLevel = craftingLevel;
    if (typeof netrunningCooldownLevel !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningCooldownLevel");
    CyberdeckState.netrunningCooldownLevel = netrunningCooldownLevel;
    if (typeof serverRamUpgrades !== "number") throw new Error("Invalid cyberdeck savestring value: serverRamUpgrades");
    CyberdeckState.serverRamUpgrades = serverRamUpgrades;
    if (typeof serverCoreUpgrades !== "number")
      throw new Error("Invalid cyberdeck savestring value: serverCoreUpgrades");
    CyberdeckState.serverCoreUpgrades = serverCoreUpgrades;
    if (typeof lastNetrunningTimestamp !== "number")
      throw new Error("Invalid cyberdeck savestring value: lastNetrunningTimestamp");
    CyberdeckState.lastNetrunningTimestamp = lastNetrunningTimestamp;
    if (typeof lastCorruptedNetrunningTimestamp !== "number")
      throw new Error("Invalid cyberdeck savestring value: lastCorruptedNetrunningTimestamp");
    CyberdeckState.lastCorruptedNetrunningTimestamp = lastCorruptedNetrunningTimestamp;
    if (typeof netrunningLevel !== "number") throw new Error("Invalid cyberdeck savestring value: netrunningLevel");
    CyberdeckState.netrunningLevel = netrunningLevel;

    if (!isModuleArray(installedModules)) throw new Error("Invalid cyberdeck savestring value: installedModules");
    CyberdeckState.installedModules = installedModules;
    if (!isModuleArray(storedModules)) throw new Error("Invalid cyberdeck savestring value: storedModules");
    CyberdeckState.storedModules = storedModules;

    if (!isComponentCounts(components)) throw new Error("Invalid cyberdeck savestring value: components");
    CyberdeckState.components = components;
    if (!isComponentStats(componentStats)) throw new Error("Invalid cyberdeck savestring value: componentStats");
    CyberdeckState.componentStats = componentStats;

    if (!isConnectionsArray(connections)) throw new Error("Invalid cyberdeck savestring value: connections");
    CyberdeckState.connections = connections.filter(([a, b]) => checkConnection(a, b).success);

    updateCoveredSockets();

    if (typeof netrunningSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningSeedUsages");
    CyberdeckState.netrunningSeedUsages = netrunningSeedUsages;
    if (typeof netrunningCorruptedSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningCorruptedSeedUsages");
    CyberdeckState.netrunningCorruptedSeedUsages = netrunningCorruptedSeedUsages;
    if (typeof craftingPowerSupplySeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: craftingPowerSupplySeedUsages");
    CyberdeckState.craftingPowerSupplySeedUsages = craftingPowerSupplySeedUsages;
    if (typeof craftingProcessingModSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: craftingProcessingModSeedUsages");
    CyberdeckState.craftingProcessingModSeedUsages = craftingProcessingModSeedUsages;
    if (typeof craftingUplinkSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: craftingUplinkSeedUsages");
    CyberdeckState.craftingUplinkSeedUsages = craftingUplinkSeedUsages;
    // Older saves will not have challenge data; missing or unknown entries fall back to not completed
    CyberdeckState.completedChallenges = getDefaultCompletedChallenges();
    if (typeof completedChallenges === "object" && completedChallenges !== null) {
      for (const challenge of Object.values(Challenges)) {
        const completed: unknown = (completedChallenges as Record<string, unknown>)[challenge];
        if (typeof completed === "boolean") CyberdeckState.completedChallenges[challenge] = completed;
      }
    }
    adaptLegacyTutorialCompletion(parsedData);

    // Emit an event to notify that the state has changed
    CyberdeckEvents.emit();
  } catch (error) {
    console.error(error);
    console.error("Invalid Cyberdeck data:", saveString);
  }
}

/** Older saves tracked tutorial completion as a top-level hasCompletedTutorial flag instead of as a challenge */
function adaptLegacyTutorialCompletion(parsedData: object) {
  if ("hasCompletedTutorial" in parsedData && parsedData.hasCompletedTutorial === true) {
    CyberdeckState.completedChallenges[Challenges.CompletedTutorial] = true;
  }
}

function isModuleArray(modules: unknown): modules is DeckMod[] {
  return Array.isArray(modules) && modules.every((m) => typeof m === "object" && m !== null);
}

function isConnectionsArray(connections: unknown): connections is Connection[] {
  return Array.isArray(connections) && connections.every((c) => Array.isArray(c) && c.length === 2);
}

function isComponentCounts(obj: unknown): obj is ComponentCounts {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "chips" in obj &&
    "rom" in obj &&
    "neurodes" in obj &&
    "iceBreakers" in obj &&
    "cores" in obj &&
    typeof obj.chips === "number" &&
    typeof obj.rom === "number" &&
    typeof obj.neurodes === "number" &&
    typeof obj.iceBreakers === "number" &&
    typeof obj.cores === "number"
  );
}

function isComponentStats(obj: unknown): obj is ComponentStats {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "rom" in obj &&
    "chips" in obj &&
    "neurodes" in obj &&
    "cores" in obj &&
    typeof obj.rom === "object" &&
    typeof obj.chips === "object" &&
    typeof obj.neurodes === "object" &&
    typeof obj.cores === "object"
  );
}
