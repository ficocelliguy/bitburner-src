import { ComponentCounts, ModuleType } from "../Types";

// TODO-fico: change these after testing to slower cooldowns
export const netrunningTraceDecayMs = 5e4; //5e5
export const netrunningInitialTraceDecayWindowMs = 8000; // 20000
export const minCyclesToProcess = 20;

export const componentSymbols: { [key in keyof ComponentCounts]: string } = {
  ROM: "⛃",
  neurodes: "⌬",
  chips: "⌨ ",
  cores: "⛯",
  ICE: "❅",
};

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
    case ModuleType.DeckConnection:
      return "This is the external ports of the Cyberdeck itself. Provides power to any mod connected to it.";
    case ModuleType.PowerSupply:
      return "Power supply mods have extra sockets, allowing power from the Cyberdeck to be distributed to more modules. It does not create power itself, it just distributes it.";
    case ModuleType.ProcessingModule:
      return "Processing mods generally provide boosts to the cyberdeck itself, improving stats related to it.";
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