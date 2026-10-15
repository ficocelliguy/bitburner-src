import { CyberdeckEvents, CyberdeckState, getChargedModuleIDs, hasCompleted } from "./CyberdeckState";
import { Challenges } from "@enums";
import { getCyberdeckIOPanel } from "./createModule";
import { ChallengeDetails, DeckMod } from "../Types";
import { romanNumeralEncoder } from "../../DarkNet/controllers/ServerGenerator";
import { NetrunningState } from "./NetrunningState";
import { getCurrentRackSize } from "../utils/moduleUtilities";
import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";

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

  if (NetrunningState.rewardScore >= 80) {
    CyberdeckState.completedChallenges[Challenges.Netrun80] = true;
  }
  if (NetrunningState.rewardScore >= 100 && !NetrunningState.hasMadeManualMove) {
    if (NetrunningState.corrupted) {
      CyberdeckState.completedChallenges[Challenges.GlitchRun] = true;
    } else if (!hasCompleted(Challenges.AutoRun)) {
      CyberdeckState.completedChallenges[Challenges.AutoRun] = true;
      CyberdeckState.netrunningCooldownLevel += 2;
    }
  }

  if (NetrunningState.rewardScore >= 120 && !hasCompleted(Challenges.Netrun120)) {
    CyberdeckState.completedChallenges[Challenges.Netrun120] = true;
    CyberdeckState.netrunningLevel += 2;
  }

  const flaggedBombs = NetrunningState.grid.flat().filter((e) => e.flagged && e.hasBomb);
  if (flaggedBombs.length && !hasCompleted(Challenges.BombSquad)) {
    CyberdeckState.completedChallenges[Challenges.BombSquad] = true;
    CyberdeckState.netrunningLevel += 2;
  }
  if (flaggedBombs.length && !NetrunningState.hasMadeManualMove && !hasCompleted(Challenges.AutoBomber)) {
    CyberdeckState.completedChallenges[Challenges.AutoBomber] = true;
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

  checkOverclockedChallenge();
  checkBigDeckChallenge();
  checkCorruptionChallenge();

  if (!hasCompleted(Challenges.FullHouse) && getChargedModuleIDs().length === getCurrentRackSize() + 1) {
    CyberdeckState.completedChallenges[Challenges.FullHouse] = true;
    CyberdeckState.modStorageSize += 2;
    CyberdeckEvents.emit();
  }

  if (hasCompleted(Challenges.DaisyChain) && hasCompleted(Challenges.DaisierChain)) {
    return;
  }

  function getMaxDepthOfConnections(
    modId = getCyberdeckIOPanel().id,
    depth = 0,
    visited: Set<string> = new Set(),
  ): number {
    if (visited.has(modId)) {
      return depth;
    }
    visited.add(modId);
    const connectedMods = CyberdeckState.connections
      .filter(([m1, m2]) => m1.modId === modId || m2.modId === modId)
      .map(([m1, m2]) => (m1.modId === modId ? m2.modId : m1.modId));
    if (connectedMods.length === 0) {
      return depth;
    }
    return Math.max(...connectedMods.map((mod) => getMaxDepthOfConnections(mod, depth + 1, visited)));
  }
  const depth = getMaxDepthOfConnections();
  if (depth >= 3 && !hasCompleted(Challenges.DaisyChain)) {
    CyberdeckState.completedChallenges[Challenges.DaisyChain] = true;
    CyberdeckState.netrunningLevel += 2;
    CyberdeckEvents.emit();
  }
  if (depth >= 6 && hasCompleted(Challenges.DaisierChain)) {
    CyberdeckState.completedChallenges[Challenges.DaisierChain] = true;
    CyberdeckEvents.emit();
  }
}

export function checkSupplierChallenge() {
  if (hasCompleted(Challenges.Supplier)) {
    return;
  }

  const { rom, chips, neurodes } = CyberdeckState.componentStats;
  const romSourceCount = +!!rom.backdoors + +!!rom.mods + +!!rom.caches + +!!rom.programs + +!!rom.pettyCrime;
  const chipsSourceCount = +!!chips.hacknet + +!!chips.companyWork + +!!chips.IPvGO + +!!chips.mods;
  const neurodesSourceCount =
    +!!neurodes.kills + +!!neurodes.class + +!!neurodes.codingContracts + +!!neurodes.cortexShare + +!!neurodes.mods;

  if (romSourceCount + chipsSourceCount + neurodesSourceCount >= 5) {
    CyberdeckState.completedChallenges[Challenges.Supplier] = true;
    CyberdeckState.craftingLevel += 2;
    CyberdeckEvents.emit();
  }
}

export function checkOverclockedChallenge() {
  if (hasCompleted(Challenges.Overclocked)) {
    return;
  }

  const stats = getCyberdeckStatBonuses();
  const playerBuffOverThreshold = Object.values(stats.playerMults).some((stat) => stat > 0.5);
  const endgameBuffOverThreshold = Object.values(stats.endgameMults).some((stat) => stat > 0.5);
  if (playerBuffOverThreshold || endgameBuffOverThreshold) {
    CyberdeckState.completedChallenges[Challenges.Overclocked] = true;
    CyberdeckEvents.emit();
  }
}

export function checkBigDeckChallenge() {
  if (hasCompleted(Challenges.BigDeck)) {
    return;
  }

  if (getCurrentRackSize() >= 9) {
    CyberdeckState.completedChallenges[Challenges.BigDeck] = true;
    CyberdeckEvents.emit();
  }
}

export function checkCorruptionChallenge() {
  if (hasCompleted(Challenges.Corruption)) {
    return;
  }

  if (CyberdeckState.installedModules.some((mod) => mod.corrupted)) {
    CyberdeckState.completedChallenges[Challenges.Corruption] = true;
    CyberdeckEvents.emit();
  }
}

export function checkAutoWireChallenge(mod: DeckMod) {
  if (!hasCompleted(Challenges.AutoWire) && getChargedModuleIDs().includes(mod.id)) {
    CyberdeckState.completedChallenges[Challenges.AutoWire] = true;
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
    reward: "+2 cyberdeck crafting level",
  },
  [Challenges.Netrun120]: {
    name: "Jackpot",
    description: Challenges.Netrun120,
    hint: "Hint: you don't need to actually break the data caches immediately.",
    reward: "+2 netrunning level",
  },
  [Challenges.Overclocked]: {
    name: "Overclocked",
    description: Challenges.Overclocked,
    hint: "Buffs from charged mods stack. Find a few that all boost the same stat (and watch out for debuffs dragging it back down).",
    reward: "Reduced level of debuffs on new mods",
  },
  [Challenges.AutoWire]: {
    name: "Auto Wire",
    description: Challenges.AutoWire,
    hint: "Use ns.cyberdeck.installMod() to put a mod in the rack, then ns.cyberdeck.addConnection() to wire it up.",
    reward: "10% increase in effect of mods connected directly to the cyberdeck I/O panel", // TODO-fico
  },
  [Challenges.BigDeck]: {
    name: "Big Deck",
    description: Challenges.BigDeck,
    hint: "Rack extensions add more slots to the deck, but only while they are charged.",
    reward: "+1 to rack extension limit",
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
    reward: "Increased size of safe starting area when netrunning",
  },
  [Challenges.DaisierChain]: {
    name: "Arc Hazard",
    description: Challenges.DaisierChain,
    hint: "The homebrewed mods you have wired together are starting to look not quite up to up to fire code.",
    reward: "+1 to rack extension limit",
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
