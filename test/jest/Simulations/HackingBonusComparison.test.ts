/**
 * Six-hour "fresh bitnode" simulations comparing how much hacking level Stanek's Gift, IPvGO, and the cyberdeck give.
 *
 * Every scenario runs on the real game code: Player multipliers/skills, the real server list, the hacking/grow/weaken
 * formulas, Stanek's charge() + effect(), the IPvGO effect formula, and the cyberdeck's mod generation, netrun minigame,
 * crafting, salvage, wiring rules and component sources. The player's economy (a shotgun batcher whose income is spent
 * on RAM) is modelled analytically on top of those formulas.
 *
 * Not part of the normal test suite: jest.config.js skips this folder unless SIM_RUN=1.
 * Run with:  SIM_RUN=1 SIM_OUT_DIR=<dir> npx jest test/jest/Simulations/HackingBonusComparison
 * Results are written to <dir>/hacking-bonus-sim.json (defaults to ./sim-output).
 *
 * To run scenarios in parallel, use the launcher instead: node test/jest/Simulations/runParallel.js --help
 * It runs one jest process per scenario/seed, filtered with these env vars, and merges the results:
 *   SIM_SCENARIOS  comma-separated scenario kinds to run (default: all)
 *   SIM_SEEDS      comma-separated seeds to run (default: each scenario's own seeds)
 *   SIM_RESULTS_FILE  results file name inside SIM_OUT_DIR (default: hacking-bonus-sim.json)
 *   SIM_PROGRESS_APPEND=1  append to the progress log instead of clearing it
 *   SIM_TAG        label prefixed to this process's progress lines
 *   SIM_HOURS      simulated hours per run (default: 6)
 */
import fs from "fs";
import os from "os";
import _ from "lodash";
import path from "path";
import { Player } from "@player";
import { setupBasicTestingEnvironment, initGameEnvironment } from "../Utilities";
import { GetAllServers } from "../../../src/Server/AllServers";
import { Server } from "../../../src/Server/Server";
import {
  calculateHackingChance,
  calculateHackingExpGain,
  calculateHackingTime,
  calculateGrowTime,
  calculateWeakenTime,
  calculatePercentMoneyHacked,
} from "../../../src/Hacking";
import { numCycleForGrowthCorrected } from "../../../src/Server/ServerHelpers";
import { getCloudServerCost } from "../../../src/Server/ServerPurchases";
import { DarkWebItems } from "../../../src/DarkWeb/DarkWebItems";
import { CompletedProgramName } from "../../../src/Programs/Enums";
import { Programs } from "../../../src/Programs/Programs";
import { staneksGift } from "../../../src/CotMG/Helper";
import { StaneksGift } from "../../../src/CotMG/StaneksGift";
import { Fragments, FragmentById } from "../../../src/CotMG/Fragment";
import { FragmentTypeEnum } from "../../../src/CotMG/FragmentType";
import type { FragmentType } from "@nsdefs";
import { Go } from "../../../src/Go/Go";
import { newOpponentStats, opponentDetails } from "../../../src/Go/Constants";
import { getDifficultyMultiplier, getWinstreakMultiplier } from "../../../src/Go/effects/effect";
import { GoOpponent, CompanyName, JobName, LocationName, UniversityClassType } from "@enums";
import { CyberdeckState, getChargedModuleIDs, getRackExtensionCap } from "../../../src/CyberDeck/models/CyberdeckState";
import { gainCyberdeck } from "../../../src/CyberDeck/models/cyberdeckServer";
import { processCyberdeckComponentGains } from "../../../src/CyberDeck/models/componentEconomy";
import {
  canAffordComponentCost,
  craftICEBreaker,
  craftPowerSupply,
  craftProcessingModule,
  craftUplink,
  disassembleModule,
  getCyberdeckIOPanel,
  moduleStorageAvailable,
} from "../../../src/CyberDeck/models/createModule";
import { createConnection, moveModule } from "../../../src/CyberDeck/models/moduleMutation";
import { getCurrentRackSize } from "../../../src/CyberDeck/utils/moduleUtilities";
import { calculateSkill } from "../../../src/PersonObjects/formulas/skill";
import { currentNodeMults } from "../../../src/BitNode/BitNodeMultipliers";
import {
  checkAutoWireChallenge,
  checkSupplierChallenge,
  completeCraftedIcebreakerTutorial,
  getCyberdeckLevel,
} from "../../../src/CyberDeck/models/challenges";
import {
  gainCyberdeckChipsFromIPvGO,
  gainCyberdeckComponentsFromCCT,
  gainCyberdeckComponentsFromNukeOrBackdoor,
} from "../../../src/CyberDeck/effects";
import {
  getCurrentNetrunningIceCost,
  minimumNetrunCost,
  netrunRewards,
} from "../../../src/CyberDeck/models/netrunRewards";
import {
  flagEntity,
  getThreatSignalStrength,
  initNetrunGrid,
  move,
} from "../../../src/CyberDeck/models/netrunningMinigame";
import { NETRUNNING_HEIGHT, NETRUNNING_WIDTH, NetrunningState } from "../../../src/CyberDeck/models/NetrunningState";
import { ICEBreakerCraftingCost, powerSupplyCraftingCost } from "../../../src/CyberDeck/models/constants";
import { Challenges, NetrunDirection, NetrunEntityVariant, NetrunTargets, ModType } from "../../../src/CyberDeck/Enums";
import type { DeckMod } from "../../../src/CyberDeck/Types";
import {
  applyCaps,
  getCyberdeckStatBonuses,
  getDefaultConsumableStats,
  getDefaultEndgameMults,
  getDefaultMiscMults,
  getDefaultPlayerMults,
  mergeBuffs,
} from "../../../src/CyberDeck/utils/modStatsUtils";
import { ClassWork } from "../../../src/Work/ClassWork";
import { CompanyWork } from "../../../src/Work/CompanyWork";
import { CreateProgramWork } from "../../../src/Work/CreateProgramWork";
import type { PlayerBaseWork } from "../../../src/Work/Work";

// ------------------------------------------------------------------------------------------------
// Assumptions (tweak here)
// ------------------------------------------------------------------------------------------------
/** Simulated play time; override with SIM_HOURS (runParallel.js --hours) */
const SIM_HOURS = Number(process.env.SIM_HOURS ?? 6);
const STEP_SECONDS = 4; // one cyberdeck component tick (20 game cycles)
const RECORD_EVERY_SECONDS = 60;
/** Fraction of total RAM the player spends on the mechanic ("the majority of their ram") */
const MECHANIC_RAM_FRACTION = 0.6;
/** Below this much total RAM the player is still bootstrapping, and puts everything into the batcher */
const MECHANIC_RAM_MIN_TOTAL = 64;
/** Real shotgun batchers lose some throughput to desyncs, RAM fragmentation, level-ups mid-batch, etc. */
const BATCHER_EFFICIENCY = 0.8;
/** ~300k simultaneous scripts is the practical limit before memory overhead bogs the game down: 75k 4-script batches */
const MAX_CONCURRENT_BATCHES = 75_000;
/** 25 max-size cloud servers plus a fully upgraded home */
const MAX_TOTAL_RAM = 26 * 2 ** 20;
const BATCH_HACK_FRACTIONS = [0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9];
const SCRIPT_RAM = { hack: 1.7, grow: 1.75, weaken: 1.75, stanekCharge: 2.0, cortexShare: 4.0 };
const CYBERDECK_SEED_COUNT = 5;
/** Fresh random seeds every run; set SIM_SEEDS to reproduce specific ones */
const randomSeed = () => 1 + Math.floor(Math.random() * 1e6);
/**
 * Cyberdeck netrun schedule: alternate blocks of netrunning Omnia Cybersystems (mostly skill chips, to raise netrunning
 * level) and Omega Software (hacking mods), starting with Omega.
 */
const NETRUN_BLOCK_SECONDS = 30 * 60;

// ------------------------------------------------------------------------------------------------
// Progress log: jest buffers console output until a test ends, so progress goes to a file in the OS temp folder
// (<tmp>/bitburner-sim/progress.log, or SIM_PROGRESS_FILE) - tail it while the suite runs
// ------------------------------------------------------------------------------------------------
const OUT_DIR = process.env.SIM_OUT_DIR ?? path.resolve("sim-output");
const PROGRESS_FILE = process.env.SIM_PROGRESS_FILE ?? path.join(os.tmpdir(), "bitburner-sim", "progress.log");
const PROGRESS_EVERY_SECONDS = 30 * 60;
/** Date.now is mocked to simulated time during a scenario; keep the real clock for wall-time reporting */
const realNow = Date.now.bind(Date);
let runIndex = 0;
let runTotal = 0;

function logProgress(message: string) {
  const time = new Date(realNow()).toISOString().slice(11, 19);
  const tag = process.env.SIM_TAG ? `{${process.env.SIM_TAG}} ` : `[${runIndex}/${runTotal}] `;
  fs.appendFileSync(PROGRESS_FILE, `${time} ${tag}${message}\n`);
}

function formatRam(gb: number) {
  if (gb >= 2 ** 20) return `${(gb / 2 ** 20).toFixed(1)}PB`;
  if (gb >= 2 ** 10) return `${(gb / 2 ** 10).toFixed(1)}TB`;
  return `${gb.toFixed(0)}GB`;
}
/** One coding contract every 10 minutes, solved by a contract script */
const CCT_INTERVAL_SECONDS = 600;

