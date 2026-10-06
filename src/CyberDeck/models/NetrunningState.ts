import { NetrunEntity } from "../Types";
import { Brand, NetrunDirection, NetrunTargets } from "@enums";

export const NETRUNNING_WIDTH = 20;
export const NETRUNNING_HEIGHT = 15;

export const GRID_SIZE_PX = 30;

export const NetrunningState = {
  isNetrunning: false,
  showNetrunOverride: false,
  target: Brand.Unknown as NetrunTargets | Brand.Unknown,
  corrupted: false,
  shaking: false,
  shakingBattery: false,
  location: [0, 0], // [y, x] — matches grid[y][x] indexing
  lastMove: NetrunDirection.right,

  grid: [] as NetrunEntity[][],
  groups: {} as Record<string, NetrunEntity[]>,
  energy: 1,
  rewardScore: 0,
  steps: 0,
};
