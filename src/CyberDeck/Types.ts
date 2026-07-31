import { Multipliers } from "../PersonObjects/Multipliers";

export type DeckModule = {
  id: string;
  level: number;
  sockets: SocketList;
  type: ModuleType;
  stats?: ModuleStats | undefined;
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
  netrunning: number,
  netrun_cooldown: number,
  mod_storage: number,
}
export type ModuleStats = {
  playerMults?: Partial<Multipliers> | null;
  otherMults?: Partial<MiscMults> | null;
  extraRackSlots?: number;
  consumableStats?: Partial<ConsumableStats>;
  endgameStats?: Partial<EndgameMults>;
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
  endgameStats?: EndgameMults;
};

export type MiscMults = {
  romProduction: number;
  chipProduction: number;
  neurodeProduction: number;
  program_creation_speed: number;
  crime_speed: number;
  stock_commission: number;
  cct_money: number;
  IPvGO_power: number;
};

export type EndgameMults = {
  bladeburner_stamina_gain: number;
  graft_speed: number;
  sleeve_sync: number;
  stanek_charge: number;
};

export type ComponentStats = {
  ROM: {
    backdoors: number;
    caches: number;
    pettyCrime: number;
    programs: number;
  };
  chips: {
    hacknet: number;
    companyWork: number;
    IPvGO: number;
  };
  neurodes: {
    kills: number;
    class: number;
    codingContracts: number;
  };
};