type GoProfile = {
  opponent: GoOpponent;
  boardSize: number;
  secondsPerGame: number;
  winRate: number;
  nodesOnWin: number;
  nodesOnLoss: number;
};
/** "Strong" script used when IPvGO is the mechanic being pushed. Illuminati gives hacking speed. */
const GO_STRONG_ILLUMINATI: GoProfile = {
  opponent: GoOpponent.Illuminati,
  boardSize: 7,
  secondsPerGame: 20,
  winRate: 0.5,
  nodesOnWin: 24,
  nodesOnLoss: 10,
};
/**
 * Strong script vs w0r1d_d43m0n (needs The Red Pill; the only opponent that boosts hacking level directly).
 * Always the 19x19 bitverse board: 267 playable nodes, komi 9.5, 7 handicap routers. ~120 AI moves at 400ms each
 * plus script think time.
 */
const GO_STRONG_WORLD_DAEMON: GoProfile = {
  opponent: GoOpponent.w0r1d_d43m0n,
  boardSize: 19,
  secondsPerGame: 120,
  winRate: 0.35,
  nodesOnWin: 150,
  nodesOnLoss: 100,
};
/** Same strong script farming The Black Hand (hacking money) instead */
const GO_STRONG_BLACK_HAND: GoProfile = {
  opponent: GoOpponent.TheBlackHand,
  boardSize: 7,
  secondsPerGame: 18,
  winRate: 0.75,
  nodesOnWin: 26,
  nodesOnLoss: 12,
};
/** "Medium" script running alongside the cyberdeck: farms Netburners for chips (bonus is irrelevant to hacking) */
const GO_MEDIUM_NETBURNERS: GoProfile = {
  opponent: GoOpponent.Netburners,
  boardSize: 7,
  secondsPerGame: 15,
  winRate: 0.9,
  nodesOnWin: 26,
  nodesOnLoss: 15,
};

/** How much the rack optimizer values each cyberdeck stat (hacking-level focused player) */
const MOD_WEIGHTS = {
  hacking: 1,
  hacking_exp: 0.3,
  hacking_speed: 0.35,
  hacking_money: 0.15,
  hacking_chance: 0.1,
  production: 0.04, // per component/tick of rom, chip or neurode production
  program_creation_speed: 0.01,
};
/** Production is worth at most this much (in hacking-mult terms), so shortages can't push hacking mods off the rack */
const PRODUCTION_VALUE_CAP = 0.06;
/** Only pay the trace-decay premium for an early netrun while ROM and chips are both at least this high */
const PREMIUM_NETRUN_FLOOR = 100;

// ------------------------------------------------------------------------------------------------
// Deterministic RNG
// ------------------------------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------------------------------------
// Shared player economy: programs, RAM, nuking, shotgun batcher
// ------------------------------------------------------------------------------------------------
const portPrograms = [
  { name: CompletedProgramName.bruteSsh, price: DarkWebItems.BruteSSHProgram.price },
  { name: CompletedProgramName.ftpCrack, price: DarkWebItems.FTPCrackProgram.price },
  { name: CompletedProgramName.relaySmtp, price: DarkWebItems.RelaySMTPProgram.price },
  { name: CompletedProgramName.httpWorm, price: DarkWebItems.HTTPWormProgram.price },
  { name: CompletedProgramName.sqlInject, price: DarkWebItems.SQLInjectProgram.price },
];
const TOR_PRICE = 200e3;

type BatchPlan = {
  target: Server | null;
  moneyPerSec: number;
  expPerSec: number;
  hackFraction: number;
  batches: number;
  idleRam: number;
};

class Economy {
  totalRam = 8;
  hasTor = false;
  plan: BatchPlan = { target: null, moneyPerSec: 0, expPerSec: 0, hackFraction: 0, batches: 0, idleRam: 0 };
  planLevel = -1;
  planMultsKey = "";
  servers: Server[];
  batchExp = 0;
  workExp = 0;

  constructor() {
    this.servers = GetAllServers().filter(
      (s): s is Server => s instanceof Server && !s.purchasedByPlayer && s.hostname !== "home",
    );
    for (const s of this.servers) {
      s.hackDifficulty = s.minDifficulty;
      s.moneyAvailable = s.moneyMax;
    }
    Player.getHomeComputer().maxRam = 8;
  }

  ownsProgram(name: string) {
    return Player.getHomeComputer().programs.includes(name as never);
  }

  portsOwned() {
    return portPrograms.filter((p) => this.ownsProgram(p.name)).length;
  }

  canRoot(s: Server) {
    return s.requiredHackingSkill <= Player.skills.hacking && s.numOpenPortsRequired <= this.portsOwned();
  }

  /** Root (and backdoor) anything newly reachable. Returns servers rooted this call. */
  rootNewServers() {
    const rooted: Server[] = [];
    for (const s of this.servers) {
      if (s.hasAdminRights || !this.canRoot(s)) continue;
      gainCyberdeckComponentsFromNukeOrBackdoor(s, false, false);
      s.hasAdminRights = true;
      gainCyberdeckComponentsFromNukeOrBackdoor(s, false, true);
      s.backdoorInstalled = true;
      rooted.push(s);
    }
    return rooted;
  }

  spendMoney() {
    if (!this.hasTor && Player.money >= TOR_PRICE) {
      Player.money -= TOR_PRICE;
      this.hasTor = true;
    }
    if (this.hasTor) {
      for (const p of portPrograms) {
        if (this.ownsProgram(p.name)) continue;
        if (Player.money < p.price) break;
        Player.money -= p.price;
        Player.getHomeComputer().pushProgram(p.name);
      }
    }
    // Keep the next program's price in reserve once it's within reach
    const nextProgram = portPrograms.find((p) => !this.ownsProgram(p.name));
    const reserve = nextProgram && nextProgram.price < Player.money * 3 ? nextProgram.price : 0;
    const spendable = Player.money - reserve;
    const costPerGb = getCloudServerCost(64) / 64;
    const ramRoom = MAX_TOTAL_RAM - this.totalRam;
    if (spendable > costPerGb && ramRoom > 0) {
      const gb = Math.min((spendable * 0.95) / costPerGb, ramRoom);
      this.totalRam += gb;
      Player.money -= gb * costPerGb;
    }
  }

  /**
   * Plan the batcher for the given RAM. Batches are limited both by RAM and by MAX_CONCURRENT_BATCHES: a batch is in
   * flight for its weaken time, so concurrent batches on a target = (batches/sec) * tW. RAM left over once the batch
   * limit is hit goes to weaken-only exp farming (a handful of many-thread scripts, so not script-limited).
   */
  replanIfNeeded(batcherRam: number, force = false) {
    const m = Player.mults;
    const key = `${m.hacking_speed.toFixed(4)}|${m.hacking_money.toFixed(4)}|${m.hacking_exp.toFixed(4)}|${Math.round(
      Math.log2(batcherRam + 1) * 20,
    )}`;
    if (!force && this.planLevel === Player.skills.hacking && key === this.planMultsKey) return;
    this.planLevel = Player.skills.hacking;
    this.planMultsKey = key;
    const ram = batcherRam * BATCHER_EFFICIENCY;

    type Option = {
      s: Server;
      moneyPerRamSec: number;
      expPerRamSec: number;
      ramSec: number;
      tW: number;
      stolen: number;
    };
    const optionsByFraction = new Map<number, Option[]>();
    let bestWeaken = { s: null as Server | null, expPerRamSec: 0 };
    for (const s of this.servers) {
      if (!s.hasAdminRights) continue;
      const tW = calculateWeakenTime(s, Player);
      const expPerThread = calculateHackingExpGain(s, Player);
      const weakenExpPerRamSec = expPerThread / (SCRIPT_RAM.weaken * tW);
      if (weakenExpPerRamSec > bestWeaken.expPerRamSec) bestWeaken = { s, expPerRamSec: weakenExpPerRamSec };
      if (s.moneyMax <= 0 || !s.serverGrowth) continue;
      const pct = calculatePercentMoneyHacked(s, Player);
      if (pct <= 0) continue;
      const chance = calculateHackingChance(s, Player);
      const tH = calculateHackingTime(s, Player);
      const tG = calculateGrowTime(s, Player);
      for (const f of BATCH_HACK_FRACTIONS) {
        const H = Math.max(1, Math.floor(f / pct));
        const stolen = Math.min(H * pct, 0.99);
        const G = Math.ceil(numCycleForGrowthCorrected(s, s.moneyMax, s.moneyMax * (1 - stolen), 1, Player));
        const W = Math.ceil((H * 0.002 + G * 0.004) / 0.05);
        const ramSec = SCRIPT_RAM.hack * H * tH + SCRIPT_RAM.grow * G * tG + SCRIPT_RAM.weaken * W * tW;
        const option: Option = {
          s,
          moneyPerRamSec: (stolen * s.moneyMax * chance) / ramSec,
          expPerRamSec: (expPerThread * (H * (chance + (1 - chance) / 4) + G + W)) / ramSec,
          ramSec,
          tW,
          stolen,
        };
        const list = optionsByFraction.get(f) ?? [];
        list.push(option);
        optionsByFraction.set(f, list);
      }
    }

    // Try each hack fraction; fill targets in order of money per GB-second under both limits
    let best: BatchPlan = { target: null, moneyPerSec: 0, expPerSec: 0, hackFraction: 0, batches: 0, idleRam: ram };
    for (const options of optionsByFraction.values()) {
      options.sort((a, b) => b.moneyPerRamSec - a.moneyPerRamSec);
      let ramLeft = ram;
      let batchesLeft = MAX_CONCURRENT_BATCHES;
      let money = 0;
      let exp = 0;
      for (const o of options) {
        if (ramLeft <= 0 || batchesLeft <= 0) break;
        // GB held per concurrent batch = ramSec / tW
        const ramUsed = Math.min(ramLeft, (batchesLeft * o.ramSec) / o.tW);
        ramLeft -= ramUsed;
        batchesLeft -= (ramUsed * o.tW) / o.ramSec;
        money += ramUsed * o.moneyPerRamSec;
        exp += ramUsed * o.expPerRamSec;
      }
      const weakenExp = ramLeft * bestWeaken.expPerRamSec;
      if (money > best.moneyPerSec || (money === best.moneyPerSec && exp + weakenExp > best.expPerSec)) {
        best = {
          target: options[0]?.s ?? null,
          moneyPerSec: money,
          expPerSec: exp + weakenExp,
          hackFraction: options[0]?.stolen ?? 0,
          batches: MAX_CONCURRENT_BATCHES - batchesLeft,
          idleRam: ramLeft,
        };
      }
    }
    if (!best.target && bestWeaken.s) {
      best = { ...best, expPerSec: ram * bestWeaken.expPerRamSec };
    }
    this.plan = best;
  }

