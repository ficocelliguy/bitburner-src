import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { Cyberdeck, DeckMod } from "@nsdefs";
import { LocationName } from "@enums";
import { CyberdeckState, getChargedModules, hasCyberdeck } from "./models/CyberdeckState";
import {
  craftICEbreaker,
  craftPowerSupply,
  craftProcessingModule,
  craftUplink,
  getCyberdeckIOPanel,
  disassembleModule,
  getEasterEggModule,
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
import { getCurrentNetrunningIceCost, netRun } from "./models/netrun";
import { getCorruptedHint } from "./ui/gainComponentToast";
import { ComponentCounts } from "./Types";
import {
  getCyberdeckServerCoreUpgradeCost,
  getCyberdeckServerRamUpgradeCost,
  upgradeCyberdeckServerCores,
  upgradeCyberdeckServerRam,
} from "./models/cyberdeckServer";
import { Player } from "@player";

function getModOrThrow(modId: string): DeckMod {
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
    hasCyberdeck: () => {
      return hasCyberdeck();
    },
    getComponentCounts: () => {
      return { ...CyberdeckState.components };
    },
    getStoredMods: (): DeckMod[] => {
      return CyberdeckState.storedModules.map((mod) => structuredClone(mod));
    },
    getInstalledMods: (): (DeckMod & { charged: boolean })[] => {
      const chargedMods = getChargedModules();
      return CyberdeckState.installedModules.map((mod) => ({
        ...structuredClone(mod),
        charged: chargedMods.includes(mod),
      }));
    },
    getCyberdeckIOPanel: (): DeckMod => {
      return structuredClone(getCyberdeckIOPanel());
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
        const sourceIsStorage = storageIndex !== -1;
        const newIndex = Math.min(locationIndex, CyberdeckState.installedModules.length);
        if (sourceIsStorage && CyberdeckState.installedModules.length >= getCurrentRackSize()) {
          logger(ctx)(`Failed to move mod ${modId}: cyberdeck mod rack is already full.`);
          return false;
        }
        moveModule(mod, sourceIsStorage, false, newIndex);

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
      const sourceIsStorage = storageIndex !== -1;
      const newIndex = Math.min(locationIndex, CyberdeckState.storedModules.length);
      logger(ctx)(`Mod ${modId} moved to storage slot #${newIndex}`);
      moveModule(mod, sourceIsStorage, true, newIndex);
    },
    addConnection(ctx: NetscriptContext, moduleId1: unknown, moduleId2: unknown, socket: unknown): boolean {
      const modId1 = helpers.string(ctx, "modId", moduleId1);
      getModOrThrow(modId1);
      const modId2 = helpers.string(ctx, "modId", moduleId2);
      getModOrThrow(modId2);
      const socketIndex = helpers.number(ctx, "socket", socket);
      if (socketIndex < 0 || socketIndex > 7) {
        throw new Error(`Invalid socket index (${socket}). Socket must be in the range [0,7]`);
      }
      const result = createConnection({ modId: modId1, socketIndex }, { modId: modId2, socketIndex });
      if (result.error) {
        logger(ctx)(result.error);
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
      if (CyberdeckState.components.ICEBreakers < getCurrentNetrunningIceCost()) {
        logger(ctx)(
          `Not enough ICEbreakers to netrun. ${CyberdeckState.components.ICEBreakers}/${getCurrentNetrunningIceCost()}`,
        );
        return { success: false, mods: [], components: {} };
      }
      if (CyberdeckState.modStorageSize < CyberdeckState.storedModules.length) {
        logger(ctx)(
          `Not enough module storage space to netrun. ${CyberdeckState.storedModules.length}/${CyberdeckState.modStorageSize}`,
        );
        return { success: false, mods: [], components: {} };
      }

      logger(ctx)(`Starting netrun...`);
      await helpers.netscriptDelay(ctx, 1000);
      const results = await netRun();
      if (results.success) {
        logger(ctx)(`Netrun successfully. ${results.mods.length} new modules found.`);
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
    server: {
      getRamUpgradeCost(): ComponentCounts & { money: number } {
        const cost = getCyberdeckServerRamUpgradeCost();
        return {
          ...cost.componentCost,
          money: cost.moneyCost,
        };
      },
      getCoreUpgradeCost(): ComponentCounts & { money: number } {
        const cost = getCyberdeckServerCoreUpgradeCost();
        return {
          ...cost.componentCost,
          money: cost.moneyCost,
        };
      },
      upgradeRam(ctx: NetscriptContext): boolean {
        const cost = getCyberdeckServerRamUpgradeCost();
        if (CyberdeckState.components.ROM < cost.componentCost.ROM) {
          logger(ctx)(
            `Not enough ROM components to upgrade server RAM. Need ${cost.componentCost.ROM}, have ${CyberdeckState.components.ROM}`,
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
        const cost = getCyberdeckServerCoreUpgradeCost();
        if (CyberdeckState.components.ROM < cost.componentCost.ROM) {
          logger(ctx)(
            `Not enough ROM components to upgrade server cores. Need ${cost.componentCost.ROM}, have ${CyberdeckState.components.ROM}`,
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

      craftUplinkMod(ctx: NetscriptContext): DeckMod | null {
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
          logger(ctx)(`Cannot recycle favorited module ${modId}!`);
          return { success: false, chips: 0, ROM: 0, neurodes: 0, cores: 0, ICEBreakers: 0 };
        }
        return { success: true, ...disassembleModule(mod) };
      },
    },
    legacy: {
      getCost: (ctx: NetscriptContext) => {
        if (!CyberdeckState.hasDiscoveredGlitch) {
          ctx.workerScript.print(getCorruptedHint("The cost is far too great"));
          return Infinity;
        }
        return getCurrentNetrunningIceCost(true);
      },
      delve: async (ctx: NetscriptContext) => {
        if (!CyberdeckState.hasDiscoveredGlitch) {
          ctx.workerScript.print(getCorruptedHint());
          return { success: false, mods: [], components: {} };
        }
        if (CyberdeckState.components.ICEBreakers < getCurrentNetrunningIceCost(true)) {
          logger(ctx)(
            `Not enough ICEbreakers to breach the Blackwall. ${
              CyberdeckState.components.ICEBreakers
            }/${getCurrentNetrunningIceCost()}`,
          );
          return { success: false, mods: [], components: {} };
        }
        if (CyberdeckState.modStorageSize < CyberdeckState.storedModules.length) {
          logger(ctx)(
            `Not enough module storage space to delve. ${CyberdeckState.storedModules.length}/${CyberdeckState.modStorageSize}`,
          );
          return { success: false, mods: [], components: {} };
        }

        ctx.workerScript.print(getCorruptedHint(`Leaving the protection of the Blackwall...`));
        await helpers.netscriptDelay(ctx, 5000);
        const results = await netRun(true);
        if (results.success) {
          logger(ctx)(`Returned successfully? ${results.mods.length} new modules found.`);
        } else {
          logger(ctx)(`Old net delve attempt failed.`);
        }
        return results;
      },
    },
  };
}
