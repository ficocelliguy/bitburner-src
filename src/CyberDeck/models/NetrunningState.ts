import { NetrunEntity } from "../Types";

export const NETRUNNING_WIDTH = 20;
export const NETRUNNING_HEIGHT = 15;

export const GRID_SIZE = 30;

export const NetrunningState = {
  isNetrunning: false,
  corrupted: false,
  shaking: false,
  shakingBattery: false,
  location: [0, 0], // [y, x] — matches grid[y][x] indexing

  grid: [] as NetrunEntity[][],
  groups: {} as Record<string, NetrunEntity[]>,
  energy: 1,
  rewardScore: 0,
};