  mechanicRam() {
    return this.totalRam >= MECHANIC_RAM_MIN_TOTAL ? this.totalRam * MECHANIC_RAM_FRACTION : 0;
  }

  /** Run the batcher (planned by replanIfNeeded) for the given time */
  runBatcher(seconds: number) {
    const money = this.plan.moneyPerSec * seconds;
    const exp = this.plan.expPerSec * seconds;
    Player.money += money;
    Player.gainHackingExp(exp);
    this.batchExp += exp;
    return { money, exp };
  }
}

// ------------------------------------------------------------------------------------------------
// Stanek
// ------------------------------------------------------------------------------------------------
const STANEK_WEIGHTS: Partial<Record<FragmentType, number>> = {
  [FragmentTypeEnum.Hacking]: 1,
  [FragmentTypeEnum.HackingSpeed]: 0.35,
  [FragmentTypeEnum.HackingMoney]: 0.15,
};

/** Random-restart search for a 5x5 layout that maximizes weighted (power * booster) of the hacking fragments */
function designStanekLayout(rng: () => number) {
  const chargeable = Fragments.filter((f) => STANEK_WEIGHTS[f.type] !== undefined);
  const boosters = Fragments.filter((f) => f.type === FragmentTypeEnum.Booster);
  let best: { score: number; layout: { x: number; y: number; r: number; id: number }[] } = { score: -1, layout: [] };
  const trial = new StaneksGift();
  for (let attempt = 0; attempt < 4000; attempt++) {
    trial.clear();
    const layout: { x: number; y: number; r: number; id: number }[] = [];
    const pool = [...chargeable].sort(() => rng() - 0.5);
    const subsetSize = 2 + Math.floor(rng() * (pool.length - 1));
    const toPlace = [...pool.slice(0, subsetSize), ...boosters, ...boosters, ...boosters];
    for (const frag of toPlace) {
      for (let tries = 0; tries < 30; tries++) {
        const x = Math.floor(rng() * trial.width());
        const y = Math.floor(rng() * trial.height());
        const r = Math.floor(rng() * 4);
        if (trial.place(x, y, r, frag)) {
          layout.push({ x, y, r, id: frag.id });
          break;
        }
      }
    }
    // Score with equal (arbitrary) charge on every chargeable fragment
    let score = 0;
    for (const af of trial.fragments) {
      const w = STANEK_WEIGHTS[af.fragment().type];
      if (w === undefined) continue;
      af.highestCharge = 1000;
      af.numCharge = 100;
      score += w * (trial.effect(af) - 1);
    }
    if (score > best.score) best = { score, layout };
  }
  return best.layout;
}

// ------------------------------------------------------------------------------------------------
// IPvGO
// ------------------------------------------------------------------------------------------------
class GoPlayer {
  elapsed = 0;
  games = 0;
  chips = 0;
  constructor(private profile: GoProfile, private rng: () => number) {
    Go.stats[profile.opponent] ??= newOpponentStats();
  }

  advance(seconds: number) {
    this.elapsed += seconds;
    let finished = false;
    while (this.elapsed >= this.profile.secondsPerGame) {
      this.elapsed -= this.profile.secondsPerGame;
      this.playOne();
      finished = true;
    }
    return finished;
  }

  /** Mirrors endGoGame()'s stat updates, with the game outcome drawn from the profile */
  private playOne() {
    const p = this.profile;
    const stats = Go.stats[p.opponent] ?? (Go.stats[p.opponent] = newOpponentStats());
    const won = this.rng() < p.winRate;
    const nodes = Math.round((won ? p.nodesOnWin : p.nodesOnLoss) * (0.8 + 0.4 * this.rng()));
    if (!won) {
      stats.oldWinStreak = stats.winStreak;
      stats.winStreak = stats.winStreak > 0 ? -1 : stats.winStreak - 1;
      stats.losses++;
    } else {
      stats.wins++;
      stats.oldWinStreak = stats.winStreak;
      stats.winStreak = stats.oldWinStreak < 0 ? 1 : stats.winStreak + 1;
    }
    stats.nodePower +=
      nodes *
      getDifficultyMultiplier(opponentDetails[p.opponent].komi, p.boardSize) *
      getWinstreakMultiplier(stats.winStreak, stats.oldWinStreak) *
      getCyberdeckStatBonuses(1).otherMults.IPvGO_power;
    stats.nodes += nodes;
    this.chips += gainCyberdeckChipsFromIPvGO(nodes) ?? 0;
    this.games++;
  }
}

// ------------------------------------------------------------------------------------------------
// Cyberdeck: rack optimizer (mirrors moduleMutation's wiring rules)
// ------------------------------------------------------------------------------------------------
const IO_ID = "cyberdeck-io-panel";
type Wire = { a: string; b: string; c: number };

const COMPONENT_COMFORT_STOCK = 1000;
/** Production stops mattering once a component is stockpiled, and matters ~10x more when it's nearly gone */
const COMPONENT_STARVING_STOCK = 200;
function scarcity(component: "rom" | "chips" | "neurodes") {
  const stock = CyberdeckState.components[component];
  const starving = 1 + 9 * Math.max(0, 1 - stock / COMPONENT_STARVING_STOCK);
  return Math.max(0, 1 - stock / COMPONENT_COMFORT_STOCK) * starving;
}

/** Set while choosing the end-of-run build, which only cares about the hacking level multiplier */
let finalHackOnlyValuation = false;
const FINAL_BUILD_TRIALS = 400;

function modValue(mods: DeckMod[]): number {
  const stats = mods.map((m) => m.stats ?? {});
  const merged = applyCaps(
    {
      playerMults: mergeBuffs(getDefaultPlayerMults(0), ...stats.map((s) => s.playerMults)),
      otherMults: mergeBuffs(getDefaultMiscMults(0), ...stats.map((s) => s.otherMults)),
      endgameMults: mergeBuffs(getDefaultEndgameMults(0), ...stats.map((s) => s.endgameMults)),
      consumableStats: getDefaultConsumableStats(),
      extraRackSlots: 0,
    },
    0,
  );
  const p = merged.playerMults;
  const o = merged.otherMults;
  // Final build: hacking level = hacking mult x f(exp), so nothing else changes the level at the end of the run
  if (finalHackOnlyValuation) return p.hacking;
  return (
    MOD_WEIGHTS.hacking * p.hacking +
    MOD_WEIGHTS.hacking_exp * p.hacking_exp +
    MOD_WEIGHTS.hacking_speed * p.hacking_speed +
    MOD_WEIGHTS.hacking_money * p.hacking_money +
    MOD_WEIGHTS.hacking_chance * p.hacking_chance +
    // Production is only worth anything while that component is actually scarce
    Math.min(
      PRODUCTION_VALUE_CAP,
      MOD_WEIGHTS.production *
        (Math.max(o.romProduction, 0) * scarcity("rom") +
          Math.max(o.chipProduction, 0) * scarcity("chips") +
          Math.max(o.neurodeProduction, 0) * scarcity("neurodes")),
    ) +
    MOD_WEIGHTS.program_creation_speed * o.program_creation_speed
  );
}

