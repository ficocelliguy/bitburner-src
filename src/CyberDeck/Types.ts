export type DeckModule = {
  id: string;
  sockets: SocketList;
  type: ModuleType;
  stats?: null;
  extraRackSlots: number;
};
export type SocketList = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Connection = [Socket, Socket];
export type Socket = {
  moduleId: string;
  socketIndex: number;
};

export enum ModuleType {
  PowerSupply = "Power Supply",
  ProcessingModule = "Processing Module",
  Uplink="Uplink",
  RackExtension="Rack Extension",
  SkillChip = "SkillChip",
}