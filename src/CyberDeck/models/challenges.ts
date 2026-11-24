import {
  CyberdeckEvents,
  CyberdeckState,
  getChargedModuleIDs,
  getChargedModules,
  hasCompleted,
} from "./CyberdeckState";
import { Challenges, ModType } from "@enums";
import { getCyberdeckIOPanel } from "./createModule";
import { ChallengeDetails, DeckMod } from "../Types";
import { romanNumeralEncoder } from "../../utils/StringHelperFunctions";
import { NetrunningState } from "./NetrunningState";
import { getCurrentRackSize } from "../utils/moduleUtilities";
import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";
import { getCurrentNetrunningIceCost } from "./netrunRewards";

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

export function checkModCreationChallenges(mod: DeckMod) {
  if (
    mod.rarity >= 5 &&
    !CyberdeckState.completedChallenges[Challenges.StrikeGold] &&
    hasCompleted(Challenges.LevelUp)
  ) {
    CyberdeckState.completedChallenges[Challenges.StrikeGold] = true;
    CyberdeckState.components.iceBreakers += 100;
  }
  if (mod.rarity >= 10 && !hasCompleted(Challenges.Connoisseur) && hasCompleted(Challenges.Impatient)) {
    CyberdeckState.completedChallenges[Challenges.Connoisseur] = true;
  }
}

export function completeNetrunChallenges() {
  CyberdeckState.tutorialSteps.hasNetrun = true;
  checkTutorialCompletion();

  if (
    !NetrunningState.steps &&
    !NetrunningState.hasMadeManualMove &&
    !CyberdeckState.completedChallenges[Challenges.AutoRun] &&
    hasCompleted(Challenges.AutoWire)
  ) {
    CyberdeckState.completedChallenges[Challenges.AutoRun] = true;
    CyberdeckState.components.iceBreakers += 100;
  }
  if (NetrunningState.rewardScore >= 80) {
    CyberdeckState.completedChallenges[Challenges.CleanRun] = true;
  }
  if (NetrunningState.rewardScore >= 100 && !NetrunningState.hasMadeManualMove) {
    if (NetrunningState.corrupted && hasCompleted(Challenges.ArcHazard)) {
      CyberdeckState.completedChallenges[Challenges.GlitchRun] = true;
    } else if (!CyberdeckState.completedChallenges[Challenges.ScriptedWin] && hasCompleted(Challenges.Overclocked)) {
      CyberdeckState.completedChallenges[Challenges.ScriptedWin] = true;
      CyberdeckState.netrunningCooldownLevel += 4;
    }
  }

  if (
    NetrunningState.rewardScore >= 120 &&
    hasCompleted(Challenges.Supplier) &&
    !CyberdeckState.completedChallenges[Challenges.Jackpot]
  ) {
    CyberdeckState.completedChallenges[Challenges.Jackpot] = true;
    CyberdeckState.netrunningLevel += 4;
  }

  const flaggedBombs = NetrunningState.grid.flat().filter((e) => e.flagged && e.hasBomb && !e.hits);
  if (flaggedBombs.length && !CyberdeckState.completedChallenges[Challenges.BombSquad]) {
    CyberdeckState.completedChallenges[Challenges.BombSquad] = true;
  }
  if (
    flaggedBombs.length &&
    !NetrunningState.hasMadeManualMove &&
    !CyberdeckState.completedChallenges[Challenges.AutoBomber] &&
    hasCompleted(Challenges.ScriptedWin)
  ) {
    CyberdeckState.completedChallenges[Challenges.AutoBomber] = true;
  }
}