class RackModel {
  constructor(public rack: string[], public wires: Wire[], private mods: Map<string, DeckMod>) {}
  pos(id: string) {
    return this.rack.indexOf(id);
  }
  sockets(id: string) {
    return id === IO_ID ? getCyberdeckIOPanel().sockets : this.mods.get(id)?.sockets ?? [];
  }
  socketFree(id: string, c: number) {
    return !this.wires.some((w) => w.c === c && (w.a === id || w.b === id));
  }
  /** Same as wireOverlapsSocket(): is this socket strictly inside the span of an existing same-color wire? */
  overlaps(id: string, c: number, wires = this.wires) {
    const p = this.pos(id);
    return wires.some((w) => w.c === c && w.a !== id && w.b !== id && this.pos(w.a) > p !== this.pos(w.b) > p);
  }
  allValid() {
    return this.wires.every((w) => {
      const others = this.wires.filter((o) => o !== w);
      return !this.overlaps(w.a, w.c, others) && !this.overlaps(w.b, w.c, others);
    });
  }
  powered() {
    const set = new Set([IO_ID]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const w of this.wires) {
        if (set.has(w.a) !== set.has(w.b)) {
          set.add(w.a);
          set.add(w.b);
          changed = true;
        }
      }
    }
    return set;
  }
  capacity() {
    const powered = this.powered();
    let slots = CyberdeckState.baseRackSize;
    for (const id of this.rack) {
      if (powered.has(id)) slots += this.mods.get(id)?.stats?.extraRackSlots ?? 0;
    }
    return slots;
  }
  /** Find a way to add `id` to the rack, powered by a wire to a powered host. */
  tryAdd(id: string, rng: () => number): boolean {
    const mod = this.mods.get(id);
    if (!mod) return false;
    if (mod.type === ModType.RackExtension) {
      const extCount = this.rack.filter((r) => this.mods.get(r)?.type === ModType.RackExtension).length;
      if (extCount >= getRackExtensionCap()) return false;
    }
    // Installing into a full rack ejects a mod before the new one can be wired, so there must already be room
    if (this.rack.length + 1 > this.capacity()) return false;
    const positions = [...Array(this.rack.length + 1).keys()].sort(() => rng() - 0.5);
    const hosts = [IO_ID, ...this.rack];
    for (const p of positions) {
      this.rack.splice(p, 0, id);
      if (this.allValid()) {
        for (let c = 0; c < 8; c++) {
          if (!mod.sockets[c] || !this.socketFree(id, c)) continue;
          for (const h of hosts) {
            if (!this.sockets(h)[c] || !this.socketFree(h, c)) continue;
            if (this.overlaps(h, c) || this.overlaps(id, c)) continue;
            this.wires.push({ a: h, b: id, c });
            return true;
          }
        }
      }
      this.rack.splice(p, 1);
    }
    return false;
  }
  remove(id: string) {
    this.rack = this.rack.filter((r) => r !== id);
    this.wires = this.wires.filter((w) => w.a !== id && w.b !== id);
  }
  degree(id: string) {
    return this.wires.filter((w) => w.a === id || w.b === id).length;
  }
  poweredMods() {
    const powered = this.powered();
    return this.rack.filter((id) => powered.has(id)).map((id) => this.mods.get(id) as DeckMod);
  }
  clone() {
    return new RackModel(
      [...this.rack],
      this.wires.map((w) => ({ ...w })),
      this.mods,
    );
  }
}

function currentRackModel(mods: Map<string, DeckMod>) {
  return new RackModel(
    CyberdeckState.installedModules.map((m) => m.id),
    CyberdeckState.connections.map(([s, d]) => ({ a: s.modId, b: d.modId, c: s.socketIndex })),
    mods,
  );
}

function allModsMap() {
  const map = new Map<string, DeckMod>();
  for (const m of [...CyberdeckState.installedModules, ...CyberdeckState.storedModules]) map.set(m.id, m);
  return map;
}

function optimizeRack(rng: () => number, trials = 40, start?: RackModel): RackModel {
  const mods = allModsMap();
  const candidates = [...mods.values()].filter((m) => m.type !== ModType.SkillChip);
  const single = new Map(candidates.map((m) => [m.id, modValue([m])]));
  let best = currentRackModel(mods);
  let bestValue = modValue(best.poweredMods());
  // A previously found layout is still a candidate, minus any mods that are no longer owned
  if (start) {
    const model = new RackModel(
      start.rack.filter((id) => mods.has(id)),
      start.wires.filter((w) => (w.a === IO_ID || mods.has(w.a)) && mods.has(w.b)).map((w) => ({ ...w })),
      mods,
    );
    const value = modValue(model.poweredMods());
    if (value > bestValue && model.rack.length <= model.capacity()) {
      best = model;
      bestValue = value;
    }
  }
  for (let t = 0; t < trials; t++) {
    const model = new RackModel([], [], mods);
    // Enablers have little stat value but only fit while the rack still has room, so a third of the trials place power
    // supplies (hubs) then rack extensions first, a third place extensions first, and the rest go by stat value
    const mode = t % 3;
    const powerSupplyBoost = mode === 0 ? 20 : 0.03;
    const extensionBoost = mode === 2 ? 0.03 : 10;
    const enabler = (m: DeckMod) =>
      m.type === ModType.RackExtension ? extensionBoost : m.type === ModType.PowerSupply ? powerSupplyBoost : 0;
    const order = [...candidates].sort(
      (a, b) =>
        (single.get(b.id) ?? 0) + enabler(b) + rng() * 0.05 - ((single.get(a.id) ?? 0) + enabler(a) + rng() * 0.05),
    );
    let value = 0;
    for (const m of order) {
      const before = model.clone();
      if (!model.tryAdd(m.id, rng)) continue;
      const newValue = modValue(model.poweredMods());
      const isEnabler = m.type === ModType.PowerSupply || m.type === ModType.RackExtension;
      if (newValue > value || isEnabler) {
        value = newValue;
      } else {
        model.rack = before.rack;
        model.wires = before.wires;
      }
    }
    // Prune leaves (mods powering nothing else) that don't pay for themselves
    let pruned = true;
    while (pruned) {
      pruned = false;
      for (const id of [...model.rack]) {
        if (model.degree(id) !== 1 || model.wires.some((w) => w.a === id)) continue;
        const trialModel = model.clone();
        trialModel.remove(id);
        const v = modValue(trialModel.poweredMods());
        if (v >= value && trialModel.rack.length <= trialModel.capacity()) {
          model.rack = trialModel.rack;
          model.wires = trialModel.wires;
          value = v;
          pruned = true;
        }
      }
    }
    if (value > bestValue + 1e-9) {
      best = model;
      bestValue = value;
    }
  }
  return best;
}

/**
 * The hacking multiplier the deck could reach right now by rewiring everything owned for hacking alone (what the
 * end-of-run build does), without touching the actual rack. Keeps the last best layout so random search doesn't dip.
 */
const BEST_BUILD_TRIALS = 40;
function bestHackBuild(rng: () => number, previous?: RackModel) {
  finalHackOnlyValuation = true;
  try {
    const model = optimizeRack(rng, BEST_BUILD_TRIALS, previous);
    const deckHack = 1 + modValue(model.poweredMods());
    const currentDeckHack = getCyberdeckStatBonuses(1).playerMults.hacking;
    const mult = (Player.mults.hacking / currentDeckHack) * Math.max(deckHack, currentDeckHack);
    const hack = calculateSkill(Player.exp.hacking, mult * currentNodeMults.HackingLevelMultiplier);
    return { model, deckHack: Math.max(deckHack, currentDeckHack), mult, hack };
  } finally {
    finalHackOnlyValuation = false;
  }
}

let layoutMismatches = 0;
let mismatchReasons: string[] = [];
let skillChipsConsumed = 0;

/** Apply a planned layout through the real moveModule/createConnection functions */
function applyRack(model: RackModel) {
  const current = currentRackModel(allModsMap());
  const same =
    current.rack.join() === model.rack.join() &&
    JSON.stringify(current.wires.map((w) => [w.a, w.b, w.c]).sort()) ===
      JSON.stringify(model.wires.map((w) => [w.a, w.b, w.c]).sort());
  if (same) return;
  for (const m of [...CyberdeckState.installedModules]) moveModule(m, false, true);
  // Install mods in wire (BFS) order, preferring rack extensions so capacity grows before it is needed
  const installed: string[] = [];
  const powered = new Set([IO_ID]);
  const remaining = [...model.wires];
  while (remaining.length) {
    const ready = remaining.filter((w) => powered.has(w.a) !== powered.has(w.b));
    if (!ready.length) break;
    ready.sort((w1, w2) => {
      const t1 = allModsMap().get(powered.has(w1.a) ? w1.b : w1.a)?.type === ModType.RackExtension ? 0 : 1;
      const t2 = allModsMap().get(powered.has(w2.a) ? w2.b : w2.a)?.type === ModType.RackExtension ? 0 : 1;
      return t1 - t2;
    });
    const w = ready[0];
    remaining.splice(remaining.indexOf(w), 1);
    const newId = powered.has(w.a) ? w.b : w.a;
    const mod = CyberdeckState.storedModules.find((m) => m.id === newId);
    if (!mod) continue;
    const finalPos = model.rack.indexOf(newId);
    const index = installed.filter((id) => model.rack.indexOf(id) < finalPos).length;
    moveModule(mod, true, false, index);
    installed.splice(index, 0, newId);
    const result = createConnection({ modId: w.a, socketIndex: w.c }, { modId: w.b, socketIndex: w.c });
    if (!result.success) {
      layoutMismatches++;
      if (mismatchReasons.length < 10) mismatchReasons.push(`connect: ${result.error}`);
    }
    checkAutoWireChallenge(mod);
    powered.add(newId);
  }
  const charged = new Set(getChargedModuleIDs());
  const missing = model.poweredMods().filter((m) => !charged.has(m.id));
  if (missing.length) {
    layoutMismatches++;
    if (mismatchReasons.length < 10) {
      mismatchReasons.push(
        `uncharged ${missing.map((m) => m.type).join(",")}; installed ${CyberdeckState.installedModules.length}/${
          model.rack.length
        }`,
      );
    }
  }
}

