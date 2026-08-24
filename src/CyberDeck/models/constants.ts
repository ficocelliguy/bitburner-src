import { ComponentCounts, ModuleType } from "../Types";
import { Settings } from "../../Settings/Settings";

// TODO-fico: change these after testing to slower cooldowns
export const netrunningTraceDecayMs = 5e4; //5e5
export const netrunningInitialTraceDecayWindowMs = 8000; // 20000
export const corruptedNetrunningHardCooldownMs = 1000 * 30 // 1000 * 90
export const minCyclesToProcess = 20;

export const componentSymbols: { [key in keyof ComponentCounts]: string } = {
  ROM: "⛃",
  neurodes: "⌬",
  chips: "⌨ ",
  cores: "⛯",
  ICE: "❅",
} as const;

export const ICEbreakerCraftingCost: ComponentCounts = {
  ROM: 20,
  neurodes: 20,
  chips: 20,
  cores: 0,
  ICE: 0,
};

export const powerSupplyCraftingCost: ComponentCounts = {
  ROM: 10,
  neurodes: 0,
  chips: 20,
  cores: 1,
  ICE: 0,
};

export const processingModuleCraftingCost: ComponentCounts = {
  ROM: 20,
  neurodes: 0,
  chips: 10,
  cores: 1,
  ICE: 0,
};

export const uplinkCraftingCost: ComponentCounts = {
  ROM: 10,
  neurodes: 20,
  chips: 0,
  cores: 1,
  ICE: 0,
};


export function getModuleDescription(moduleType: ModuleType): string {
  switch (moduleType) {
    case ModuleType.CyberdeckIOPanel:
      return "Hosaka Cyberdecks: The finest that money can buy. This is the external ports of the Cyberdeck itself. Provides power to any mod connected to it.";
    case ModuleType.PowerSupply:
      return "Power supply mods have extra sockets, allowing power from the Cyberdeck to be distributed to more modules. It does not create power itself, but it excels at distributing power to other mods.";
    case ModuleType.ProcessingModule:
      return "Processing mods generally provide boosts to the cyberdeck itself, or to activities that a wearable computer can boost.";
    case ModuleType.Uplink:
      return "Uplink mods provide boosts through your augment system, improving various stats related to the player.";
    case ModuleType.RackExtension:
      return "Rack extensions rarely have useful stat boosts, but they increase the number of mod slots on the cyberdeck.";
    case ModuleType.SkillChip:
      return "Skill chips are a special type of mod that are consumed once they are powered. They provide permanent boosts to various Cyberdeck levels";
    default:
      return "Unknown module type.";
  }
}


export const netrunFlavorText = "You step into cyberspace, the digital world of the net. The neon glow of data streams and the hum of ICE security surrounds you. In the moment before the connection is lost, the ICEbreakers you brought pierce the digital defense, revealing the treasure you came here for.";

export const corruptedNetrunFlavorText = "You step beyond the Blackwall, the last line of defense that maintains cyberspace from the old net that fell long ago. Outside of that firewall, beyond its protection, the deep ICE holds... something. You grab what you can before the connection collapses.";

export const getSocketColor = (index: number) => {
  const t = Settings.theme;
  const colors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];
  return colors[index];
};

export const corruptedNetrunHintTexts = [
  `There is a place, somewhere out there, where the barrier is thin...`,
  `Your world has not yet been turned upside down.`,
  `Is more than a simple glitch?`
];
