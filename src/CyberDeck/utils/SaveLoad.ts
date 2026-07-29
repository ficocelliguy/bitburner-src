import { ComponentCounts, ComponentStats, Connection, DeckModule } from "../Types";
import { CyberdeckEvents, CyberdeckState } from "../models/CyberdeckState";
import { updateCoveredSockets } from "../models/moduleMutation";
import { assertObject } from "../../utils/TypeAssertion";

type CyberdeckSaveData = {
  hasCyberdeck: boolean;
  baseRackSize: number;
  installedModules: DeckModule[];
  storedModules: DeckModule[];
  connections: Connection[];
  lastNetrunningTimestamp: number;
  components: ComponentCounts;
  componentStats: ComponentStats;
  netrunningLevel: number;
};

export function getCyberdeckSaveData(): CyberdeckSaveData {
  return {
    hasCyberdeck: CyberdeckState.hasCyberdeck,
    baseRackSize: CyberdeckState.baseRackSize,
    installedModules: CyberdeckState.installedModules,
    storedModules: CyberdeckState.storedModules,
    connections: CyberdeckState.connections,
    lastNetrunningTimestamp: CyberdeckState.lastNetrunningTimestamp,
    components: CyberdeckState.components,
    componentStats: CyberdeckState.componentStats,
    netrunningLevel: CyberdeckState.netrunningLevel,
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
      baseRackSize,
      installedModules,
      storedModules,
      connections,
      lastNetrunningTimestamp,
      components,
      componentStats,
      netrunningLevel,
    } = parsedData;

    if (typeof hasCyberdeck !== "boolean") throw new Error("Invalid cyberdeck savestring value: hasCyberdeck");
    CyberdeckState.hasCyberdeck = hasCyberdeck;
    if (typeof baseRackSize !== "number") throw new Error("Invalid cyberdeck savestring value: baseRackSize");
    CyberdeckState.baseRackSize = baseRackSize;
    if (typeof lastNetrunningTimestamp !== "number") throw new Error("Invalid cyberdeck savestring value: lastNetrunningTimestamp");
    CyberdeckState.lastNetrunningTimestamp = lastNetrunningTimestamp;
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

    // Emit an event to notify that the state has changed
    CyberdeckEvents.emit();
  } catch (error) {
    console.error(error);
    console.error("Invalid Cyberdeck data:", saveString);
  }
}

function isModuleArray(modules: unknown): modules is DeckModule[] {
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