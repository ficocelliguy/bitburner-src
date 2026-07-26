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
  endgameStats?: EndgameMults;
};

export type ComponentCounts = {
  ROM: number;
  neurodes: number;
  chips: number;
  ICE: number;
}

export type CyberdeckStats = {
  playerMults: Multipliers;
  otherMults: MiscMults;
  extraRackSlots: number;
  consumableStats?: ConsumableStats;
};

export type MiscMults = {
  romProduction: number;
  chipProduction: number;
  neurodeProduction: number;
  program_creation_speed: number;
  crime_speed: number;
  stock_commission: number;
};

export type EndgameMults = {
  bladeburner_stamina_gain: number;
  graft_speed: number;
  sleeve_sync: number;
  stanek_charge: number;
};