/**
 * Salvage the least useful stored mod. Rack extensions and power supplies have little stat value of their own but
 * enable bigger racks, so the best few of each (most slots / most sockets) are kept, along with the best ROM producer
 * (the only way out of a ROM shortage), and the mods of the best hacking build. Skill chips go last. With
 * allowProtected, only the ROM producer is kept.
 */
/** Mods in the best hacking build found so far. A player keeps those, so salvage skips them unless ROM is stuck */
let hackBuildKeep = new Set<string>();

function salvageWorstStoredMod(allowSkillChips: boolean, allowProtected = false): boolean {
  const stored = CyberdeckState.storedModules.filter((m) => !m.favorite);
  const socketCount = (m: DeckMod) => m.sockets.filter(Boolean).length;
  const all = [...CyberdeckState.installedModules, ...CyberdeckState.storedModules];
  const keepBest = (type: ModType | null, count: number, score: (m: DeckMod) => number) =>
    all
      .filter((m) => (type === null || m.type === type) && score(m) > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, count);
  const romProduction = (m: DeckMod) => m.stats?.otherMults?.romProduction ?? 0;
  const protectedMods = new Set([
    ...keepBest(null, 1, romProduction),
    ...(allowProtected
      ? []
      : [
          ...all.filter((m) => hackBuildKeep.has(m.id)),
          ...keepBest(
            ModType.RackExtension,
            getRackExtensionCap(),
            (m) => (m.stats?.extraRackSlots ?? 0) * 10 + socketCount(m),
          ),
          ...keepBest(ModType.PowerSupply, 2, socketCount),
        ]),
  ]);
  const candidates = stored.filter((m) => !protectedMods.has(m) && (allowSkillChips || m.type !== ModType.SkillChip));
  if (!candidates.length) return false;
  const salvageScore = (m: DeckMod) => (m.type === ModType.SkillChip ? 10 : 0) + modValue([m]);
  candidates.sort((a, b) => salvageScore(a) - salvageScore(b));
  disassembleModule(candidates[0]);
  return true;
}

/** Charge (and thereby consume) any stored skill chips that can be wired into the current layout */
function consumeSkillChips(rng: () => number) {
  for (const chip of CyberdeckState.storedModules.filter((m) => m.type === ModType.SkillChip)) {
    let model = currentRackModel(allModsMap());
    // If the rack is full, temporarily unplug the least valuable leaf mod (the optimizer re-plugs it afterwards)
    while (!model.tryAdd(chip.id, rng)) {
      const leaves = CyberdeckState.installedModules.filter(
        (m) => model.degree(m.id) <= 1 && !model.wires.some((w) => w.a === m.id),
      );
      if (!leaves.length || CyberdeckState.installedModules.length < CyberdeckState.baseRackSize) break;
      leaves.sort((a, b) => modValue([a]) - modValue([b]));
      moveModule(leaves[0], false, true);
      model = currentRackModel(allModsMap());
    }
    if (!model.rack.includes(chip.id)) continue;
    const index = model.rack.indexOf(chip.id);
    const wire = model.wires[model.wires.length - 1];
    moveModule(chip, true, false, index);
    createConnection({ modId: wire.a, socketIndex: wire.c }, { modId: wire.b, socketIndex: wire.c });
    checkAutoWireChallenge(chip);
    if (!CyberdeckState.installedModules.includes(chip)) skillChipsConsumed++;
  }
}

// ------------------------------------------------------------------------------------------------
// Cyberdeck: netrun bot (only uses information the API exposes)
// ------------------------------------------------------------------------------------------------
type Cell = { x: number; y: number };
const DIRS: [NetrunDirection, number, number][] = [
  [NetrunDirection.up, 0, -1],
  [NetrunDirection.down, 0, 1],
  [NetrunDirection.left, -1, 0],
  [NetrunDirection.right, 1, 0],
];

/** Offline nodes spread up to two cells every third move, so in a corrupted run stay this far away from them */
const OFFLINE_SAFE_DISTANCE = 3;

function runNetrunBot(target: NetrunTargets, corrupted = false): { moves: number; score: number; failed: boolean } {
  NetrunningState.target = target;
  initNetrunGrid(corrupted);
  let moves = 0;
  const grid = () => NetrunningState.grid;
  const offlineDistance = (x: number, y: number) => {
    let best = Infinity;
    for (const e of NetrunningState.groups[-1] ?? []) best = Math.min(best, Math.abs(e.x - x) + Math.abs(e.y - y));
    return best;
  };
  const isWalkable = (x: number, y: number) => {
    const e = grid()[y]?.[x];
    return (
      !!e &&
      e.visible &&
      e.type === NetrunEntityVariant.empty &&
      (!corrupted || offlineDistance(x, y) >= OFFLINE_SAFE_DISTANCE)
    );
  };
  const knownBomb = (x: number, y: number) => {
    const e = grid()[y]?.[x];
    return !!e && e.hasBomb && e.hits > 0;
  };

  for (let guard = 0; guard < (corrupted ? 600 : 200) && NetrunningState.isNetrunning; guard++) {
    // BFS over visible empty cells
    const [sy, sx] = NetrunningState.location;
    // Corrupted: once the offline spread is about to reach us, bank what we have
    if (corrupted && offlineDistance(sx, sy) <= OFFLINE_SAFE_DISTANCE) break;
    const prev = new Map<string, [string | null, NetrunDirection | null]>();
    const key = (x: number, y: number) => `${x},${y}`;
    prev.set(key(sx, sy), [null, null]);
    const queue: Cell[] = [{ x: sx, y: sy }];
    type Option = { from: Cell; dir: NetrunDirection; value: number; hits: number };
    const options: Option[] = [];
    const seenGroups = new Set<number>();
    while (queue.length) {
      const cur = queue.shift() as Cell;
      for (const [dir, dx, dy] of DIRS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const e = grid()[ny]?.[nx];
        if (!e) continue;
        if (isWalkable(nx, ny)) {
          if (!prev.has(key(nx, ny))) {
            prev.set(key(nx, ny), [key(cur.x, cur.y), dir]);
            queue.push({ x: nx, y: ny });
          }
          continue;
        }
        if (!e.visible) continue;
        if (corrupted && offlineDistance(nx, ny) < OFFLINE_SAFE_DISTANCE) continue;
        const groupKey = e.type === NetrunEntityVariant.firewall ? -1000 - (ny * NETRUNNING_WIDTH + nx) : e.group;
        if (seenGroups.has(groupKey)) continue;
        if (e.type === NetrunEntityVariant.dataStore) {
          seenGroups.add(groupKey);
          options.push({ from: cur, dir, value: 1000, hits: 1 });
        } else if (e.type === NetrunEntityVariant.ice && NetrunningState.energy > 0 && !knownBomb(nx, ny)) {
          seenGroups.add(groupKey);
          const members = NetrunningState.groups[e.group] ?? [e];
          const depth = Math.max(...members.map((m) => m.x / NETRUNNING_WIDTH + m.y / NETRUNNING_HEIGHT));
          options.push({ from: cur, dir, value: 10 * depth + 0.1 * members.length, hits: 1 });
        } else if (e.type === NetrunEntityVariant.firewall && NetrunningState.energy > 0.35) {
          seenGroups.add(groupKey);
          const depth = nx / NETRUNNING_WIDTH + ny / NETRUNNING_HEIGHT;
          options.push({ from: cur, dir, value: 10 * depth - 6, hits: 3 - e.hits });
        }
      }
    }
    if (!options.length) break;
    options.sort((a, b) => b.value - a.value);
    const choice = options[0];
    // Walk to the cell next to the target
    const path: NetrunDirection[] = [];
    let k: string | null = key(choice.from.x, choice.from.y);
    while (k) {
      const [p, d]: [string | null, NetrunDirection | null] = prev.get(k) ?? [null, null];
      if (d) path.unshift(d);
      k = p;
    }
    // Corrupted: re-plan after every step, since the offline spread moves while we walk
    const steps = corrupted ? path.slice(0, 1) : path;
    for (const d of steps) {
      move(d, true);
      moves++;
    }
    if (corrupted && path.length > 1) continue;
    for (let h = 0; h < choice.hits && NetrunningState.isNetrunning; h++) {
      move(choice.dir, true);
      moves++;
    }
  }
  // Walking into an offline node ends the run with nothing (and hospitalizes the player)
  const failed = corrupted && !NetrunningState.isNetrunning;
  if (failed) return { moves, score: 0, failed };
  // Before finishing: if the threat readout says countermeasures are within range, flag the untouched visible ICE
  // groups within that range (what a player reading threat/threatCount would do to try for Bomb Squad / Auto Bomber)
  const [ly, lx] = NetrunningState.location;
  if (getThreatSignalStrength().signals > 0 || NetrunningState.energy === 0) {
    const flaggedGroups = new Set<number>();
    for (const row of grid()) {
      for (const e of row) {
        if (!e.visible || e.type !== NetrunEntityVariant.ice || e.hits || e.flagged || flaggedGroups.has(e.group))
          continue;
        if (Math.hypot(e.x - lx, e.y - ly) > 7) continue;
        flaggedGroups.add(e.group);
        flagEntity(e);
      }
    }
  }
  return { moves, score: NetrunningState.rewardScore, failed: false };
}

