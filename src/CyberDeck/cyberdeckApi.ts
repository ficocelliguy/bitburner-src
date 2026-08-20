import { InternalAPI, NetscriptContext } from "../Netscript/APIWrapper";
import { Cyberdeck } from "@nsdefs";
import { CyberdeckState } from "./models/CyberdeckState";
import { DeckModule } from "./Types";
import { disassembleModule } from "./models/createModule";
import { helpers } from "../Netscript/NetscriptHelpers";

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
    recycleMod: (ctx: NetscriptContext, moduleId: unknown) => {
      const modId = helpers.string(ctx, "modId", moduleId);
      const mod = CyberdeckState.storedModules.find((mod) => mod.id === modId) || CyberdeckState.installedModules.find((mod) => mod.id === modId);
      if (!mod) {
        throw new Error(`Module with ID ${modId} not found`);
      }
      if (mod.favorite) {
        throw new Error(`Cannot recycle favorited module ${modId}!`);
      }
      return disassembleModule(mod);
    },
    favoriteMod: (ctx: NetscriptContext, moduleId: unknown, favorite: unknown = true) => {
      const modId = helpers.string(ctx, "modId", moduleId);
      const fav = helpers.boolean(ctx, "favorite", favorite);
      const mod = CyberdeckState.storedModules.find((mod) => mod.id === modId) || CyberdeckState.installedModules.find((mod) => mod.id === modId);
      if (!mod) {
        throw new Error(`Module with ID ${modId} not found`);
      }
      mod.favorite = fav;
    }
  };
}