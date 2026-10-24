import { CyberdeckState, hasCyberdeck } from "./CyberdeckState";
import { minCyclesToProcess, NEURODES_PER_ASSASSINATION, NEURODES_PER_HOMICIDE } from "./constants";
import { Crime } from "../../Crime/Crime";
import { CrimeType } from "@enums";
import { ComponentCounts, SimpleComponentCounts } from "../Types";
import { checkSupplierChallenge } from "./challenges";
import {
  getCyberdeckComponentsFromHacknetIncome,
  getCyberdeckComponentsFromMods,
  getCyberdeckComponentsFromWork,
  getNeurodesFromCortexShare,
} from "../effects";

export function gainCyberdeckComponents(cycles: number, hacknetMoney = 0) {
  if (!hasCyberdeck()) {
    return;
  }
  CyberdeckState.storedCycles += cycles;

  if (CyberdeckState.storedCycles < minCyclesToProcess) {
    return;
  }
  CyberdeckState.storedCycles -= minCyclesToProcess;

  processCyberdeckComponentGains(hacknetMoney);

  checkSupplierChallenge();
}

export function processCyberdeckComponentGains(
  hacknetMoney = 0,
  time = minCyclesToProcess,
  crimeGains: Partial<SimpleComponentCounts> = {},
) {
  const ticks = time / minCyclesToProcess;
  const componentsGained = [
    getCyberdeckComponentsFromHacknetIncome(hacknetMoney, ticks),
    getCyberdeckComponentsFromWork(ticks),
    getCyberdeckComponentsFromMods(ticks),
    getNeurodesFromCortexShare(ticks),
    crimeGains,
  ];
  return componentsGained.reduce<ComponentCounts>(
    (acc, c) => ({
      chips: acc.chips + (c.chips ?? 0),
      neurodes: acc.neurodes + (c.neurodes ?? 0),
      rom: acc.rom + (c.rom ?? 0),
      cores: 0,
      iceBreakers: 0,
    }),
    { chips: 0, neurodes: 0, rom: 0, cores: 0, iceBreakers: 0 },
  );
}

export function getCrimeComponentReward(crime: Crime, isSleeve = false): Partial<ComponentCounts> {
  const scalar = isSleeve ? 0.3 : 1;
  if (crime.type === CrimeType.homicide) {
    return { neurodes: NEURODES_PER_HOMICIDE * scalar };
  }
  if (crime.type === CrimeType.assassination) {
    return { neurodes: NEURODES_PER_ASSASSINATION * scalar };
  }

  const newRom = (0.1 + (10 * crime.money + 1e7) / (crime.money + 1e7)) * (crime.time / 10000) * scalar;
  return { rom: newRom };
}

export function gainCrimeComponentReward(crime: Crime, isSleeve = false) {
  const { neurodes = 0, rom = 0 } = getCrimeComponentReward(crime, isSleeve);

  CyberdeckState.components.neurodes += neurodes;
  CyberdeckState.componentStats.neurodes.kills += neurodes;

  CyberdeckState.components.rom += rom;
  CyberdeckState.componentStats.rom.pettyCrime += rom;
}

export function prestigeCyberdeckComponents() {
  CyberdeckState.components = {
    chips: 0,
    rom: 0,
    neurodes: 0,
    cores: 0,
    iceBreakers: 0,
  };
  CyberdeckState.componentStats = {
    rom: {
      backdoors: 0,
      caches: 0,
      pettyCrime: 0,
      programs: 0,
      netrunning: 0,
      mods: 0,
    },
    chips: {
      hacknet: 0,
      companyWork: 0,
      IPvGO: 0,
      netrunning: 0,
      mods: 0,
    },
    neurodes: {
      kills: 0,
      class: 0,
      codingContracts: 0,
      cortexShare: 0,
      netrunning: 0,
      mods: 0,
    },
    cores: {
      netrunning: 0,
    },
  };
}
