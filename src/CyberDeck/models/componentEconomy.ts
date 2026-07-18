import { CyberDeckState, minCyclesToProcess } from "./CyberDeckState";
import { Player } from "@player";
import { isMember } from "../../utils/EnumHelper";
import { Companies } from "../../Company/Companies";

let lastKillCount: number | null = null;
let lastCrimeMoney: number | null = null;
let lastTotalWorkRep: number | null = null;

export function gainCyberdeckComponents(cycles: number) {
  CyberDeckState.storedCycles += cycles;
  initStats();

  if (CyberDeckState.storedCycles < minCyclesToProcess || lastKillCount === null || lastTotalWorkRep === null || lastCrimeMoney === null) {
    return;
  }
  CyberDeckState.storedCycles -= minCyclesToProcess;

  // Violent crime gives neurodes
  // TODO-fico: classes and ccts should give neurodes
  if (Player.numPeopleKilled > lastKillCount) {
    const newNeurodes = (Player.numPeopleKilled - lastKillCount);
    CyberDeckState.components.neurodes += newNeurodes;
    CyberDeckState.componentStats.neurodes.kills += newNeurodes;
    lastKillCount = Player.numPeopleKilled;
    lastCrimeMoney = Player.moneySourceA.crime;
  }
  // Petty crime gives ROM
  // TODO-fico: nuke/backdoor, caches, programs should also give ROM
  else if (Player.moneySourceA.crime > lastCrimeMoney) {
    const newMoney = Player.moneySourceA.crime - lastCrimeMoney;
    const newROM = 0.1 + (10 * newMoney + 1e7) / (newMoney + 1e7);
    CyberDeckState.components.ROM += newROM;
    CyberDeckState.componentStats.ROM.pettyCrime += newROM;
    lastCrimeMoney = Player.moneySourceA.crime;
  }

  // Working gives chips
  // TODO-fico: hacknet and IPvGO should also give chips
  if (getAllWorkRep() > lastTotalWorkRep) {
    const newRep = getAllWorkRep() - lastTotalWorkRep;
    const newChips = 0.1 + (10 * newRep + 1000) / (newRep + 1000);
    CyberDeckState.components.chips += newChips;
    CyberDeckState.componentStats.chips.companyWork += newChips;
    lastTotalWorkRep = getAllWorkRep();
  }


}

function initStats() {
  if (lastKillCount === null) {
    lastKillCount = Player.numPeopleKilled;
  }
  if (lastCrimeMoney === null) {
    lastCrimeMoney = Player.moneySourceA.crime;
  }
  if (lastTotalWorkRep === null) {
    lastTotalWorkRep = getAllWorkRep();
  }
}

function getAllWorkRep() {
  const employers = Object.keys(Player.jobs);
  let total = 0;

  for (const companyName of employers) {
    if (!isMember("CompanyName", companyName)) continue;
    const company = Companies[companyName];
    total += company?.playerReputation ?? 0;

  }
  return total;
}