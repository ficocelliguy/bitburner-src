import { CyberdeckEvents, CyberdeckState, getChargedModuleIDs, hasCompleted } from "./CyberdeckState";
import { Challenges } from "@enums";
import { getCyberdeckIOPanel } from "./createModule";
import { ChallengeDetails, DeckMod } from "../Types";
import { romanNumeralEncoder } from "../../DarkNet/controllers/ServerGenerator";
import { NetrunningState } from "./NetrunningState";
import { getCurrentRackSize } from "../utils/moduleUtilities";

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

export function completeNetrunChallenges() {
  CyberdeckState.tutorialSteps.hasNetrun = true;
  checkTutorialCompletion();

  if (NetrunningState.rewardScore > 80) {
    CyberdeckState.completedChallenges[Challenges.Netrun80] = true;
  }
  if (NetrunningState.rewardScore > 100 && !NetrunningState.hasMadeManualMove) {
    if (NetrunningState.corrupted) {
      CyberdeckState.completedChallenges[Challenges.GlitchRun] = true;
    } else if (!hasCompleted(Challenges.AutoRun)) {
      CyberdeckState.completedChallenges[Challenges.AutoRun] = true;
      CyberdeckState.netrunningCooldownLevel += 2;
    }
  }

  if (NetrunningState.rewardScore > 120 && !hasCompleted(Challenges.Netrun120)) {
    CyberdeckState.completedChallenges[Challenges.Netrun120] = true;
    CyberdeckState.netrunningLevel += 2;
  }
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

export function checkScrapperChallenge() {
  CyberdeckState.salvagedMods++;
  if (CyberdeckState.salvagedMods >= 5 && !hasCompleted(Challenges.Scrapper)) {
    CyberdeckState.completedChallenges[Challenges.Scrapper] = true;
    CyberdeckEvents.emit();
  }
}

export function checkCrafterChallenge() {
  CyberdeckState.craftedMods++;
  if (CyberdeckState.craftedMods >= 5 && !hasCompleted(Challenges.Crafter)) {
    CyberdeckState.completedChallenges[Challenges.Crafter] = true;
    CyberdeckEvents.emit();
  }
}

export function checkConnectionChallenges(sourceMod: DeckMod, destinationMod: DeckMod) {
  if (sourceMod.id !== getCyberdeckIOPanel().id && destinationMod.id !== getCyberdeckIOPanel().id) {
    completeMadeConnectionTutorial();
  }

  if (!hasCompleted(Challenges.FullHouse) && getChargedModuleIDs().length === getCurrentRackSize()) {
    CyberdeckState.completedChallenges[Challenges.FullHouse] = true;
    CyberdeckState.modStorageSize += 2;
    CyberdeckEvents.emit();
  }

  if (hasCompleted(Challenges.DaisyChain)) {
    return;
  }

  const deck = getCyberdeckIOPanel().id;
  const connectedToIOPanel = CyberdeckState.connections
    .filter(([source, destination]) => source.modId === deck || destination.modId === deck)
    .map(([source, destination]) => (source.modId === deck ? destination.modId : source.modId));
  const oneHopFromIoPanel = CyberdeckState.connections
    .filter(
      ([source, destination]) =>
        connectedToIOPanel.includes(source.modId) || connectedToIOPanel.includes(destination.modId),
    )
    .map(([source, destination]) => (connectedToIOPanel.includes(source.modId) ? destination.modId : source.modId));
  const twoHopsFromIoPanel = CyberdeckState.connections
    .filter(
      ([source, destination]) =>
        oneHopFromIoPanel.includes(source.modId) || oneHopFromIoPanel.includes(destination.modId),
    )
    .map(([source, destination]) => (oneHopFromIoPanel.includes(source.modId) ? destination.modId : source.modId));

  if (twoHopsFromIoPanel.length) {
    CyberdeckState.completedChallenges[Challenges.DaisyChain] = true;
    CyberdeckState.netrunningLevel += 2;
    CyberdeckEvents.emit();
  }
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
    reward: "+1 deck I/O panel socket",
  },
  [Challenges.Scrapper]: {
    name: "Scrapper",
    description: Challenges.Scrapper,
    hint: "Drag mods you don't want onto the trash can to salvage them for components.",
    reward: "Extra components gained when recycling mods",
  },
  [Challenges.Netrun80]: {
    name: "Clean Run",
    description: Challenges.Netrun80,
    hint: "The further you get from where you jacked in, the more everything is worth.",
    reward: "Reduced netrun battery usage",
  },
  [Challenges.Crafter]: {
    name: "Homebrew",
    description: Challenges.Crafter,
    hint: "You can get crafting cores from netrunning.",
    reward: "Increased chance of crafting cores from netrunning",
  },
  [Challenges.DaisyChain]: {
    name: "Daisy Chain",
    description: Challenges.DaisyChain,
    hint: "A charged mod passes power along to anything wired to it. Try chaining mods off of each other.",
    reward: "+2 netrunning level",
  },
  [Challenges.BombSquad]: {
    name: "Bomb Squad",
    description: Challenges.BombSquad,
    hint: "The threat level goes up as you get closer to an active countermeasure. Flag a group with right-click.",
    reward: "Reduced energy loss from triggering an active countermeasure",
  },
  [Challenges.FullHouse]: {
    name: "Full House",
    description: Challenges.FullHouse,
    hint: "Wires of the same color can't cross, so the order of your mods matters. A power supply can help connect mods that don't share any socket colors.",
    reward: "+2 mod storage size",
  },
  [Challenges.Supplier]: {
    name: "Supplier",
    description: Challenges.Supplier,
    hint: "Lots of activities give crafting components: crime, classes, company work, hacknet, backdoors, coding contracts...",
    reward: "+2 cyberdeck crafting level", // TODO-fico
  },
  [Challenges.Netrun120]: {
    name: "Jackpot",
    description: Challenges.Netrun120,
    hint: "Hint: you don't need to actually break the data caches immediately.",
    reward: "+2 netrunning level", // TODO-fico
  },
  [Challenges.Overclocked]: {
    name: "Overclocked",
    description: Challenges.Overclocked,
    hint: "Buffs from charged mods stack. Find a few that all boost the same stat (and watch out for debuffs dragging it back down).",
    reward: "Reduced level of debuffs on new mods", // TODO-fico
  },
  [Challenges.BigDeck]: {
    name: "Big Deck",
    description: Challenges.BigDeck,
    hint: "Rack extensions add more slots to the deck, but only while they are charged.",
    reward: "+1 to rack extension limit", // TODO-fico
  },
  [Challenges.AutoWire]: {
    name: "Auto Wire",
    description: Challenges.AutoWire,
    hint: "Use ns.cyberdeck.installMod() to put a mod in the rack, then ns.cyberdeck.addConnection() to wire it up.",
    reward: "10% increase in effect of mods connected directly to the cyberdeck I/O panel", // TODO-fico
  },
  [Challenges.AutoRun]: {
    name: "Auto Run",
    description: Challenges.AutoRun,
    hint: "await ns.cyberdeck.netrun.move() tells you what is around you, and how much energy you have left, after every step.",
    reward: "+2 netrun cooldown reduction level",
  },
  [Challenges.AutoBomber]: {
    name: "Auto Bomber",
    description: Challenges.AutoBomber,
    hint: "The threat and threatCount you get back from each move change as you get closer to a bomb. Once you know where it is, ns.cyberdeck.netrun.toggleFlag() will mark it.",
    reward: "Increased size of safe starting area when netrunning", // TODO-fico
  },
  [Challenges.Corruption]: {
    name: "Corruption",
    description: Challenges.Corruption,
    hint: "There is a place, somewhere in the world, where the barrier is thin...",
    reward: "Access to the cyberdeck legacy API",
  },
  [Challenges.GlitchRun]: {
    name: "Glitch Run",
    description: Challenges.GlitchRun,
    hint: "Offline nodes spread every few steps, and touching one ends the run (and ends you).",
    reward: "+1 socket on the cyberdeck I/O panel",
  },
};
