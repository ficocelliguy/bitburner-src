import { CyberdeckEvents, CyberdeckState, hasCompleted } from "./CyberdeckState";
import { Challenges } from "@enums";
import { getCyberdeckIOPanel } from "./createModule";
import { ChallengeDetails } from "../Types";
import { romanNumeralEncoder } from "../../DarkNet/controllers/ServerGenerator";

export function completeInstalledModTutorial() {
  CyberdeckState.tutorialSteps.hasInstalledMod = true;
  checkTutorialCompletion();
}

export function completeMadeConnectionTutorial() {
  CyberdeckState.tutorialSteps.hasMadeConnection = true;
  checkTutorialCompletion();
}

export function completeChargedModuleTutorial() {
  CyberdeckState.tutorialSteps.hasChargedModule = true;
  checkTutorialCompletion();
}

export function completeCraftedIcebreakerTutorial() {
  CyberdeckState.tutorialSteps.hasCraftedIcebreaker = true;
  checkTutorialCompletion();
}

export function completeNetrunTutorial() {
  CyberdeckState.tutorialSteps.hasNetrun = true;
  checkTutorialCompletion();
}

export function hasConsumedSkillchipTutorial() {
  CyberdeckState.tutorialSteps.hasConsumedSkillchip = true;
  checkTutorialCompletion();
}

function checkTutorialCompletion() {
  if (hasCompleted(Challenges.CompletedTutorial)) {
    return;
  }
  const {
    hasInstalledMod,
    hasChargedModule,
    hasCraftedIcebreaker,
    hasNetrun,
    hasMadeConnection,
    hasConsumedSkillchip,
  } = CyberdeckState.tutorialSteps;
  CyberdeckState.completedChallenges[Challenges.CompletedTutorial] =
    hasInstalledMod &&
    hasChargedModule &&
    hasCraftedIcebreaker &&
    hasNetrun &&
    hasMadeConnection &&
    hasConsumedSkillchip;
  if (hasCompleted(Challenges.CompletedTutorial)) {
    getCyberdeckIOPanel();
  }
  CyberdeckEvents.emit();
}

/** The current cyberdeck level: the index of the first challenge (in enum order) that has not yet been completed */
export function getCyberdeckLevel(): number {
  const challenges = Object.values(Challenges);
  const level = challenges.findIndex((c) => !CyberdeckState.completedChallenges[c]);
  return level === -1 ? challenges.length : level;
}

export function getDeckMark() {
  const level = getCyberdeckLevel();
  return level ? romanNumeralEncoder(level) : "0";
}

export function getNextChallenge(): ChallengeDetails | null {
  const challenges = Object.values(ChallengeDetail);
  const nextChallenge = challenges.find((c) => !hasCompleted(c.description as Challenges));
  return nextChallenge || null;
}

export const ChallengeDetail: Record<Challenges, ChallengeDetails> = {
  [Challenges.CompletedTutorial]: {
    name: "Jack In",
    description: Challenges.CompletedTutorial,
    hint: "The checklist on the cyberdeck page will walk you through it.",
    reward: "+1 socket on the cyberdeck I/O panel",
  },
  [Challenges.Netrun80]: {
    name: "Clean Run",
    description: Challenges.Netrun80,
    hint: "Data stores are worth a lot more than plain ICE (and take less energy to crack). The further you get from where you jacked in, the more everything is worth.",
    reward: "",
  },
  [Challenges.Scrapper]: {
    name: "Scrapper",
    description: Challenges.Scrapper,
    hint: "Drag mods you don't want onto the trash can to salvage them for components.",
    reward: "",
  },
  [Challenges.Crafter]: {
    name: "Homebrew",
    description: Challenges.Crafter,
    hint: "You can get crafting cores from netrunning.",
    reward: "",
  },
  [Challenges.DaisyChain]: {
    name: "Daisy Chain",
    description: Challenges.DaisyChain,
    hint: "A charged mod passes power along to anything wired to it. Try chaining mods off of each other.",
    reward: "",
  },
  [Challenges.BombSquad]: {
    name: "Bomb Squad",
    description: Challenges.BombSquad,
    hint: "The threat level goes up as you get closer to a bomb. Flag a group with right-click.",
    reward: "",
  },
  [Challenges.FullHouse]: {
    name: "Full House",
    description: Challenges.FullHouse,
    hint: "Wires of the same color can't cross, so the order of your mods matters. A power supply can help connect mods that don't share any socket colors.",
    reward: "",
  },
  [Challenges.Supplier]: {
    name: "Supplier",
    description: Challenges.Supplier,
    hint: "Lots of activities give crafting components: crime, classes, company work, hacknet, backdoors, coding contracts...",
    reward: "",
  },
  [Challenges.Netrun120]: {
    name: "Jackpot",
    description: Challenges.Netrun120,
    hint: "Hint: you don't need to actually break the data caches immediately.",
    reward: "",
  },
  [Challenges.Overclocked]: {
    name: "Overclocked",
    description: Challenges.Overclocked,
    hint: "Buffs from charged mods stack. Find a few that all boost the same stat (and watch out for debuffs dragging it back down).",
    reward: "",
  },
  [Challenges.BigDeck]: {
    name: "Big Deck",
    description: Challenges.BigDeck,
    hint: "Rack extensions add more slots to the deck, but only while they are charged.",
    reward: "",
  },
  [Challenges.AutoWire]: {
    name: "Auto Wire",
    description: Challenges.AutoWire,
    hint: "Use ns.cyberdeck.installMod() to put a mod in the rack, then ns.cyberdeck.addConnection() to wire it up.",
    reward: "",
  },
  [Challenges.AutoRun]: {
    name: "Auto Run",
    description: Challenges.AutoRun,
    hint: "await ns.cyberdeck.netrun.move() tells you what is around you, and how much energy you have left, after every step.",
    reward: "",
  },
  [Challenges.AutoBomber]: {
    name: "Auto Bomber",
    description: Challenges.AutoBomber,
    hint: "The threat and threatCount you get back from each move change as you get closer to a bomb. Once you know where it is, ns.cyberdeck.netrun.toggleFlag() will mark it.",
    reward: "",
  },
  [Challenges.Corruption]: {
    name: "Corruption",
    description: Challenges.Corruption,
    hint: "There is a place, somewhere in the world, where the barrier is thin...",
    reward: "",
  },
  [Challenges.GlitchRun]: {
    name: "Glitch Run",
    description: Challenges.GlitchRun,
    hint: "Offline nodes spread every few steps, and touching one ends the run (and ends you).",
    reward: "",
  },
};
