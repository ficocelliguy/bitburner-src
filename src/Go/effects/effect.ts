import { currentNodeMults } from "../../BitNode/BitNodeMultipliers";
import { opponentDetails, opponents } from "../boardState/goConstants";

/**
 * Calculates the effect size of the given player boost, based on the node power (points based on number of subnet
 * nodes captured and player wins) and effect power (scalar for individual boosts)
 */
export function CalculateEffect(nodes: number, faction: opponents): number {
  const power = getEffectPowerForFaction(faction);
  return 1 + (Math.log(nodes + 1) / 200) * Math.pow((nodes + 1) / 3, 0.2) * power * currentNodeMults.GoPower;
}

function getEffectPowerForFaction(opponent: opponents) {
  return opponentDetails[opponent].bonusPower;
}

export function getEffectTypeForFaction(opponent: opponents) {
  return opponentDetails[opponent].bonusDescription;
}