// ------------------------------------------------------------------------------------------------
// Scenarios
// ------------------------------------------------------------------------------------------------
type Sample = {
  t: number; // minutes
  hack: number;
  hackMult: number;
  /** Best hacking mult / level reachable at this moment by rewiring for hacking only (same as hackMult/hack off-deck) */
  bestHackMult: number;
  bestHack: number;
  hackExpMult: number;
  hackSpeedMult: number;
  hackMoneyMult: number;
  ram: number;
  mechanicRam: number;
  moneyPerSec: number;
  batches: number;
  idleRam: number;
  target: string;
  extra?: Record<string, number | string>;
};
type ScenarioResult = { name: string; seed: number; samples: Sample[]; summary: Record<string, unknown> };

type ScenarioKind =
  | "baseline"
  | "stanek"
  | "go-illuminati"
  | "go-blackhand"
  | "go-wd"
  | "cyberdeck-focus"
  | "cyberdeck-nofocus";

function freshWorld(seed: number) {
  setupBasicTestingEnvironment();
  Player.money = 1000;
  Player.identifier = `hacking-sim-${seed}`;
  Player.exp.hacking = 0;
  Player.updateSkillLevels();
  CyberdeckState.hasCyberdeck = false;
  CyberdeckState.installedModules = [];
  CyberdeckState.storedModules = [];
  CyberdeckState.connections = [];
  for (const k of Object.keys(CyberdeckState.tutorialSteps) as (keyof typeof CyberdeckState.tutorialSteps)[]) {
    CyberdeckState.tutorialSteps[k] = false;
  }
  staneksGift.clear();
  Go.stats = {};
  Player.applyEntropy(Player.entropy);
}

