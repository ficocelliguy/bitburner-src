import { currentNodeMults } from "../../BitNode/BitNodeMultipliers";
import { opponents } from "../boardState/goConstants";

export function CalculateEffect(nodes: number, faction: opponents): number {
  const power = getEffectPowerForFaction(faction);
  return 1 + (Math.log(nodes + 1) / 60) * Math.pow((nodes + 1) / 5, 0.07) * power * currentNodeMults.GoPower;
}

function getEffectPowerForFaction(opponent: opponents) {
  switch (opponent) {
    case opponents.Netburners:
      return -1.5;
    case opponents.SlumSnakes:
      return 1.1;
    case opponents.TheBlackHand:
      return 0.8;
    case opponents.Daedalus:
      return 0.9;
    case opponents.Illuminati:
      return 0.6;
    default:
      return 0.9;
  }
}

export function getEffectTypeForFaction(opponent: opponents) {
  switch (opponent) {
    case opponents.Netburners:
      return "hacknet cost";
    case opponents.SlumSnakes:
      return "crime money";
    case opponents.TheBlackHand:
      return "hacking exp";
    case opponents.Daedalus:
      return "reputation gain";
    case opponents.Illuminati:
      return "grow() power";
    default:
      return 0.9;
  }
}
