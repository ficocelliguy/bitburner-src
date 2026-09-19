import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { Cyberdeck, EntityInfo } from "@nsdefs";
import { ComponentCounts, DeckMod, NetrunningRewards, NetrunStatus } from "./Types";
import { LocationName, NetrunEntityVariant } from "@enums";
import { getEnumHelper } from "../utils/EnumHelper";
import { CyberdeckEvents, CyberdeckState, getChargedModules, hasCyberdeck } from "./models/CyberdeckState";
import {
  craftICEBreaker,
  craftPowerSupply,
  craftProcessingModule,
  craftUplink,
  disassembleModule,
  getCyberdeckIOPanel,
  getEasterEggModule,
} from "./models/createModule";
import { helpers } from "../Netscript/NetscriptHelpers";
import { getCyberdeckStatBonuses } from "./utils/modStatsUtils";
import {
  ICEBreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "./models/constants";
import { logger } from "../DarkNet/effects/offlineServerHandling";
import { createConnection, disconnectConnection, moveModule, wireOverlapsSocket } from "./models/moduleMutation";
import { getCurrentRackSize, getModuleById } from "./utils/moduleUtilities";
import { getCurrentNetrunningIceCost, netrunRewards } from "./models/netrunRewards";
import { getCorruptedHint } from "./ui/gainComponentToast";
import {
  getCyberdeckServerCoreUpgradeCost,
  getCyberdeckServerRamUpgradeCost,
  upgradeCyberdeckServerCores,
  upgradeCyberdeckServerRam,
} from "./models/cyberdeckServer";
import { Player } from "@player";
import { ShareBonusTime } from "../NetworkShare/Share";
import { GRID_SIZE, NetrunningState } from "./models/NetrunningState";
import {
  flagEntity,
  getSurroundings,
  getThreatSignalStrength,
  initNetrunGrid,
  move,
} from "./models/netrunningMinigame";

function getModOrThrow(modId: string, allowIoPanel: boolean = false): DeckMod {
  const ioPanel = getCyberdeckIOPanel();
  if (ioPanel.id === modId) {
    if (!allowIoPanel) {
      throw new Error(`Cannot modify the IO Panel`);
    }
    return ioPanel;
  }
  const mod =
    CyberdeckState.storedModules.find((mod) => mod.id === modId) ||
    CyberdeckState.installedModules.find((mod) => mod.id === modId);
  if (!mod) {
    throw new Error(`Module with ID ${modId} not found`);
  }
  return mod;
}

function checkCyberdeckAccess() {
  if (!hasCyberdeck()) {
    throw new Error("You must make or purchase a cyberdeck before using the API.");
  }
}

export function NetscriptCyberdeck(): InternalAPI<Cyberdeck> {
  return {
    hasCyberdeck: () => {
      return hasCyberdeck();
    },
    getComponentCounts: () => {
      checkCyberdeckAccess();
      return { ...CyberdeckState.components };
    },
    getStoredMods: (): DeckMod[] => {
      checkCyberdeckAccess();
      return CyberdeckState.storedModules.map((mod) => structuredClone(mod));
    },
    getInstalledMods: (): DeckMod[] => {
      checkCyberdeckAccess();
      const chargedMods = getChargedModules();
      return CyberdeckState.installedModules.map((mod) => ({
        ...structuredClone(mod),
        charged: chargedMods.includes(mod),
      }));
    },
    getCyberdeckIOPanel: (): DeckMod => {
      checkCyberdeckAccess();
      return structuredClone(getCyberdeckIOPanel());
    },
    getConnections: () => {
      checkCyberdeckAccess();
      return CyberdeckState.connections.map((conn) => structuredClone(conn));
    },
    favoriteMod: (ctx: NetscriptContext, moduleId: unknown, favorite: unknown = true) => {
      checkCyberdeckAccess();
      const modId = helpers.string(ctx, "modId", moduleId);
      const fav = helpers.boolean(ctx, "favorite", favorite);
      const mod = getModOrThrow(modId, true);
      mod.favorite = fav;
      CyberdeckEvents.emit();
      logger(ctx)(`Mod ${modId} is now ${fav ? "favorited" : "unfavorited"}`);
    },
    installMod: (ctx: NetscriptContext, moduleId: unknown, modIndex: unknown = 1e10): Promise<boolean> => {
      checkCyberdeckAccess();
      const modId = helpers.string(ctx, "modId", moduleId);
      if (modId === LocationName.IshimaGlitch && !getModuleById(modId)) {
        CyberdeckState.storedModules.unshift(getEasterEggModule());
      }
      const mod = getModOrThrow(modId);
      const locationIndex = helpers.integer(ctx, "modIndex", modIndex);
      if (locationIndex < 0) {
        throw new Error(`modIndex must be a non-negative integer, was ${locationIndex}`);
      }
      logger(ctx)(`Installing mod ${modId}...`);

      return helpers.netscriptDelay(ctx, 1000).then(() => {
        getModOrThrow(modId);
        const storageIndex = CyberdeckState.storedModules.findIndex((mod) => mod.id === modId);
        const sourceIsStorage = storageIndex !== -1;
        const newIndex = Math.min(locationIndex, CyberdeckState.installedModules.length);
        if (sourceIsStorage && CyberdeckState.installedModules.length >= getCurrentRackSize()) {
          logger(ctx)(`Failed to move mod ${modId}: cyberdeck mod rack is already full.`);
          return false;
        }
        moveModule(mod, sourceIsStorage, false, newIndex);

        if (CyberdeckState.connections.find(([s, d]) => wireOverlapsSocket(s) || wireOverlapsSocket(d))) {
          moveModule(mod, false, sourceIsStorage, newIndex);
          logger(ctx)(`Failed to move module: wires cannot overlap.`);
          return false;
        }

        logger(ctx)(`Mod ${modId} installed on rack #${newIndex}`);
        return true;
      });
    },
    storeMod(ctx: NetscriptContext, moduleId: unknown, _storageIndex: unknown = 0) {
      checkCyberdeckAccess();
      const modId = helpers.string(ctx, "modId", moduleId);
      const mod = getModOrThrow(modId);
      const locationIndex = helpers.integer(ctx, "modIndex", _storageIndex);
      if (locationIndex < 0) {
        throw new Error(`modIndex must be a non-negative integer, was ${locationIndex}`);
      }
      const storageSourceIndex = CyberdeckState.storedModules.findIndex((mod) => mod.id === modId);
      const sourceIsStorage = storageSourceIndex !== -1;
      const newIndex = Math.min(locationIndex, CyberdeckState.storedModules.length);
      logger(ctx)(`Mod ${modId} moved to storage slot #${newIndex}`);
      moveModule(mod, sourceIsStorage, true, newIndex);
    },
    addConnection(ctx: NetscriptContext, moduleId1: unknown, moduleId2: unknown, socket: unknown): boolean {
      checkCyberdeckAccess();
      const modId1 = helpers.string(ctx, "modId", moduleId1);
      getModOrThrow(modId1, true);
      const modId2 = helpers.string(ctx, "modId", moduleId2);
      getModOrThrow(modId2, true);
      const socketIndex = helpers.integer(ctx, "socketIndex", socket);
      if (socketIndex < 0 || socketIndex > 7) {
        throw new Error(`Invalid socket index (${socket}). Socket must be in the range [0,7]`);
      }
      const result = createConnection({ modId: modId1, socketIndex }, { modId: modId2, socketIndex });
      if (result.error) {
        logger(ctx)(result.error);
      } else {
        logger(ctx)(`Mods ${modId1} and ${modId2} connected on socket ${socketIndex}`);
      }
      return result.success;
    },
    removeConnection(ctx: NetscriptContext, moduleId1: unknown, moduleId2: unknown, socket: unknown): boolean {
      checkCyberdeckAccess();
      const modId1 = helpers.string(ctx, "modId", moduleId1);
      const mod1 = getModOrThrow(modId1, true);
      const modId2 = helpers.string(ctx, "modId", moduleId2);
      const mod2 = getModOrThrow(modId2, true);
      const socketIndex = helpers.number(ctx, "socketIndex", socket);
      if (socketIndex < 0 || socketIndex > 7) {
        throw new Error(`Invalid socket index (${socket}). Socket must be in the range [0,7]`);
      }
      if (!CyberdeckState.installedModules.includes(mod1)) {
        logger(ctx)(`Cannot remove connection: mod ${modId1} is not installed on the deck rack.`);
        return false;
      }
      if (!CyberdeckState.installedModules.includes(mod2)) {
        logger(ctx)(`Cannot remove connection: mod ${modId2} is not installed on the deck rack.`);
        return false;
      }

      const success = disconnectConnection(modId1, modId2, socketIndex);
      if (!success) {
        logger(ctx)(`No connection found at socket index ${socketIndex} between mods ${modId1} and ${modId2}`);
      } else {
        logger(ctx)(`Removed connection at socket index ${socketIndex} between mods ${modId1} and ${modId2}`);
      }
      return success;
    },
    getRackCapacity() {
      return getCurrentRackSize();
    },

    cortexShare: (ctx: NetscriptContext) => {
      checkCyberdeckAccess();
      const threads = ctx.workerScript.scriptRef.threads;
      const hostname = ctx.workerScript.hostname;
      helpers.log(ctx, () => `Loaning neural activity with ${threads} threads on ${hostname}.`);
      CyberdeckState.cortexSharedThreads += threads;
      return helpers.netscriptDelay(ctx, ShareBonusTime).finally(function () {
        helpers.log(ctx, () => `Finished loaning neural activity with ${threads} threads on ${hostname}.`);
        CyberdeckState.cortexSharedThreads -= threads;
      });
    },
    netrun: {
      start(ctx: NetscriptContext): NetrunStatus {
        checkCyberdeckAccess();
        const failedToStartResponse = {
          success: false,
          coordinates: [0, 0],
          energy: 0,
          score: 0,
          surroundings: getSurroundings(),
          threat: 0,
          threatCount: 0,
          isNetrunning: NetrunningState.isNetrunning,
        };
        if (NetrunningState.isNetrunning) {
          logger(ctx)("Failed to start netrun - a run is already in progress.");
          return failedToStartResponse;
        }
        if (CyberdeckState.components.iceBreakers < getCurrentNetrunningIceCost()) {
          logger(ctx)(
            `Not enough ICEBreakers to netrun. ${
              CyberdeckState.components.iceBreakers
            }/${getCurrentNetrunningIceCost()}`,
          );
          return failedToStartResponse;
        }
        if (CyberdeckState.modStorageSize < CyberdeckState.storedModules.length) {
          logger(ctx)(
            `Not enough module storage space to netrun. ${CyberdeckState.storedModules.length}/${CyberdeckState.modStorageSize}`,
          );
          return failedToStartResponse;
        }

        logger(ctx)(`Starting netrun...`);
        initNetrunGrid(false);
        const { threat, signals } = getThreatSignalStrength();
        return {
          success: true,
          coordinates: structuredClone(NetrunningState.location),
          energy: NetrunningState.energy,
          score: NetrunningState.rewardScore,
          threat,
          threatCount: signals,
          surroundings: getSurroundings(),
          isNetrunning: NetrunningState.isNetrunning,
        };
      },
      move(ctx: NetscriptContext, _direction: unknown): Promise<NetrunStatus> {
        checkCyberdeckAccess();
        const direction = getEnumHelper("NetrunDirection").nsGetMember(ctx, _direction, "direction");
        const failureReult = {
          success: false,
          coordinates: [0, 0],
          energy: 0,
          score: 0,
          surroundings: getSurroundings(),
          threat: 0,
          threatCount: 0,
          isNetrunning: NetrunningState.isNetrunning,
        };
        if (!NetrunningState.isNetrunning) {
          logger(ctx)("Failed to move - no netrun has been started.");
          return Promise.resolve(failureReult);
        }
        return helpers.netscriptDelay(ctx, 400).then(() => {
          if (!NetrunningState.isNetrunning) {
            logger(ctx)("Fail to move - no netrun has been started.");
            return failureReult;
          }
          const [y, x] = NetrunningState.location;
          const result = move(direction, true);
          const newY = NetrunningState.location[0];
          const newX = NetrunningState.location[1];

          // TODO-fico: log feedback - OOM, off the map, broke ice, etc
          if (result && (newX !== x || newY !== y)) {
            logger(ctx)(`Moved to ${y},${x}`);
          } else if (result) {
            logger(ctx)(`Interacted! Still at ${y},${x}`);
          } else {
            logger(ctx)(`Failed to move. Still at ${y},${x}`);
          }
          const { threat, signals } = getThreatSignalStrength();
          return {
            success: result,
            coordinates: structuredClone(NetrunningState.location),
            energy: NetrunningState.energy,
            score: NetrunningState.rewardScore,
            threat,
            threatCount: signals,
            surroundings: getSurroundings(),
            isNetrunning: NetrunningState.isNetrunning,
          };
        });
      },
      finish(ctx: NetscriptContext): NetrunningRewards {
        checkCyberdeckAccess();
        if (!NetrunningState.isNetrunning) {
          throw new Error("Failed to complete netrun - no run in progress.");
        }
        const results = netrunRewards(NetrunningState.corrupted);
        logger(ctx)(`Netrun completed. ${results.mods.length} new modules found.`);
        return results;
      },
      getCost() {
        checkCyberdeckAccess();
        return getCurrentNetrunningIceCost();
      },
      getStatus() {
        checkCyberdeckAccess();
        const { threat, signals } = getThreatSignalStrength();
        return {
          success: true,
          coordinates: structuredClone(NetrunningState.location),
          energy: NetrunningState.energy,
          score: NetrunningState.rewardScore,
          threat,
          threatCount: signals,
          surroundings: getSurroundings(),
          isNetrunning: NetrunningState.isNetrunning,
        };
      },
      getGrid() {
        checkCyberdeckAccess();
        return NetrunningState.grid.map((row) =>
          row.map((entity) => {
            const group = NetrunningState.groups[entity.group] ?? [];
            const entityInfo: EntityInfo = {
              type: entity.visible ? entity.type : NetrunEntityVariant.unknown,
              x: entity.x,
              y: entity.y,
              visible: entity.visible,
              flagged: entity.flagged,
              hits: entity.hits,
              group: !entity.visible || entity.type === NetrunEntityVariant.empty ? null : group.map((g) => [g.y, g.x]),
            };
            if (entity.visible && entity.hasBomb && entity.hits) {
              entityInfo.hasBomb = true;
            }
            return entityInfo;
          }),
        );
      },
      toggleFlag(ctx: NetscriptContext, _y: unknown, _x: unknown) {
        const y = helpers.integer(ctx, "y", _y);
        const x = helpers.integer(ctx, "x", _x);
        if (y < 0 || y > GRID_SIZE) {
          throw new Error(`Invalid y coordinate (${y}): value must be between 0 and ${GRID_SIZE}`);
        }
        if (x < 0 || x > GRID_SIZE) {
          throw new Error(`Invalid x coordinate (${x}): value must be between 0 and ${GRID_SIZE}`);
        }
        const entity = NetrunningState.grid[y]?.[x];
        if (!entity) {
          throw new Error(`No entity found at ${y},${x}`);
        }
        if (entity.type !== NetrunEntityVariant.ice) {
          logger(ctx)(`Entity at ${y},${x} is type ${entity.type} - only ice can be flagged`);
        }
        flagEntity(entity);
      },
    },
    stats: {
      getStatBonuses: () => {
        checkCyberdeckAccess();
        const state = getCyberdeckStatBonuses();
        return structuredClone(state);
      },
      getLevels: () => {
        checkCyberdeckAccess();
        return {
          netrunningLevel: CyberdeckState.netrunningLevel,
          craftingLevel: CyberdeckState.craftingLevel,
          netrunningCooldownLevel: CyberdeckState.netrunningCooldownLevel,
          modStorageSize: CyberdeckState.modStorageSize,
          cyberdeckServerRamUpgrades: CyberdeckState.serverRamUpgrades,
          cyberdeckServerCoreUpgrades: CyberdeckState.serverCoreUpgrades,
        };
      },
      getComponentStats: () => {
        checkCyberdeckAccess();
        return structuredClone(CyberdeckState.componentStats);
      },
    },
    server: {
      getRamUpgradeCost(): ComponentCounts & { money: number } {
        checkCyberdeckAccess();
        const cost = getCyberdeckServerRamUpgradeCost();
        return {
          ...cost.componentCost,
          money: cost.moneyCost,
        };
      },
      getCoreUpgradeCost(): ComponentCounts & { money: number } {
        checkCyberdeckAccess();
        const cost = getCyberdeckServerCoreUpgradeCost();
        return {
          ...cost.componentCost,
          money: cost.moneyCost,
        };
      },
      upgradeRam(ctx: NetscriptContext): boolean {
        checkCyberdeckAccess();
        const cost = getCyberdeckServerRamUpgradeCost();
        if (CyberdeckState.components.rom < cost.componentCost.rom) {
          logger(ctx)(
            `Not enough ROM components to upgrade server RAM. Need ${cost.componentCost.rom}, have ${CyberdeckState.components.rom}`,
          );
          return false;
        }
        if (CyberdeckState.components.neurodes < cost.componentCost.neurodes) {
          logger(ctx)(
            `Not enough neurodes to upgrade server RAM. Need ${cost.componentCost.neurodes}, have ${CyberdeckState.components.neurodes}`,
          );
          return false;
        }
        if (CyberdeckState.components.chips < cost.componentCost.chips) {
          logger(ctx)(
            `Not enough chips to upgrade server RAM. Need ${cost.componentCost.chips}, have ${CyberdeckState.components.chips}`,
          );
          return false;
        }
        if (Player.money < cost.moneyCost) {
          logger(ctx)(`Not enough money to upgrade server RAM. Need ${cost.moneyCost}, have ${Player.money}`);
          return false;
        }
        return upgradeCyberdeckServerRam();
      },
      upgradeCores(ctx: NetscriptContext): boolean {
        checkCyberdeckAccess();
        const cost = getCyberdeckServerCoreUpgradeCost();
        if (CyberdeckState.components.rom < cost.componentCost.rom) {
          logger(ctx)(
            `Not enough ROM components to upgrade server cores. Need ${cost.componentCost.rom}, have ${CyberdeckState.components.rom}`,
          );
          return false;
        }
        if (CyberdeckState.components.neurodes < cost.componentCost.neurodes) {
          logger(ctx)(
            `Not enough neurodes to upgrade server cores. Need ${cost.componentCost.neurodes}, have ${CyberdeckState.components.neurodes}`,
          );
          return false;
        }
        if (CyberdeckState.components.chips < cost.componentCost.chips) {
          logger(ctx)(
            `Not enough chips to upgrade server cores. Need ${cost.componentCost.chips}, have ${CyberdeckState.components.chips}`,
          );
          return false;
        }
        if (Player.money < cost.moneyCost) {
          logger(ctx)(`Not enough money to upgrade server cores. Need ${cost.moneyCost}, have ${Player.money}`);
          return false;
        }
        return upgradeCyberdeckServerCores();
      },
    },

    crafting: {
      getICEBreakerCraftingCost: () => structuredClone(ICEBreakerCraftingCost),
      getPowerSupplyModCraftingCost: () => structuredClone(powerSupplyCraftingCost),
      getProcessingModCraftingCost: () => structuredClone(processingModuleCraftingCost),
      getUplinkModCraftingCost: () => structuredClone(uplinkCraftingCost),
      craftICEBreaker: (ctx: NetscriptContext, count: unknown = 1) => {
        checkCyberdeckAccess();
        const numberToCraft = helpers.positiveInteger(ctx, "count", count);
        if (CyberdeckState.components.rom < ICEBreakerCraftingCost.rom * numberToCraft) {
          logger(ctx)(
            `Not enough ROM to craft ICEBreaker. Need ${ICEBreakerCraftingCost.rom * numberToCraft}, have ${
              CyberdeckState.components.rom
            }`,
          );
          return false;
        }
        if (CyberdeckState.components.neurodes < ICEBreakerCraftingCost.neurodes * numberToCraft) {
          logger(ctx)(
            `Not enough neurodes to craft ICEBreaker. Need ${ICEBreakerCraftingCost.neurodes * numberToCraft}, have ${
              CyberdeckState.components.neurodes
            }`,
          );
          return false;
        }
        if (CyberdeckState.components.chips < ICEBreakerCraftingCost.chips * numberToCraft) {
          logger(ctx)(
            `Not enough chips to craft ICEBreaker. Need ${ICEBreakerCraftingCost.chips * numberToCraft}, have ${
              CyberdeckState.components.chips
            }`,
          );
          return false;
        }
        logger(ctx)(`Crafting ICEBreaker.`);
        return craftICEBreaker();
      },

      craftPowerSupplyMod: (ctx: NetscriptContext) => {
        checkCyberdeckAccess();
        if (CyberdeckState.components.rom < powerSupplyCraftingCost.rom) {
          logger(ctx)(
            `Not enough ROM to craft Power Supply Mod. Need ${powerSupplyCraftingCost.rom}, have ${CyberdeckState.components.rom}`,
          );
          return null;
        }
        if (CyberdeckState.components.neurodes < powerSupplyCraftingCost.neurodes) {
          logger(ctx)(
            `Not enough neurodes to craft Power Supply Mod. Need ${powerSupplyCraftingCost.neurodes}, have ${CyberdeckState.components.neurodes}`,
          );
          return null;
        }
        if (CyberdeckState.components.chips < powerSupplyCraftingCost.chips) {
          logger(ctx)(
            `Not enough chips to craft Power Supply Mod. Need ${powerSupplyCraftingCost.chips}, have ${CyberdeckState.components.chips}`,
          );
          return null;
        }
        if (CyberdeckState.components.cores < powerSupplyCraftingCost.cores) {
          logger(ctx)(
            `Not enough cores to craft Power Supply Mod. Need ${powerSupplyCraftingCost.cores}, have ${CyberdeckState.components.cores}`,
          );
          return null;
        }
        logger(ctx)(`Crafting Power Supply Mod.`);
        return craftPowerSupply();
      },

      craftProcessingMod: (ctx: NetscriptContext) => {
        checkCyberdeckAccess();
        if (CyberdeckState.components.rom < processingModuleCraftingCost.rom) {
          logger(ctx)(
            `Not enough ROM to craft Processing Mod. Need ${processingModuleCraftingCost.rom}, have ${CyberdeckState.components.rom}`,
          );
          return null;
        }
        if (CyberdeckState.components.neurodes < processingModuleCraftingCost.neurodes) {
          logger(ctx)(
            `Not enough neurodes to craft Processing Mod. Need ${processingModuleCraftingCost.neurodes}, have ${CyberdeckState.components.neurodes}`,
          );
          return null;
        }
        if (CyberdeckState.components.chips < processingModuleCraftingCost.chips) {
          logger(ctx)(
            `Not enough chips to craft Processing Mod. Need ${processingModuleCraftingCost.chips}, have ${CyberdeckState.components.chips}`,
          );
          return null;
        }
        if (CyberdeckState.components.cores < processingModuleCraftingCost.cores) {
          logger(ctx)(
            `Not enough cores to craft Processing Mod. Need ${processingModuleCraftingCost.cores}, have ${CyberdeckState.components.cores}`,
          );
          return null;
        }
        logger(ctx)(`Crafting Processing Mod.`);
        return craftProcessingModule();
      },

      craftUplinkMod(ctx: NetscriptContext): DeckMod | null {
        checkCyberdeckAccess();
        if (CyberdeckState.components.rom < uplinkCraftingCost.rom) {
          logger(ctx)(
            `Not enough ROM to craft Uplink Mod. Need ${uplinkCraftingCost.rom}, have ${CyberdeckState.components.rom}`,
          );
          return null;
        }
        if (CyberdeckState.components.neurodes < uplinkCraftingCost.neurodes) {
          logger(ctx)(
            `Not enough neurodes to craft Uplink Mod. Need ${uplinkCraftingCost.neurodes}, have ${CyberdeckState.components.neurodes}`,
          );
          return null;
        }
        if (CyberdeckState.components.chips < uplinkCraftingCost.chips) {
          logger(ctx)(
            `Not enough chips to craft Uplink Mod. Need ${uplinkCraftingCost.chips}, have ${CyberdeckState.components.chips}`,
          );
          return null;
        }
        if (CyberdeckState.components.cores < uplinkCraftingCost.cores) {
          logger(ctx)(
            `Not enough cores to craft Uplink Mod. Need ${uplinkCraftingCost.cores}, have ${CyberdeckState.components.cores}`,
          );
          return null;
        }
        logger(ctx)(`Crafting Uplink Mod.`);
        return craftUplink();
      },

      recycleMod: (ctx: NetscriptContext, moduleId: unknown) => {
        checkCyberdeckAccess();
        const modId = helpers.string(ctx, "modId", moduleId);
        const mod =
          CyberdeckState.storedModules.find((mod) => mod.id === modId) ||
          CyberdeckState.installedModules.find((mod) => mod.id === modId);
        if (!mod) {
          throw new Error(`Module with ID ${modId} not found`);
        }
        if (mod.favorite) {
          logger(ctx)(`Cannot recycle favorited module ${modId}!`);
          return { success: false, chips: 0, rom: 0, neurodes: 0, cores: 0, iceBreakers: 0 };
        }
        return { success: true, ...disassembleModule(mod) };
      },
    },
    legacy: {
      getCost: (ctx: NetscriptContext) => {
        checkCyberdeckAccess();
        if (!CyberdeckState.hasDiscoveredGlitch) {
          ctx.workerScript.print(getCorruptedHint("The cost is far too great"));
          return Infinity;
        }
        return getCurrentNetrunningIceCost(true);
      },
      delve: (ctx: NetscriptContext) => {
        checkCyberdeckAccess();
        const failedToStartResponse = {
          success: false,
          coordinates: [0, 0],
          energy: 0,
          score: 0,
          surroundings: getSurroundings(),
          threat: 0,
          threatCount: 0,
          isNetrunning: NetrunningState.isNetrunning,
        };
        if (!CyberdeckState.hasDiscoveredGlitch) {
          ctx.workerScript.print(getCorruptedHint());
          return failedToStartResponse;
        }
        if (NetrunningState.isNetrunning) {
          logger(ctx)("Failed to start - a run is already in progress.");
          return failedToStartResponse;
        }
        if (CyberdeckState.components.iceBreakers < getCurrentNetrunningIceCost(true)) {
          logger(ctx)(
            `Not enough ICEBreakers to breach the Blackwall. ${
              CyberdeckState.components.iceBreakers
            }/${getCurrentNetrunningIceCost(true)}`,
          );
          return failedToStartResponse;
        }
        if (CyberdeckState.modStorageSize < CyberdeckState.storedModules.length) {
          logger(ctx)(
            `Not enough module storage space to netrun. ${CyberdeckState.storedModules.length}/${CyberdeckState.modStorageSize}`,
          );
          return failedToStartResponse;
        }

        logger(ctx)(`Starting netrun...`);
        initNetrunGrid(true);
        const { threat, signals } = getThreatSignalStrength();
        return {
          success: true,
          coordinates: structuredClone(NetrunningState.location),
          energy: NetrunningState.energy,
          score: NetrunningState.rewardScore,
          threat,
          threatCount: signals,
          surroundings: getSurroundings(),
          isNetrunning: NetrunningState.isNetrunning,
        };
      },
    },
  };
}