export function checkSkillchipChallenges() {
  CyberdeckState.tutorialSteps.hasConsumedSkillchip = true;
  checkTutorialCompletion();

  if (!CyberdeckState.completedChallenges[Challenges.LevelUp] && CyberdeckState.netrunningLevel >= 3) {
    CyberdeckState.completedChallenges[Challenges.LevelUp] = true;
  }
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
  if (CyberdeckState.craftedMods >= 5 && !hasCompleted(Challenges.Homebrew)) {
    CyberdeckState.completedChallenges[Challenges.Homebrew] = true;
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
  checkElectricianChallenge();

  if (
    !CyberdeckState.completedChallenges[Challenges.FullHouse] &&
    getChargedModuleIDs().length === getCurrentRackSize() + 1
  ) {
    CyberdeckState.completedChallenges[Challenges.FullHouse] = true;
    CyberdeckState.modStorageSize += 2;
    CyberdeckEvents.emit();
  }

  if (hasCompleted(Challenges.DaisyChain) && hasCompleted(Challenges.ArcHazard)) {
    return;
  }

  const depth = getMaxDepthOfConnections();
  if (depth >= 3 && hasCompleted(Challenges.ShortBus) && !CyberdeckState.completedChallenges[Challenges.DaisyChain]) {
    CyberdeckState.completedChallenges[Challenges.DaisyChain] = true;
    CyberdeckState.netrunningLevel += 2;
    CyberdeckEvents.emit();
  }
  if (depth >= 6 && !CyberdeckState.completedChallenges[Challenges.ArcHazard] && hasCompleted(Challenges.AutoBomber)) {
    CyberdeckState.completedChallenges[Challenges.ArcHazard] = true;
    CyberdeckEvents.emit();
  }
}

/** The number of jumps from the I/O panel to the furthest charged mod */
function getMaxDepthOfConnections(): number {
  const panelId = getCyberdeckIOPanel().id;
  const depths = new Map<string, number>([[panelId, 0]]);
  const queue = [panelId];
  let maxDepth = 0;

  for (const moduleId of queue) {
    const depth = depths.get(moduleId) ?? 0;
    const connections = CyberdeckState.connections.filter(
      ([source, destination]) => source.modId === moduleId || destination.modId === moduleId,
    );
    for (const [source, destination] of connections) {
      const neighborId = source.modId === moduleId ? destination.modId : source.modId;
      if (depths.has(neighborId)) continue;
      depths.set(neighborId, depth + 1);
      maxDepth = Math.max(maxDepth, depth + 1);
      queue.push(neighborId);
    }
  }
  return maxDepth;
}

export function checkComponentSourceChallenges() {
  const uniqueComponentSourceCount = getUniqueComponentSourceCount();
  if (!CyberdeckState.completedChallenges[Challenges.Supplier] && uniqueComponentSourceCount >= 8) {
    CyberdeckState.completedChallenges[Challenges.Supplier] = true;
    CyberdeckState.craftingLevel += 4;
    CyberdeckEvents.emit();
  }
  if (hasCompleted(Challenges.Electrician) && !hasCompleted(Challenges.Collector) && uniqueComponentSourceCount >= 12) {
    CyberdeckState.completedChallenges[Challenges.Collector] = true;
  }
}

export function getUniqueComponentSourceCount() {
  const { rom, chips, neurodes } = CyberdeckState.componentStats;
  const romSourceCount = +!!rom.backdoors + +!!rom.mods + +!!rom.caches + +!!rom.programs + +!!rom.pettyCrime;
  const chipsSourceCount = +!!chips.hacknet + +!!chips.companyWork + +!!chips.IPvGO + +!!chips.mods;
  const neurodesSourceCount =
    +!!neurodes.kills + +!!neurodes.class + +!!neurodes.codingContracts + +!!neurodes.cortexShare + +!!neurodes.mods;
  return romSourceCount + chipsSourceCount + neurodesSourceCount;
}

export function checkOverclockedChallenge() {
  if (hasCompleted(Challenges.Overclocked) || !hasCompleted(Challenges.BigDeck)) {
    // TODO-Fico: also limit this if you are not in endgame
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

  if (getCurrentRackSize() >= 7) {
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

export function checkElectricianChallenge() {
  const chargedPowerSupplies = getChargedModules().filter((m) => m.type == ModType.PowerSupply);
  const connectionCounts = chargedPowerSupplies.map((ps) => {
    const connections = CyberdeckState.connections
      .filter(
        ([source, destination]) =>
          (source.modId === ps.id && destination.modId !== getCyberdeckIOPanel().id) ||
          (destination.modId === ps.id && source.modId !== getCyberdeckIOPanel().id),
      )
      .flatMap(([source, destination]) => [source.modId, destination.modId])
      .filter((id) => id !== ps.id && id !== getCyberdeckIOPanel().id);
    return new Set(connections).size;
  });

  if (connectionCounts.some((c) => c >= 2)) {
    CyberdeckState.completedChallenges[Challenges.ShortBus] = true;
  }
  if (
    hasCompleted(Challenges.GlitchRun) &&
    !CyberdeckState.completedChallenges[Challenges.Electrician] &&
    connectionCounts.some((c) => c >= 4)
  ) {
    CyberdeckState.completedChallenges[Challenges.Electrician] = true;
    CyberdeckState.craftingLevel += 4;
  }
}

export function checkAutoWireChallenge(mod: DeckMod) {
  if (!hasCompleted(Challenges.AutoWire) && getChargedModuleIDs().includes(mod.id)) {
    CyberdeckState.completedChallenges[Challenges.AutoWire] = true;
    CyberdeckEvents.emit();
  }
}

export function checkImpatientChallenge(corrupted: boolean) {
  const currentCost = getCurrentNetrunningIceCost(corrupted);
  if (
    CyberdeckState.lastNetrunningTimestamp &&
    !CyberdeckState.completedChallenges[Challenges.ColdTrail] &&
    currentCost < 11
  ) {
    CyberdeckState.completedChallenges[Challenges.ColdTrail] = true;
    CyberdeckState.netrunningCooldownLevel += 2;
  }

  if (
    hasCompleted(Challenges.Collector) &&
    !CyberdeckState.completedChallenges[Challenges.Impatient] &&
    currentCost > 999
  ) {
    CyberdeckState.completedChallenges[Challenges.Impatient] = true;
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
    // Complete the tutorial
    description: Challenges.CompletedTutorial,
    hint: "The checklist on the cyberdeck page will walk you through it.",
    reward: "+1 socket on the cyberdeck I/O panel",
  },
  [Challenges.Scrapper]: {
    name: "Scrapper",
    // Salvage 5 mods
    description: Challenges.Scrapper,
    hint: "Drag mods you don't want onto the trash can to salvage them for components.",
    reward: "Extra components gained when recycling mods",
  },
  [Challenges.CleanRun]: {
    name: "Clean Run",
    // Get a score of 80+ while netrunning
    description: Challenges.CleanRun,
    hint: "The further you get from where you jacked in, the more everything is worth.",
    reward: "Reduced netrun battery usage",
  },
  [Challenges.Homebrew]: {
    name: "Homebrew",
    // Craft 5 mods
    description: Challenges.Homebrew,
    hint: "You can get crafting cores from netrunning.",
    reward: "Increased chance of crafting cores from netrunning",
  },
  [Challenges.LevelUp]: {
    name: "Level Up",
    // Gain a netrunning level of 3, for improved mod drops
    description: Challenges.LevelUp,
    hint: "Omnia Cybersystems is known for their skillchips that can boost netrunning level.",
    reward: "10% higher skillchip stats",
  },
  [Challenges.StrikeGold]: {
    name: "Strike Gold",
    // Find a rarity five mod
    description: Challenges.StrikeGold,
    hint: "Keep boosting your netrunning level to improve your odds. Or just get lucky out there, runner.",
    reward: "100 ICEBreakers",
  },
  [Challenges.ShortBus]: {
    name: "Short Bus",
    // Charge 2 mods from the same power supply
    description: Challenges.ShortBus,
    hint: "Power supplies don't make power, but they are very good at distributing it to multiple mods.",
    reward: "5% increased extra socket chance on power supplies",
  },
  [Challenges.DaisyChain]: {
    name: "Daisy Chain",
    // Charge a mod that is 3+ jumps away from the deck
    description: Challenges.DaisyChain,
    hint: "A charged mod passes power along to anything wired to it. Try chaining mods off of each other.",
    reward: "+2 netrunning level",
  },
  [Challenges.ColdTrail]: {
    name: "Cold Trail",
    // Start a netrun with the hostile trace fully decayed
    description: Challenges.ColdTrail,
    hint: "Right after a run, security is a bit on edge. Give it some time to settle down, so you can save on ICEBreakers.",
    reward: "+2 netrun cooldown reduction level",
  },
  [Challenges.BombSquad]: {
    name: "Bomb Squad",
    // Flag ICE with an active countermeasure, and finish the run
    description: Challenges.BombSquad,
    hint: "The threat level goes up as you get closer to an active countermeasure. Flag a group with right-click.",
    reward: "Reduced energy loss from triggering an active countermeasure",
  },
  [Challenges.FullHouse]: {
    name: "Full House",
    // Have a charged mod in every rack slot
    description: Challenges.FullHouse,
    hint: "Wires of the same color can't cross, so the order of your mods matters. A power supply can help connect mods that don't share any socket colors.",
    reward: "+2 mod storage size",
  },
  [Challenges.Supplier]: {
    name: "Supplier",
    // Get crafting components from 8 unique sources
    description: Challenges.Supplier,
    hint: "Lots of activities give crafting components: crime, classes, company work, hacknet, backdoors, coding contracts...",
    reward: "+4 cyberdeck crafting level",
  },
  [Challenges.Jackpot]: {
    name: "Jackpot",
    // Get a score of 120+ while netrunning
    description: Challenges.Jackpot,
    hint: "Hint: you don't need to actually break the data caches immediately.",
    reward: "+4 netrunning level",
  },
  [Challenges.AutoWire]: {
    name: "Auto Wire",
    // Charge a mod via the API
    description: Challenges.AutoWire,
    hint: "Use ns.cyberdeck.installMod() to put a mod in the rack, then ns.cyberdeck.addConnection() to wire it up.",
    reward: "+1 to rack extension limit",
  },
  [Challenges.AutoRun]: {
    name: "Auto Run",
    // Complete a netrun using only the API
    description: Challenges.AutoRun,
    hint: "Check out ns.cyberdeck.netrun: .start(), await .move(), and .finish()",
    reward: "100 ICEBreakers",
  },
  [Challenges.BigDeck]: {
    name: "Big Deck",
    // Have 7 total rack slots
    description: Challenges.BigDeck,
    hint: "Rack extensions add more slots to the deck, but only while they are charged.",
    reward: "+1 socket on the cyberdeck I/O panel",
  },

  // Endgame-only achievements:

  [Challenges.Overclocked]: {
    name: "Overclocked",
    // Get a 50% bonus in a single stat
    description: Challenges.Overclocked,
    hint: "Buffs from charged mods stack. Find a few that all boost the same stat (and watch out for debuffs dragging it back down).",
    reward: "Reduced level of debuffs on new mods",
  },
  [Challenges.ScriptedWin]: {
    name: "Scripted Win",
    // Get a score of 100+ using only the API
    description: Challenges.ScriptedWin,
    hint: "await ns.cyberdeck.netrun.move() tells you what is around you, and how much energy you have left, after every step.",
    reward: "+4 netrun cooldown reduction level",
  },
  [Challenges.AutoBomber]: {
    name: "Auto Bomber",
    // Flag ICE with an active countermeasure and finish the run with only the API
    description: Challenges.AutoBomber,
    hint: "The threat and threatCount you get back from each move change as you get closer to a bomb. Once you know where it is, ns.cyberdeck.netrun.toggleFlag() will mark it.",
    reward: "Increased size of safe starting area when netrunning",
  },
  [Challenges.ArcHazard]: {
    name: "Arc Hazard",
    // Charge a mod that is 6+ jumps away from the deck
    description: Challenges.ArcHazard,
    hint: "The homebrewed mods you have wired together are starting to look not quite up to up to fire code.",
    reward: "+1 to rack extension limit",
  },
  [Challenges.Corruption]: {
    name: "Corruption",
    // Install a corrupted mod from the glitch
    description: Challenges.Corruption,
    hint: "There is a place, somewhere in the world, where the barrier is thin...",
    reward: "Access to the cyberdeck legacy API",
  },
  [Challenges.GlitchRun]: {
    name: "Glitch Run",
    // Get a score of 100+ at the glitch using only the API
    description: Challenges.GlitchRun,
    hint: "Offline nodes spread every few steps, and touching one ends the run (and ends you).",
    reward: "+1 socket on the cyberdeck I/O panel",
  },
  [Challenges.Electrician]: {
    name: "Electrician",
    // Charge 4 mods from the same power supply
    description: Challenges.Electrician,
    hint: "Is this thing even safe to hold anymore?",
    reward: "+4 cyberdeck crafting level",
  },
  [Challenges.Collector]: {
    name: "Collector",
    // Get crafting components from 12 unique sources
    description: Challenges.Collector,
    hint: "Netrunning doesn't count for this - runners have to be a jack of all trades to succeed out here.",
    reward: "20% boosted component production from focusable activities",
  },
  [Challenges.Impatient]: {
    name: "Impatient",
    // Start a netrun that costs at least 1000 ICEBreakers
    description: Challenges.Impatient,
    hint: "You can't take it with you, so spend it like you stole it!",
    reward: "+4 netrun cooldown reduction level",
  },
  [Challenges.Connoisseur]: {
    name: "Connoisseur",
    // Find a rarity ten mod
    description: Challenges.Connoisseur,
    hint: "Only the highest-level netrunners will ever see a mod of this rarity...",
    reward: "+1 to rack extension limit",
  },
};

export function getChallengeStatus() {
  const c = CyberdeckState.completedChallenges;
  return {
    CompletedTutorial: c[Challenges.CompletedTutorial] || false,
    Scrapper: c[Challenges.Scrapper] || false,
    CleanRun: c[Challenges.CleanRun] || false,
    Homebrew: c[Challenges.Homebrew] || false,
    LevelUp: c[Challenges.LevelUp] || false,
    StrikeGold: c[Challenges.StrikeGold] || false,
    ShortBus: c[Challenges.ShortBus] || false,
    DaisyChain: c[Challenges.DaisyChain] || false,
    ColdTrail: c[Challenges.ColdTrail] || false,
    BombSquad: c[Challenges.BombSquad] || false,
    FullHouse: c[Challenges.FullHouse] || false,
    Supplier: c[Challenges.Supplier] || false,
    Jackpot: c[Challenges.Jackpot] || false,
    AutoWire: c[Challenges.AutoWire] || false,
    AutoRun: c[Challenges.AutoRun] || false,
    Overclocked: c[Challenges.Overclocked] || false,
    BigDeck: c[Challenges.BigDeck] || false,
    ScriptedWin: c[Challenges.ScriptedWin] || false,
    AutoBomber: c[Challenges.AutoBomber] || false,
    ArcHazard: c[Challenges.ArcHazard] || false,
    Corruption: c[Challenges.Corruption] || false,
    GlitchRun: c[Challenges.GlitchRun] || false,
    Electrician: c[Challenges.Electrician] || false,
    Collector: c[Challenges.Collector] || false,
    Impatient: c[Challenges.Impatient] || false,
    Connoisseur: c[Challenges.Connoisseur] || false,
  };
}
