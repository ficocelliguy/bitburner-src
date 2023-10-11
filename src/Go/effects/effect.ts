import { currentNodeMults } from "../../BitNode/BitNodeMultipliers";
import { opponentDetails, opponents } from "../boardState/goConstants";
import { floor } from "../boardState/boardState";
import { Player } from "@player";

/**
 * Calculates the effect size of the given player boost, based on the node power (points based on number of subnet
 * nodes captured and player wins) and effect power (scalar for individual boosts)
 */
export function CalculateEffect(nodes: number, faction: opponents): number {
  const power = getEffectPowerForFaction(faction);
  return 1 + (Math.log(nodes + 1) / 200) * Math.pow((nodes + 1) / 3, 0.2) * power * currentNodeMults.GoPower;
}

export function getBonusText(opponent: opponents) {
  const nodePower = Player.go.status[opponent].nodePower;
  const effectSize = formatPercent(CalculateEffect(nodePower, opponent));
  const effectDescription = getEffectTypeForFaction(opponent);
  return `${effectSize}% ? ${effectDescription} ?`;
}

function formatPercent(n: number) {
  return floor((n - 1) * 10000) / 100;
}

function getEffectPowerForFaction(opponent: opponents) {
  return opponentDetails[opponent].bonusPower;
}

export function getEffectTypeForFaction(opponent: opponents) {
  return opponentDetails[opponent].bonusDescription;
}

export function getWinstreakMultiplier(winStreak: number) {
  return 1.2 ** (winStreak - 1);
}

export function getDifficultyMultiplier(komi: number) {
  return (komi + 0.5) * 0.25;
}
