import { ComponentCounts, ModType } from "../Types";
import { Settings } from "../../Settings/Settings";
import { CyberdeckState } from "./CyberdeckState";
import { CONSTANTS } from "../../Constants";

// TODO-fico: change these after testing to slower cooldowns
export const netrunningTraceDecayMs = 5e4; //5e5
export const netrunningInitialTraceDecayWindowMs = 8000; // 20000
export const corruptedNetrunningHardCooldownMs = 1000 * 30; // 1000 * 90
export const minCyclesToProcess = 20;

export const CyberdeckPurchasePrice = 1_000_000_000;
export const CyberdeckManualCreationHackLevel = 1000;
export const CyberdeckRequiredWorkUnits = CONSTANTS.MillisecondsPerHour;

export const componentSymbols: { [key in keyof ComponentCounts]: string } = {
  rom: "⛃",
  neurodes: "⌬",
  chips: "⌨ ",
  cores: "⛯",
  iceBreakers: "❅",
} as const;

export const ICEbreakerCraftingCost: ComponentCounts = {
  rom: 20,
  neurodes: 20,
  chips: 20,
  cores: 0,
  iceBreakers: 0,
};

export const powerSupplyCraftingCost: ComponentCounts = {
  rom: 5,
  neurodes: 0,
  chips: 10,
  cores: 1,
  iceBreakers: 0,
};

export const processingModuleCraftingCost: ComponentCounts = {
  rom: 10,
  neurodes: 0,
  chips: 5,
  cores: 1,
  iceBreakers: 0,
};

export const uplinkCraftingCost: ComponentCounts = {
  rom: 5,
  neurodes: 10,
  chips: 0,
  cores: 1,
  iceBreakers: 0,
};

export function getModuleDescription(moduleType: ModType): string {
  if (moduleType === ModType.CyberdeckIOPanel) {
    return isCustomBuild()
      ? "Ono-Sendai Mk7, custom build."
      : "Hosaka Cyberdecks: The finest that money can buy.";
  }
  if (Settings.CyberdeckWiFU) {
    return getWifuDescription(moduleType);
  }
  switch (moduleType) {
    case ModType.PowerSupply:
      return "Power supply mods have extra sockets, allowing power from the Cyberdeck to be distributed to more modules. It does not create power itself, but it excels at distributing power to other mods.";
    case ModType.ProcessingMod:
      return "Processing mods generally provide boosts to the cyberdeck itself, or to activities that a wearable computer can boost.";
    case ModType.Uplink:
      return "Uplink mods provide boosts through your augment system, improving various stats related to the player.";
    case ModType.RackExtension:
      return "Rack extensions rarely have useful stat boosts, but they increase the number of mod slots on the cyberdeck.";
    case ModType.SkillChip:
      return "Skill chips are a special type of mod that are consumed once they are powered. They provide permanent boosts to various Cyberdeck levels";
    default:
      return "Unknown module type.";
  }
}

function getWifuDescription(moduleType: ModType): string {
  switch (moduleType) {
    case ModType.PowerSupply:
      return "Luna-chan likes energy drinks, and dislikes being alone. They need a charged connection to get started, but then they light up everyone they reach out to. Every WiFU deserves to shine!";
    case ModType.ProcessingMod:
      return "Faye-sama likes getting shit done, and hates waiting around. Her on-disk persona is unusually curt and direct, but she is good at bending the rules and getting you benefits that otherwise would be impossible.";
    case ModType.Uplink:
      return "Hana-san is the most reliable of the WiFU. Their presence is simple and direct, and provide more stability and range of expertise than the other Wired Firmware Units. They love takoyaki, and dislike riddles.";
    case ModType.RackExtension:
      return "Sakura-hīme loves to be surrounded by friends. She often cannot directly buff the team, but instead finds a way to make room for more WiFU. A larger rack is key to unlocking the full potential of the cyberdeck.";
    case ModType.SkillChip:
      return "Ken-kun wants to have a moment in the spotlight and leave a lasting impression. He does not stay long, but he will leave an impression on your heart - and your skill levels - forever.";
    default:
      return "";
  }
}

export const netrunFlavorText =
  "You step into cyberspace, the digital world of the net. The neon glow of data streams and the hum of ICE security surrounds you. In the moment before the connection is lost, the ICEbreakers you brought pierce the digital defense, revealing the treasure you came here for.";

export const corruptedNetrunFlavorText =
  "You step beyond the Blackwall, the last line of defense that maintains cyberspace from the old net that fell long ago. Outside of that firewall, beyond its protection, the deep ICE holds... something. You grab what you can before the connection collapses.";

export const getSocketColor = (index: number) => {
  const t = Settings.theme;
  const colors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];
  return colors[index];
};

export const corruptedNetrunHintTexts = [
  `There is a place, somewhere out there, where the barrier is thin...`,
  `Your world has not yet been turned upside down.`,
  `Is more than a simple glitch?`,
];

export function isCustomBuild() {
  return CyberdeckState.unitCompleted >= CyberdeckRequiredWorkUnits;
}