function runScenario(kind: ScenarioKind, seed: number): ScenarioResult {
  const rng = mulberry32(seed * 7919 + kind.length * 104729);
  const seededRandom = mulberry32(seed * 31 + 17);
  const randomSpy = jest.spyOn(Math, "random").mockImplementation(seededRandom);
  // lodash captures Math.random at import time, so seed its shuffle (used by netrun grid generation) separately
  jest.spyOn(_, "shuffle").mockImplementation((collection: object | null | undefined) => {
    const arr: unknown[] = Array.isArray(collection) ? [...(collection as unknown[])] : Object.values(collection ?? {});
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  let simMs = 1_700_000_000_000;
  const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => simMs);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});

  freshWorld(seed);
  const wallStart = realNow();
  logProgress(`${kind} seed ${seed} | started`);
  layoutMismatches = 0;
  mismatchReasons = [];
  skillChipsConsumed = 0;
  const econ = new Economy();
  const samples: Sample[] = [];
  const summary: Record<string, unknown> = {};

  // --- mechanic setup ---
  let goPlayer: GoPlayer | null = null;
  const isCyberdeck = kind === "cyberdeck-focus" || kind === "cyberdeck-nofocus";
  if (kind === "go-illuminati") goPlayer = new GoPlayer(GO_STRONG_ILLUMINATI, rng);
  if (kind === "go-blackhand") goPlayer = new GoPlayer(GO_STRONG_BLACK_HAND, rng);
  if (kind === "go-wd") goPlayer = new GoPlayer(GO_STRONG_WORLD_DAEMON, rng);
  if (isCyberdeck) {
    gainCyberdeck();
    // Assume a max-level deck: tutorial and every challenge done, with their one-time level rewards applied
    for (const k of Object.keys(CyberdeckState.tutorialSteps) as (keyof typeof CyberdeckState.tutorialSteps)[]) {
      CyberdeckState.tutorialSteps[k] = true;
    }
    for (const c of Object.values(Challenges)) CyberdeckState.completedChallenges[c] = true;
    CyberdeckState.netrunningLevel += 2 + 4; // Daisy Chain, Jackpot
    CyberdeckState.netrunningCooldownLevel += 4; // Auto Run
    CyberdeckState.craftingLevel += 4; // Supplier
    CyberdeckState.modStorageSize += 2; // Full House
    goPlayer = new GoPlayer(GO_MEDIUM_NETBURNERS, rng);
    summary.startingComponents = structuredClone(CyberdeckState.components);
  }
  if (kind === "stanek") {
    for (const f of designStanekLayout(rng)) {
      const frag = FragmentById(f.id);
      if (frag) staneksGift.place(f.x, f.y, f.r, frag);
    }
    summary.stanekLayout = staneksGift.fragments.map((af) => ({
      id: af.id,
      type: af.fragment().type,
      x: af.x,
      y: af.y,
      r: af.rotation,
    }));
  }
  Player.applyEntropy(Player.entropy);

  // --- cyberdeck bookkeeping ---
  // Separate RNG so estimating the best build each sample doesn't change the run itself
  const bestBuildRng = mulberry32(seed * 104723 + 3);
  let bestBuildModel: RackModel | undefined;
  hackBuildKeep = new Set();
  let netrunBusyUntil = 0;
  let netruns = 0;
  let netrunScoreTotal = 0;
  let craftCycle = 0;
  let craftedIcebreakerTutorial = false;
  let romSalvages = 0;
  let romStuckRewired = false;
  let nextCct = CCT_INTERVAL_SECONDS;
  const netrunScores: number[] = [];
  let currentWork: PlayerBaseWork | null = null;
  let workKind = "none";
  const workSeconds: Record<string, number> = {};
  let powerSuppliesCrafted = 0;
  let corruptedRuns = 0;
  let corruptedFailures = 0;
  const corruptedScores: number[] = [];
  let busyKind = "netrunning";
  /** A corrupted run is worth starting once its cost is back at the minimum and ROM/chips can cover the ICEBreakers */
  const corruptedReady = () => {
    const corruptedCost = getCurrentNetrunningIceCost(true);
    if (corruptedCost > minimumNetrunCost(true) || !moduleStorageAvailable()) return false;
    const c = CyberdeckState.components;
    const crafts = Math.max(0, Math.ceil((corruptedCost - c.iceBreakers) / 10));
    return (
      c.rom - crafts * ICEBreakerCraftingCost.rom >= PREMIUM_NETRUN_FLOOR &&
      c.chips - crafts * ICEBreakerCraftingCost.chips >= PREMIUM_NETRUN_FLOOR &&
      c.neurodes >= crafts * ICEBreakerCraftingCost.neurodes
    );
  };
  let nextPowerSupplyCheck = 0;
  /** Where the deck's time went: netrunning, waiting for the netrun cost to decay, or short of a component */
  const deckTime: Record<string, number> = {};
  /** Seconds each component was below what the next ICEBreaker craft needs while the deck sat idle */
  const shortSeconds: Record<string, number> = { rom: 0, chips: 0, neurodes: 0 };

  const totalSteps = (SIM_HOURS * 3600) / STEP_SECONDS;
  let lastRecord = -Infinity;

  const usesMechanicRam = !(kind === "baseline" || kind.startsWith("go"));
  const batcherRam = () => econ.totalRam - (usesMechanicRam ? econ.mechanicRam() : 0);
  const refreshMults = () => {
    Player.applyEntropy(Player.entropy);
    econ.replanIfNeeded(batcherRam(), true);
  };

  for (let step = 0; step <= totalSteps; step++) {
    const tSec = step * STEP_SECONDS;
    simMs += STEP_SECONDS * 1000;

    // Rooting, spending, planning (every 20s of game time)
    if (step % 5 === 0) {
      econ.rootNewServers();
      econ.spendMoney();
      econ.replanIfNeeded(batcherRam());
    }

    const mechanicRam = usesMechanicRam ? econ.mechanicRam() : 0;
    econ.runBatcher(STEP_SECONDS);

    // --- Stanek: one charge per fragment per second, RAM split evenly ---
    if (kind === "stanek" && mechanicRam > 0) {
      const charged = staneksGift.fragments.filter((f) => f.fragment().type !== FragmentTypeEnum.Booster);
      const threads = Math.floor(mechanicRam / charged.length / SCRIPT_RAM.stanekCharge);
      if (threads > 0) {
        for (let s = 0; s < STEP_SECONDS; s++) for (const af of charged) staneksGift.charge(af, threads);
        Player.applyEntropy(Player.entropy);
      }
    }

    // --- IPvGO ---
    if (goPlayer?.advance(STEP_SECONDS)) {
      Player.applyEntropy(Player.entropy);
    }

    // --- Cyberdeck ---
    if (isCyberdeck) {
      CyberdeckState.cortexSharedThreads = Math.floor(mechanicRam / SCRIPT_RAM.cortexShare);

      // Focus work: pick the activity that produces whichever component is scarcest
      if (kind === "cyberdeck-focus" && step % 15 === 0) {
        const c = CyberdeckState.components;
        const creatable = Object.values(Programs).find(
          (p) =>
            p.create &&
            p.create.req() &&
            !Player.getHomeComputer().programs.includes(p.name) &&
            p.name !== CompletedProgramName.flight &&
            p.name !== CompletedProgramName.bitFlume,
        );
        const scarcest = (["chips", "neurodes", "rom"] as const).reduce((a, b) => (c[a] <= c[b] ? a : b));
        let wanted = scarcest === "rom" && creatable ? "program" : scarcest === "neurodes" ? "class" : "company";
        const classWork = new ClassWork({
          classType: UniversityClassType.algorithms,
          location: LocationName.VolhavenZBInstituteOfTechnology,
          singularity: true,
        });
        const tuitionPerSec = -classWork.calculateRates().money * 5;
        if (wanted === "class" && tuitionPerSec > econ.plan.moneyPerSec * 0.25) wanted = "company";
        if (wanted !== workKind || !currentWork) {
          workKind = wanted;
          if (wanted === "class") currentWork = classWork;
          else if (wanted === "program" && creatable)
            currentWork = new CreateProgramWork({ programName: creatable.name, singularity: true });
          else {
            Player.jobs[CompanyName.MegaCorp] = JobName.software0;
            currentWork = new CompanyWork({ companyName: CompanyName.MegaCorp, singularity: true });
          }
          Player.currentWork = currentWork;
        }
      }
      if (currentWork) {
        const expBefore = Player.exp.hacking;
        const done = currentWork.process(20);
        econ.workExp += Player.exp.hacking - expBefore;
        workSeconds[workKind] = (workSeconds[workKind] ?? 0) + STEP_SECONDS;
        if (done) {
          currentWork.finish(false, true);
          currentWork = null;
          workKind = "none";
          Player.currentWork = null;
        }
      }

      processCyberdeckComponentGains(0);
      checkSupplierChallenge();

      if (tSec >= nextCct) {
        nextCct += CCT_INTERVAL_SECONDS;
        gainCyberdeckComponentsFromCCT(1 + Math.floor(rng() * 10));
      }

      if (simMs >= netrunBusyUntil) {
        // Out of ROM and too few ICEBreakers for even the cheapest netrun: scrap the worst stored mods for ROM
        // (2 each with Scrapper done) until one ICEBreaker craft is affordable, instead of waiting forever
        const romStuck = () => {
          const c = CyberdeckState.components;
          return (
            c.iceBreakers < minimumNetrunCost(false) &&
            c.rom < ICEBreakerCraftingCost.rom &&
            c.chips >= ICEBreakerCraftingCost.chips &&
            c.neurodes >= ICEBreakerCraftingCost.neurodes
          );
        };
        if (romStuck()) {
          // First rewire: with ROM nearly gone, production mods are valued much higher, so a stored ROM producer gets
          // plugged in. Then scrap junk, and only if that runs out, the spare extensions / power supplies too.
          if (!romStuckRewired) {
            applyRack(optimizeRack(rng));
            romStuckRewired = true;
          }
          while (romStuck() && (salvageWorstStoredMod(true) || salvageWorstStoredMod(true, true))) romSalvages++;
        } else {
          romStuckRewired = false;
        }

        // Craft ICEBreakers up to a buffer. Above the ROM/chip floor, also craft up to an early netrun's premium cost.
        const aboveFloor = () =>
          CyberdeckState.components.rom >= PREMIUM_NETRUN_FLOOR &&
          CyberdeckState.components.chips >= PREMIUM_NETRUN_FLOOR;
        const cheapCost = Math.ceil(minimumNetrunCost(false) * 1.2);
        const iceTarget = () => (aboveFloor() ? Math.max(40, getCurrentNetrunningIceCost()) : 40);
        while (CyberdeckState.components.iceBreakers < iceTarget() && canAffordComponentCost(ICEBreakerCraftingCost)) {
          craftICEBreaker(1);
          if (!craftedIcebreakerTutorial) {
            completeCraftedIcebreakerTutorial();
            craftedIcebreakerTutorial = true;
          }
        }
        // Craft mods with spare cores/components
        const comps = CyberdeckState.components;
        // Spend spare cores on crafting (several per step), salvaging the worst stored mod to make room.
        // Prefer whichever recipe leans on the most plentiful components.
        let craftedThisStep = 0;
        while (
          comps.cores >= 1 &&
          comps.rom >= 60 &&
          comps.chips >= 60 &&
          comps.neurodes >= 60 &&
          craftedThisStep < 4
        ) {
          if (!moduleStorageAvailable() && !salvageWorstStoredMod(false)) break;
          const crafters = [craftProcessingModule, craftUplink, craftPowerSupply];
          const crafter =
            comps.neurodes > 2 * Math.max(comps.rom, comps.chips) && craftCycle % 3 !== 2
              ? craftUplink
              : crafters[craftCycle % crafters.length];
          craftCycle++;
          if (!crafter()) break;
          craftedThisStep++;
          consumeSkillChips(rng);
        }
        if (craftedThisStep) applyRack(optimizeRack(rng));
        // If the best layout still leaves rack slots empty while useful mods sit in storage, the rack is short on free
        // sockets: craft a power supply (a many-socket hub) for them to hang off. At most one a minute, and never
        // spending into the components the next ICEBreaker craft needs.
        if (tSec >= nextPowerSupplyCheck) {
          nextPowerSupplyCheck = tSec + 60;
          const plan = optimizeRack(rng);
          const placed = new Set(plan.rack);
          const usefulLeftOver = CyberdeckState.storedModules.some(
            (m) => m.type !== ModType.SkillChip && !placed.has(m.id) && modValue([m]) > 0.005,
          );
          const affordable =
            comps.cores >= powerSupplyCraftingCost.cores &&
            comps.rom >= powerSupplyCraftingCost.rom + ICEBreakerCraftingCost.rom &&
            comps.chips >= powerSupplyCraftingCost.chips + ICEBreakerCraftingCost.chips;
          if (plan.capacity() > plan.rack.length && usefulLeftOver && affordable) {
            if ((moduleStorageAvailable() || salvageWorstStoredMod(false)) && craftPowerSupply()) {
              powerSuppliesCrafted++;
              applyRack(optimizeRack(rng));
            }
          }
        }
        // Salvage worst stored mods so a netrun has room
        while (!moduleStorageAvailable()) {
          if (!salvageWorstStoredMod(true)) break;
        }
        // Netrun when it's cheap, or early (paying the trace-decay premium) while ROM and chips are above the floor
        const cost = getCurrentNetrunningIceCost();
        const ice = CyberdeckState.components.iceBreakers;
        if (ice >= cost && moduleStorageAvailable() && (cost <= cheapCost || aboveFloor())) {
          const target =
            Math.floor(tSec / NETRUN_BLOCK_SECONDS) % 2 === 0
              ? NetrunTargets.OmegaSoftware
              : NetrunTargets.OmniaCybersystems;
          const { moves, score } = runNetrunBot(target);
          const runMs = moves * 400;
          simMs += runMs; // finish() is evaluated at the end of the run
          netrunRewards();
          simMs -= runMs;
          netrunBusyUntil = simMs + runMs;
          netruns++;
          netrunScoreTotal += score;
          netrunScores.push(Math.round(score));
          consumeSkillChips(rng);
          applyRack(optimizeRack(rng));
          refreshMults();
          busyKind = "netrunning";
        } else if (corruptedReady()) {
          // Corrupted netrun: its own (higher) price and cooldown, so it fills the gaps between normal runs. Only at its
          // minimum price, and only while ROM and chips are above the floor after topping up ICEBreakers for it.
          const corruptedCost = getCurrentNetrunningIceCost(true);
          while (
            CyberdeckState.components.iceBreakers < corruptedCost &&
            aboveFloor() &&
            canAffordComponentCost(ICEBreakerCraftingCost)
          ) {
            craftICEBreaker(1);
          }
          if (CyberdeckState.components.iceBreakers >= corruptedCost) {
            const { moves, score, failed } = runNetrunBot(NetrunTargets.OmegaSoftware, true);
            const runMs = moves * 400;
            simMs += runMs;
            if (failed) corruptedFailures++;
            else netrunRewards();
            simMs -= runMs;
            netrunBusyUntil = simMs + runMs;
            corruptedRuns++;
            corruptedScores.push(Math.round(score));
            consumeSkillChips(rng);
            applyRack(optimizeRack(rng));
            refreshMults();
            busyKind = "corrupted netrunning";
          }
        } else {
          // Idle this step: say which component is most in demand for netrunning right now, i.e. the one furthest
          // from covering the ICEBreakers the current (premium) netrun cost needs
          let reason: string;
          if (!moduleStorageAvailable()) reason = "storage full";
          else {
            const c = CyberdeckState.components;
            const crafts = Math.max(1, Math.ceil((cost - ice) / 10));
            const demand = (k: "rom" | "chips" | "neurodes") =>
              (crafts * ICEBreakerCraftingCost[k]) / Math.max(1, c[k]);
            const worst = (["rom", "chips", "neurodes"] as const).reduce((a, b) => (demand(b) > demand(a) ? b : a));
            reason = `short of ${worst}`;
            shortSeconds[worst] += STEP_SECONDS;
          }
          deckTime[reason] = (deckTime[reason] ?? 0) + STEP_SECONDS;
        }
      } else {
        deckTime[busyKind] = (deckTime[busyKind] ?? 0) + STEP_SECONDS;
      }
    }

    if (tSec > 0 && tSec % PROGRESS_EVERY_SECONDS === 0) {
      const deck = isCyberdeck
        ? ` deckHack=x${getCyberdeckStatBonuses(1).playerMults.hacking.toFixed(
            3,
          )} netrunLvl=${CyberdeckState.netrunningLevel.toFixed(1)} netruns=${netruns} rack=${
            CyberdeckState.installedModules.length
          }/${getCurrentRackSize()}`
        : "";
      logProgress(
        `${kind} seed ${seed} | ${(tSec / 3600).toFixed(1)}h/${SIM_HOURS}h | hack=${
          Player.skills.hacking
        } ram=${formatRam(econ.totalRam)}${deck} | ${((realNow() - wallStart) / 1000).toFixed(0)}s wall`,
      );
    }

    if (tSec - lastRecord >= RECORD_EVERY_SECONDS) {
      lastRecord = tSec;
      econ.replanIfNeeded(batcherRam());
      const m = Player.mults;
      const extra: Record<string, number | string> = {};
      let best = { mult: m.hacking, hack: Player.skills.hacking };
      if (isCyberdeck) {
        const b = bestHackBuild(bestBuildRng, bestBuildModel);
        bestBuildModel = b.model;
        hackBuildKeep = new Set(b.model.rack);
        best = b;
        extra.bestDeckHack = b.deckHack;
        const deck = getCyberdeckStatBonuses(0);
        extra.deckHacking = deck.playerMults.hacking;
        extra.deckHackExp = deck.playerMults.hacking_exp;
        extra.deckHackSpeed = deck.playerMults.hacking_speed;
        extra.deckHackMoney = deck.playerMults.hacking_money;
        extra.netruns = netruns;
        extra.rom = Math.floor(CyberdeckState.components.rom);
        extra.chips = Math.floor(CyberdeckState.components.chips);
        extra.neurodes = Math.floor(CyberdeckState.components.neurodes);
        extra.cores = CyberdeckState.components.cores;
        extra.ice = CyberdeckState.components.iceBreakers;
        extra.deckLevel = getCyberdeckLevel();
        extra.netrunLvl = CyberdeckState.netrunningLevel;
        extra.craftLvl = CyberdeckState.craftingLevel;
        extra.cooldownLvl = CyberdeckState.netrunningCooldownLevel;
        extra.storage = CyberdeckState.modStorageSize;
        extra.avgScore = netruns ? netrunScoreTotal / netruns : 0;
        extra.skillChips = skillChipsConsumed;
        extra.romSalvages = romSalvages;
        extra.chargedMods = getChargedModuleIDs().length - 1;
        extra.work = workKind;
      }
      if (goPlayer) extra.goGames = goPlayer.games;
      samples.push({
        t: tSec / 60,
        hack: Player.skills.hacking,
        hackMult: m.hacking,
        bestHackMult: best.mult,
        bestHack: best.hack,
        hackExpMult: m.hacking_exp,
        hackSpeedMult: m.hacking_speed,
        hackMoneyMult: m.hacking_money,
        ram: Math.round(econ.totalRam),
        mechanicRam: Math.round(mechanicRam),
        moneyPerSec: econ.plan.moneyPerSec,
        batches: Math.round(econ.plan.batches),
        idleRam: Math.round(econ.plan.idleRam),
        target: econ.plan.target?.hostname ?? "",
        extra,
      });
    }
  }

  if (isCyberdeck) {
    // End of the run: rewire everything owned for the highest hacking level, ignoring production/economy stats
    const before = { hack: Player.skills.hacking, deckHack: getCyberdeckStatBonuses(1).playerMults.hacking };
    finalHackOnlyValuation = true;
    try {
      applyRack(optimizeRack(rng, FINAL_BUILD_TRIALS, bestBuildModel));
    } finally {
      finalHackOnlyValuation = false;
    }
    Player.applyEntropy(Player.entropy);
    const after = { hack: Player.skills.hacking, deckHack: getCyberdeckStatBonuses(1).playerMults.hacking };
    summary.beforeFinalBuild = before;
    summary.afterFinalBuild = after;
    // The last sample reflects the final build
    const last = samples[samples.length - 1];
    last.hack = Player.skills.hacking;
    last.hackMult = Player.mults.hacking;
    summary.lastBestEstimate = { mult: last.bestHackMult, hack: last.bestHack };
    last.bestHackMult = Math.max(last.bestHackMult, Player.mults.hacking);
    last.bestHack = Math.max(last.bestHack, Player.skills.hacking);
    if (last.extra) {
      last.extra.deckHacking = after.deckHack - 1;
      last.extra.chargedMods = getChargedModuleIDs().length - 1;
    }
    logProgress(
      `${kind} seed ${seed} | final hack build | hack ${before.hack} -> ${after.hack}, deck x${before.deckHack.toFixed(
        3,
      )} -> x${after.deckHack.toFixed(3)}`,
    );
  }

  summary.finalHack = Player.skills.hacking;
  logProgress(
    `${kind} seed ${seed} | finished | hack=${Player.skills.hacking} | ${((realNow() - wallStart) / 1000).toFixed(
      0,
    )}s wall`,
  );
  summary.batchExp = econ.batchExp;
  summary.workExp = econ.workExp;
  summary.finalRam = econ.totalRam;
  if (goPlayer) {
    summary.goGames = goPlayer.games;
    summary.goChips = goPlayer.chips;
    summary.goStats = structuredClone(Go.stats);
  }
  if (isCyberdeck) {
    summary.netruns = netruns;
    summary.avgNetrunScore = netruns ? netrunScoreTotal / netruns : 0;
    summary.netrunScores = netrunScores;
    summary.componentStats = structuredClone(CyberdeckState.componentStats);
    summary.deckTime = deckTime;
    summary.shortSeconds = shortSeconds;
    summary.powerSuppliesCrafted = powerSuppliesCrafted;
    summary.corruptedRuns = corruptedRuns;
    summary.corruptedFailures = corruptedFailures;
    summary.corruptedScores = corruptedScores;
    summary.components = structuredClone(CyberdeckState.components);
    summary.tutorialSteps = structuredClone(CyberdeckState.tutorialSteps);
    summary.levels = {
      netrunning: CyberdeckState.netrunningLevel,
      crafting: CyberdeckState.craftingLevel,
      cooldown: CyberdeckState.netrunningCooldownLevel,
      storage: CyberdeckState.modStorageSize,
      deckLevel: getCyberdeckLevel(),
    };
    summary.completedChallenges = Object.entries(CyberdeckState.completedChallenges)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const chargedIds = getChargedModuleIDs();
    summary.chargedMods = CyberdeckState.installedModules
      .filter((m) => chargedIds.includes(m.id))
      .map((m) => ({ type: m.type, rarity: m.rarity, stats: m.stats }));
    // The exact final rack: order, sockets, wiring, stats
    summary.finalRack = {
      rackSize: getCurrentRackSize(),
      ioSockets: getCyberdeckIOPanel().sockets,
      mods: CyberdeckState.installedModules.map((m, position) => ({
        position,
        id: m.id,
        type: m.type,
        brand: m.brand,
        rarity: m.rarity,
        charged: chargedIds.includes(m.id),
        sockets: m.sockets,
        stats: m.stats,
      })),
      wires: CyberdeckState.connections.map(([a, b]) => ({ from: a.modId, to: b.modId, color: a.socketIndex })),
    };
    summary.skillChipsConsumed = skillChipsConsumed;
    summary.romSalvages = romSalvages;
    summary.workSeconds = workSeconds;
    summary.layoutMismatches = layoutMismatches;
    summary.mismatchReasons = mismatchReasons;
    summary.deckBonuses = getCyberdeckStatBonuses(0).playerMults;
  }
  if (kind === "stanek") {
    summary.stanekFragments = staneksGift.fragments
      .filter((f) => f.fragment().type !== FragmentTypeEnum.Booster)
      .map((af) => ({
        type: af.fragment().type,
        highestCharge: af.highestCharge,
        numCharge: af.numCharge,
        effect: staneksGift.effect(af),
      }));
  }

  Player.currentWork = null;
  randomSpy.mockRestore();
  nowSpy.mockRestore();
  return { name: kind, seed, samples, summary };
}

