import { ComponentCounts, ComponentStats, Connection, DeckMod } from "../Types";
import { CyberdeckEvents, CyberdeckState, hasCyberdeck } from "../models/CyberdeckState";
import { updateCoveredSockets } from "../models/moduleMutation";
import { assertObject } from "../../utils/TypeAssertion";

type CyberdeckSaveData = {
  hasCyberdeck: boolean;
  unitCompleted: number;
  baseRackSize: number;
  modStorageSize: number;
  netrunningLevel: number;
  craftingLevel: number;
  netrunningCooldownLevel: number;
  installedModules: DeckMod[];
  storedModules: DeckMod[];
  connections: Connection[];
  lastNetrunningTimestamp: number;
  lastCorruptedNetrunningTimestamp: number;
  components: ComponentCounts;
  componentStats: ComponentStats;
  netrunningSeed: number;
  netrunningSeedUsages: number;
  netrunningCorruptedSeed: number;
  netrunningCorruptedSeedUsages: number;
  craftingSeed: number;
  craftingSeedUsages: number;
};

export function getCyberdeckSaveData(): CyberdeckSaveData {
  return {
    hasCyberdeck: hasCyberdeck(),
    unitCompleted: CyberdeckState.unitCompleted,
    baseRackSize: CyberdeckState.baseRackSize,
    modStorageSize: CyberdeckState.modStorageSize,
    netrunningCooldownLevel: CyberdeckState.netrunningCooldownLevel,
    installedModules: CyberdeckState.installedModules,
    storedModules: CyberdeckState.storedModules,
    connections: CyberdeckState.connections,
    lastNetrunningTimestamp: CyberdeckState.lastNetrunningTimestamp,
    lastCorruptedNetrunningTimestamp: CyberdeckState.lastCorruptedNetrunningTimestamp,
    components: CyberdeckState.components,
    componentStats: CyberdeckState.componentStats,
    netrunningLevel: CyberdeckState.netrunningLevel,
    craftingLevel: CyberdeckState.craftingLevel,
    craftingSeed: CyberdeckState.craftingSeed,
    craftingSeedUsages: CyberdeckState.craftingSeedUsages,
    netrunningSeed: CyberdeckState.netrunningSeed,
    netrunningSeedUsages: CyberdeckState.netrunningSeedUsages,
    netrunningCorruptedSeed: CyberdeckState.netrunningCorruptedSeed,
    netrunningCorruptedSeedUsages: CyberdeckState.netrunningCorruptedSeedUsages,
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
      unitCompleted,
      baseRackSize,
      modStorageSize,
      netrunningLevel,
      craftingLevel,
      netrunningCooldownLevel,
      installedModules,
      storedModules,
      connections,
      lastNetrunningTimestamp,
      lastCorruptedNetrunningTimestamp,
      components,
      componentStats,
      netrunningSeed,
      netrunningSeedUsages,
      netrunningCorruptedSeed,
      netrunningCorruptedSeedUsages,
      craftingSeed,
      craftingSeedUsages,
    } = parsedData;

    if (typeof hasCyberdeck !== "boolean") throw new Error("Invalid cyberdeck savestring value: hasCyberdeck");
    CyberdeckState.hasCyberdeck = hasCyberdeck;
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
    if (typeof lastNetrunningTimestamp !== "number")
      throw new Error("Invalid cyberdeck savestring value: lastNetrunningTimestamp");
    CyberdeckState.lastNetrunningTimestamp = lastNetrunningTimestamp;
    if (typeof lastCorruptedNetrunningTimestamp !== "number")
      throw new Error("Invalid cyberdeck savestring value: lastNetrunningTimestamp");
    CyberdeckState.lastCorruptedNetrunningTimestamp = lastNetrunningTimestamp;
    if (typeof netrunningLevel !== "number") throw new Error("Invalid cyberdeck savestring value: netrunningLevel");
    CyberdeckState.netrunningLevel = netrunningLevel;

    if (!isModuleArray(installedModules)) throw new Error("Invalid cyberdeck savestring value: installedModules");
    CyberdeckState.installedModules = installedModules;
    if (!isModuleArray(storedModules)) throw new Error("Invalid cyberdeck savestring value: storedModules");
    CyberdeckState.storedModules = storedModules;

    if (!isConnectionsArray(connections)) throw new Error("Invalid cyberdeck savestring value: connections");
    CyberdeckState.connections = connections;
    if (!isComponentCounts(components)) throw new Error("Invalid cyberdeck savestring value: components");
    CyberdeckState.components = components;
    if (!isComponentStats(componentStats)) throw new Error("Invalid cyberdeck savestring value: componentStats");
    CyberdeckState.componentStats = componentStats;

    updateCoveredSockets();

    if (typeof netrunningSeed !== "number") throw new Error("Invalid cyberdeck savestring value: netrunningSeed");
    CyberdeckState.netrunningSeed = netrunningSeed;
    if (typeof netrunningSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningSeedUsages");
    CyberdeckState.netrunningSeedUsages = netrunningSeedUsages;
    if (typeof netrunningCorruptedSeed !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningCorruptedSeed");
    CyberdeckState.netrunningCorruptedSeed = netrunningCorruptedSeed;
    if (typeof netrunningCorruptedSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: netrunningCorruptedSeedUsages");
    CyberdeckState.netrunningCorruptedSeedUsages = netrunningCorruptedSeedUsages;
    if (typeof craftingSeed !== "number") throw new Error("Invalid cyberdeck savestring value: craftingSeed");
    CyberdeckState.craftingSeed = craftingSeed;
    if (typeof craftingSeedUsages !== "number")
      throw new Error("Invalid cyberdeck savestring value: craftingSeedUsages");
    CyberdeckState.craftingSeedUsages = craftingSeedUsages;

    // Emit an event to notify that the state has changed
    CyberdeckEvents.emit();
  } catch (error) {
    console.error(error);
    console.error("Invalid Cyberdeck data:", saveString);
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
    "ROM" in obj &&
    "neurodes" in obj &&
    "ICE" in obj &&
    typeof obj.chips === "number" &&
    typeof obj.ROM === "number" &&
    typeof obj.neurodes === "number" &&
    typeof obj.ICE === "number"
  );
}

function isComponentStats(obj: unknown): obj is ComponentStats {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "ROM" in obj &&
    "chips" in obj &&
    "neurodes" in obj &&
    typeof obj.ROM === "object" &&
    typeof obj.chips === "object" &&
    typeof obj.neurodes === "object"
  );
}
