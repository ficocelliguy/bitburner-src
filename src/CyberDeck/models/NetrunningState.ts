
export const NETRUNNING_WIDTH = 20;
export const NETRUNNING_HEIGHT = 15;

export const GRID_SIZE = 30;

export const NetrunningState = {
  isNetrunning: false,
  corrupted: false,
  shaking: false,
  shakingBattery: false,
  location: [0, 0],
  grid: [] as NetrunEntity[][],
  groups: {} as Record<string, NetrunEntity[]>,
  energy: 1,
  rewardScore: 0,
};

export type NetrunEntity = {
  type: netrunEntityVariantType;
  group: number;
  hits: number;
  threat: number;
  hasBomb: boolean;
  visible: boolean;
  x: number;
  y: number;
};

export const netrunEntityVariant = {
  empty: "empty",
  ice: "ice",
  firewall: "firewall",
  dataStore: "dataStore",
  offline: "offline",
} as const;

export type netrunEntityVariantType = typeof netrunEntityVariant[keyof typeof netrunEntityVariant];

export const netrunDirections = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
} as const;

export type netrunDirectionType = typeof netrunDirections[keyof typeof netrunDirections];
