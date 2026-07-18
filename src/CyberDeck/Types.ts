import { Multipliers } from "../PersonObjects/Multipliers";

export type DeckModule = {
  id: string;
  level: number;
  sockets: SocketList;
  type: ModuleType;
  stats?: ModuleStats | null;
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
  netrunning: number
}
export type ModuleStats = {
  playerMults?: Partial<Multipliers> | null;
  otherMults?: Partial<MiscMults> | null;
  extraRackSlots?: number;
  consumableStats?: ConsumableStats;
};
export type CyberdeckStats = {
  playerMults: Multipliers;
  otherMults: MiscMults;
  extraRackSlots: number;
  consumableStats?: ConsumableStats;
};

export type MiscMults = {
  cyberdeckCraftingSpeed: number;
}