import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { Cyberdeck } from "@nsdefs";
import { CyberdeckState } from "./models/CyberdeckState";
import { DeckModule } from "./Types";
import {
  craftICEbreaker,
  craftPowerSupply,
  craftProcessingModule,
  craftUplink,
  disassembleModule, getEasterEggModule,
} from "./models/createModule";
import { helpers } from "../Netscript/NetscriptHelpers";
import { getCyberdeckStatBonuses } from "./utils/modStatsUtils";
import {
  ICEbreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "./models/constants";
import { logger } from "../DarkNet/effects/offlineServerHandling";
import { createConnection, disconnectConnection, moveModule } from "./models/moduleMutation";
import { getCurrentRackSize, getModuleById } from "./utils/moduleUtilities";
import { LocationName } from "@enums";
import { getCurrentNetrunningIceCost, netRun } from "./models/netrun";


function getModOrThrow(modId: string): DeckModule {
  const mod =
    CyberdeckState.storedModules.find((mod) => mod.id === modId) ||
    CyberdeckState.installedModules.find((mod) => mod.id === modId);
  if (!mod) {
    throw new Error(`Module with ID ${modId} not found`);
  }
  return mod;
}


export function NetscriptCyberdeck(): InternalAPI<Cyberdeck> {
  return {
    getComponentCounts: () => {
      return { ...CyberdeckState.components };
    },
    getStoredMods: (): DeckModule[] => {
      return CyberdeckState.storedModules.map((mod) => structuredClone(mod));
    },
    getInstalledMods: (): DeckModule[] => {
      return CyberdeckState.installedModules.map((mod) => structuredClone(mod));
    },
    getConnections: () => {
      return CyberdeckState.connections.map((conn) => structuredClone(conn));
    },
    favoriteMod: (ctx: NetscriptContext, moduleId: unknown, favorite: unknown = true) => {
      const modId = helpers.string(ctx, "modId", moduleId);
      const fav = helpers.boolean(ctx, "favorite", favorite);
      const mod = getModOrThrow(modId);
      mod.favorite = fav;
    },
    installMod: (ctx: NetscriptContext, moduleId: unknown, index: unknown = 1e10): Promise<boolean> => {
      const modId = helpers.string(ctx, "modId", moduleId);
      if (modId === LocationName.IshimaGlitch && !getModuleById(modId)) {
        CyberdeckState.storedModules.unshift(getEasterEggModule());
      }
      const mod = getModOrThrow(modId);
      const locationIndex = helpers.integer(ctx, "index", index);
      if (locationIndex < 0) {
        throw new Error(`index must be a non-negative integer, was ${locationIndex}`);
      }
      logger(ctx)(`Installing mod ${modId}...`);

      return helpers.netscriptDelay(ctx, 1000).then(() => {
        getModOrThrow(modId);
        const storageIndex = CyberdeckState.storedModules.findIndex((mod) => mod.id === modId);
        const rackIndex = CyberdeckState.installedModules.findIndex((mod) => mod.id === modId);
        const sourceIsStorage = storageIndex !== -1;
        const newIndex = Math.min(locationIndex, CyberdeckState.installedModules.length);
        if (sourceIsStorage && CyberdeckState.installedModules.length >= getCurrentRackSize()) {
          logger(ctx)(`Failed to move mod ${modId}: cyberdeck mod rack is already full.`);
          return false;
        }
        moveModule(mod, sourceIsStorage, false, sourceIsStorage ? storageIndex : rackIndex, newIndex);

        logger(ctx)(`Mod ${modId} installed on rack #${newIndex}`);
        return true;
      });
    },
    storeMod(ctx: NetscriptContext, moduleId: unknown, index: unknown = 0) {
      const modId = helpers.string(ctx, "modId", moduleId);
      const mod = getModOrThrow(modId);
      const locationIndex = helpers.integer(ctx, "index", index);
      if (locationIndex < 0) {
        throw new Error(`index must be a non-negative integer, was ${locationIndex}`);
      }
      const storageIndex = CyberdeckState.storedModules.findIndex((mod) => mod.id === modId);
      const rackIndex = CyberdeckState.installedModules.findIndex((mod) => mod.id === modId);
      const sourceIsStorage = storageIndex !== -1;
      const newIndex = Math.min(locationIndex, CyberdeckState.storedModules.length);
      logger(ctx)(`Mod ${modId} moved to storage slot #${newIndex}`);
      moveModule(mod, sourceIsStorage, true, sourceIsStorage ? storageIndex : rackIndex, newIndex);
    },
    connectMod(ctx: NetscriptContext, moduleId1: unknown, moduleId2: unknown, socket: unknown): boolean {
      const modId1 = helpers.string(ctx, "modId", moduleId1);
      getModOrThrow(modId1);
      const modId2 = helpers.string(ctx, "modId", moduleId2);
      getModOrThrow(modId2);
      const socketIndex = helpers.number(ctx, "socket", socket);
      if (socketIndex < 0 || socketIndex > 7) {
        throw new Error(`Invalid socket index (${socket}). Socket must be in the range [0,7]`)
      }
      const result = createConnection({ moduleId: modId1, socketIndex }, { moduleId: modId2, socketIndex });
      if (result.error) {
        logger(ctx)(result.error)
      } else {
        logger(ctx)(`Connection added between mods ${modId1} and ${modId2} on socket ${socketIndex}`);
      }
      return result.success;
    },
    removeConnection(ctx: NetscriptContext, moduleId1: unknown, moduleId2: unknown, socket: unknown): boolean {
      const modId1 = helpers.string(ctx, "modId", moduleId1);
      const mod1 = getModOrThrow(modId1);
      const modId2 = helpers.string(ctx, "modId", moduleId2);
      const mod2 = getModOrThrow(modId2);
      const socketIndex = helpers.number(ctx, "socket", socket);
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
    async netrun(ctx: NetscriptContext) {
      if (CyberdeckState.components.ICE < getCurrentNetrunningIceCost()){
        logger(ctx)(
          `Not enough ICEbreakers to netrun. ${CyberdeckState.components.ICE}/${getCurrentNetrunningIceCost()}`,
        );
        return { success: false, modules: [], components: {} };
      }
      if (CyberdeckState.modStorageSize < CyberdeckState.storedModules.length) {
        logger(ctx)(
          `Not enough module storage space to netrun. ${CyberdeckState.storedModules.length}/${CyberdeckState.modStorageSize}`,
        );
        return { success: false, modules: [], components: {} };
      }

      logger(ctx)(`Starting netrun...`);
      await helpers.netscriptDelay(ctx, 1000);
      const results = await  netRun();
      if (results.success) {
        logger(ctx)(`Netrun successfully. ${results.modules.length} new modules found.`);
      } else {
        logger(ctx)(`Netrun attempt failed.`);
      }
      return results;
    },
    getNetrunningIceCost() {
      return getCurrentNetrunningIceCost();
    },
    stats: {
      getStatBonuses: () => {
        const state = getCyberdeckStatBonuses();
        return structuredClone(state);
      },
      getLevels: () => {
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
        return structuredClone(CyberdeckState.componentStats);
      },
    },
    crafting: {
      craftICEbreaker: (ctx: NetscriptContext, count: unknown = 1) => {
        const numberToCraft = helpers.positiveInteger(ctx, "count", count);
        if (CyberdeckState.components.ROM < ICEbreakerCraftingCost.ROM * numberToCraft) {
          logger(ctx)(
            `Not enough ROM to craft ICEbreaker. Need ${ICEbreakerCraftingCost.ROM * numberToCraft}, have ${
              CyberdeckState.components.ROM
            }`,
          );
          return false;
        }
        if (CyberdeckState.components.neurodes < ICEbreakerCraftingCost.neurodes * numberToCraft) {
          logger(ctx)(
            `Not enough neurodes to craft ICEbreaker. Need ${ICEbreakerCraftingCost.neurodes * numberToCraft}, have ${
              CyberdeckState.components.neurodes
            }`,
          );
          return false;
        }
        if (CyberdeckState.components.chips < ICEbreakerCraftingCost.chips * numberToCraft) {
          logger(ctx)(
            `Not enough chips to craft ICEbreaker. Need ${ICEbreakerCraftingCost.chips * numberToCraft}, have ${
              CyberdeckState.components.chips
            }`,
          );
          return false;
        }
        logger(ctx)(`Crafting ICEbreaker.`);
        return craftICEbreaker();
      },

      craftPowerSupplyMod: (ctx: NetscriptContext) => {
        if (CyberdeckState.components.ROM < powerSupplyCraftingCost.ROM) {
          logger(ctx)(
            `Not enough ROM to craft Power Supply Mod. Need ${powerSupplyCraftingCost.ROM}, have ${CyberdeckState.components.ROM}`,
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
        if (CyberdeckState.components.ROM < processingModuleCraftingCost.ROM) {
          logger(ctx)(
            `Not enough ROM to craft Processing Mod. Need ${processingModuleCraftingCost.ROM}, have ${CyberdeckState.components.ROM}`,
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

      craftUplinkMod(ctx: NetscriptContext): DeckModule | null {
        if (CyberdeckState.components.ROM < uplinkCraftingCost.ROM) {
          logger(ctx)(
            `Not enough ROM to craft Uplink Mod. Need ${uplinkCraftingCost.ROM}, have ${CyberdeckState.components.ROM}`,
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
        const modId = helpers.string(ctx, "modId", moduleId);
        const mod =
          CyberdeckState.storedModules.find((mod) => mod.id === modId) ||
          CyberdeckState.installedModules.find((mod) => mod.id === modId);
        if (!mod) {
          throw new Error(`Module with ID ${modId} not found`);
        }
        if (mod.favorite) {
          throw new Error(`Cannot recycle favorited module ${modId}!`);
        }
        return disassembleModule(mod);
      },
    },
  };
}