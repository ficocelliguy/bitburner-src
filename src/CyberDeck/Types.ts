import { Multipliers } from "../PersonObjects/Multipliers";

export type DeckModule = {
  id: string;
  level: number;
  sockets: SocketList;
  type: ModuleType;
  stats?: ModuleStats | null;
  extraRackSlots?: number;
  consumableStats?: ConsumableStats;
};
export type SocketList = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Connection = [Socket, Socket];
export type Socket = {
  moduleId: string;
  socketIndex: number;
};

export enum ModuleType {
  DeckConnection = "Deck Connection",
  PowerSupply = "Power Supply",
  ProcessingModule = "Processing Module",
  Uplink="Uplink",
  RackExtension="Rack Extension",
  SkillChip = "SkillChip",
}

export type ConsumableStats = {
  netrunningBoost: number
}
export type ModuleStats = {
  playerMults?: Partial<Multipliers> | null;
  otherMults?: Partial<MiscMults> | null;
};
export type CyberdeckStats = {
  playerMults: Multipliers;
  otherMults: MiscMults;
};

export type MiscMults = {
  cyberdeckCraftingSpeed: number;
}