export type DeckModule = {
  id: string;
  level: number;
  sockets: SocketList;
  type: ModuleType;
  stats?: null;
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