// ------------------------------------------------------------------------------------------------
const results: ScenarioResult[] = [];

describe(`Hacking level bonus comparison (${SIM_HOURS}h fresh bitnode)`, () => {
  beforeAll(() => {
    initGameEnvironment();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
    if (process.env.SIM_PROGRESS_APPEND !== "1") fs.writeFileSync(PROGRESS_FILE, "");
    logProgress(`suite started: ${runTotal} runs`);
  });

  afterAll(() => {
    const resultsFile = path.join(OUT_DIR, process.env.SIM_RESULTS_FILE ?? "hacking-bonus-sim.json");
    fs.writeFileSync(resultsFile, JSON.stringify(results));
    logProgress(`suite finished: results written to ${resultsFile}`);
  });

  const deckSeeds = () => Array.from({ length: CYBERDECK_SEED_COUNT }, randomSeed);
  const allScenarios: [ScenarioKind, number[]][] = [
    ["baseline", [randomSeed()]],
    ["stanek", [randomSeed()]],
    ["go-illuminati", [randomSeed()]],
    ["go-wd", [randomSeed()]],
    ["cyberdeck-focus", deckSeeds()],
    ["cyberdeck-nofocus", deckSeeds()],
  ];
  // Optional filtering / fixed seeds, used by runParallel.js to give each jest process one slice
  const kindFilter = process.env.SIM_SCENARIOS?.split(",").filter(Boolean);
  const fixedSeeds = process.env.SIM_SEEDS?.split(",").filter(Boolean).map(Number);
  const scenarios = allScenarios
    .filter(([kind]) => !kindFilter || kindFilter.includes(kind))
    .map(([kind, seeds]): [ScenarioKind, number[]] => [kind, fixedSeeds ?? seeds]);
  runTotal = scenarios.reduce((n, [, seeds]) => n + seeds.length, 0);
  for (const [kind, seeds] of scenarios) {
    for (const seed of seeds) {
      test(
        `${kind} seed ${seed}`,
        () => {
          runIndex++;
          const result = runScenario(kind, seed);
          results.push(result);
          expect(result.samples.length).toBeGreaterThan(SIM_HOURS * 50);
          expect(result.summary.finalHack).toBeGreaterThan(1);
        },
        30 * 60 * 1000,
      );
    }
  }
});
