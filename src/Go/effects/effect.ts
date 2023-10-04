import { currentNodeMults } from "../../BitNode/BitNodeMultipliers";

export function CalculateEffect(nodes: number, power: number): number {
  return 1 + (Math.log(nodes + 1) / 60) * Math.pow((nodes + 1) / 5, 0.07) * power * currentNodeMults.GoPower;
}
