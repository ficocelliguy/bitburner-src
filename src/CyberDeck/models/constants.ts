import { ComponentCounts } from "../Types";
import { ModType } from "../Enums";
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

export const ICEBreakerCraftingCost: ComponentCounts = {
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
    return isCustomBuild() ? "Ono-Sendai Mk7, custom build." : "Hosaka Cyberdecks: The finest that money can buy.";
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
      return "Luna-chan likes energy drinks, and hates being alone. They can't do much on their own, but hook them in and they'll light up every WiFU they can reach. Everyone deserves to shine!";
    case ModType.ProcessingMod:
      return "Faye-sama likes getting shit done, and hates waiting around. Her on-disk persona alternates between being downright rude and oddly affectionate, and she bends the rules get buffs that can't be found anywhere else.";
    case ModType.Uplink:
      return "Hana-san is the most reliable of the WiFU. Their presence is simple and direct, and provide more range of expertise than the other Wired Firmware Units. They love takoyaki, and dislike riddles.";
    case ModType.RackExtension:
      return "Sakura-hīme loves being surrounded by friends. She can't buff the team much herself, but she'll always make room for one more. A larger rack is key to unlocking the full potential of the cyberdeck.";
    case ModType.SkillChip:
      return "Ken-kun lives for that moment in the spotlight. One spark and he's gone, but the mark he leaves on your heart (and your skill levels) stays forever.";
    default:
      return "";
  }
}

export const netrunFlavorText =
  "You step into cyberspace, the digital world of the net. The neon glow of data streams and the hum of ICE security surrounds you. In the moment before the connection is lost, the ICEBreakers you brought pierce the digital defense, revealing the treasure you came here for.";

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

export const MARQUEE_LINES = [
  "All information looks like noise until you break the code.",
  "The truth can no longer hide from your gaze.",
  "Open up your eyes and look at the big picture. You're all puppets of corrupt politicians and capitalists. Don't you understand, it's utterly pointless to fight each other.",
  "The sky above the port was the color of television, tuned to a dead channel.",
  "01101010 01110101 01101101 01110000 00110011 01010010 00100000 01101001 01110011 00100000 01100001 00100000 01101100 01101001 01100001 01110010",
  "未来は一本の道じゃないわ。いくつもの十字路があるの。私たち自身の手で選ぶことのできる未来が、きっとあるはずよ",
  "For you, cleverness is its own end, and once you have seen a clever way to do a thing, you must do it, as water finding a crack in a dike must pass through it.",
  "01101010 01110101 01101101 01110000 00110011 01010010 00100000 01101001 01110011 00100000 01100001 00100000 01101100 01101001 01100001 01110010",
  "We are all susceptible to the pull of viral ideas. No matter how smart we get, there is always this deep irrational part that makes us potential hosts for self-replicating information.",
  "I am a living, thinking entity that was created in the sea of information.",
  "01101010 01110101 01101101 01110000 00110011 01010010 00100000 01101001 01110011 00100000 01100001 00100000 01101100 01101001 01100001 01110010",
  "Cyberspace. A consensual hallucination experienced daily by billions. A graphic representation of data abstracted from banks of every computer in the human system. Unthinkable complexity.",
  "組織も人も、特殊化の果てにあるのは緩やかな死……それだけよ",
  "To call up a demon you must learn its name. Men dreamed that, once, but now it is real in another way. Your business is to learn the names of programs. True names.",
  "We have sealed ourselves away behind our money, growing inward, generating a seamless universe of self.",
  "01101010 01110101 01101101 01110000 00110011 01010010 00100000 01101001 01110011 00100000 01100001 00100000 01101100 01101001 01100001 01110010",
  "The advent of computers, and the subsequent accumulation of incalculable data has given rise to a new system of memory and thought parallel to your own. Humanity has underestimated the consequences of computerization.",
  "There's nothing sadder than a puppet without a ghost, especially the kind with red blood running through them.",
  "I just wanna tell you how I'm feeling Gotta make you understand Never gonna give you up Never gonna let you down Never gonna run around And desert you Never gonna make you cry Never gonna say goodbye Never gonna tell a lie And hurt you",
];
