import { Multipliers } from "../PersonObjects/Multipliers";

export type DeckMod = {
  id: string;
  level: number;
  sockets: SocketList;
  type: ModType;
  favorite?: boolean;
  stats: ModStats;
};
export type SocketList = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Connection = [Socket, Socket];
export type Socket = {
  modId: string;
  socketIndex: number;
};

export enum ModType {
  CyberdeckIOPanel = "Deck I/O Panel",
  PowerSupply = "Power Supply",
  ProcessingMod = "Processing Mod",
  Uplink = "Uplink",
  RackExtension = "Rack Extension",
  SkillChip = "SkillChip",
}

export type ConsumableStats = {
  netrunning_lvl: number;
  netrun_cooldown_lvl: number;
  mod_storage: number;
  crafting_lvl: number;
};
export type ModStats = {
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
  cores: number;
  ICE: number;
}

export type CyberdeckStats = {
  playerMults: Multipliers;
  otherMults: MiscMults;
  extraRackSlots: number;
  consumableStats: ConsumableStats;
  endgameStats: EndgameMults;
};

export type MiscMults = {
  romProduction: number;
  chipProduction: number;
  neurodeProduction: number;
  program_creation_speed: number;
  crime_speed: number;
  stock_fees: number;
  cct_money: number;
  IPvGO_power: number;
  class_cost: number;
};

export type EndgameMults = {
  stamina_gain: number;
  graft_speed: number;
  sleeve_sync: number;
  stanek_charge: number;
  equipment_cost: number;
};

export type ComponentStats = {
  ROM: {
    backdoors: number;
    caches: number;
    pettyCrime: number;
    programs: number;
    netrunning: number;
  };
  chips: {
    hacknet: number;
    companyWork: number;
    IPvGO: number;
    netrunning: number;
  };
  neurodes: {
    kills: number;
    class: number;
    codingContracts: number;
    netrunning: number;
  };
  cores: {
    netrunning: number;
  }
};

export type NetrunningRewards = {
  success: boolean;
  mods: DeckMod[];
  components: Partial<ComponentCounts>;
};

export type ModKey =
  | keyof CyberdeckStats["playerMults"]
  | keyof CyberdeckStats["otherMults"]
  | keyof CyberdeckStats["endgameStats"]
  | keyof CyberdeckStats["consumableStats"]
  | "extraRackSlots";

export const statBonusShortNames: {
  [key in ModKey]: string;
} = {
  // Player Multipliers
  hacking: "Hack Lvl",
  hacking_chance: "Hack Chance",
  hacking_exp: "Hack XP",
  strength: "Strength",
  strength_exp: "Strength XP",
  defense: "Defense",
  defense_exp: "Defense XP",
  dexterity: "Dexterity",
  dexterity_exp: "Dexterity XP",
  agility: "Agility",
  agility_exp: "Agility XP",
  charisma: "Charisma",
  charisma_exp: "Charisma XP",
  hacknet_node_money: "Hnet Money",
  hacknet_node_ram_cost: "Hnet RAM Cost",
  hacknet_node_core_cost: "Hnet Core Cost",
  hacknet_node_level_cost: "Hnet Lvl Cost",
  company_rep: "Company Rep",
  work_money: "Work Money",
  crime_success: "Crime Success",
  crime_money: "Crime Money",

  // Other Multipliers
  romProduction: "ROM/cycle",
  chipProduction: "Chip/cycle",
  neurodeProduction: "Neurode/cycle",
  program_creation_speed: "Program Speed",
  crime_speed: "Crime Speed",
  stock_fees: "Stock Fees",
  cct_money: "CCT Money",
  IPvGO_power: "IPvGO Power",
  class_cost: "Class Cost",

  // Consumable Stats
  netrunning_lvl: "Netrunning Lvl",
  netrun_cooldown_lvl: "Trace CD",
  mod_storage: "Mod Storage",
  crafting_lvl: "Crafting Lvl",

  // Endgame Multipliers
  stamina_gain: "Stamina Gain",
  graft_speed: "Graft Speed",
  sleeve_sync: "Sleeve Sync",
  stanek_charge: "Stanek Charge",
  equipment_cost: "Equipment Cost",

  // Extra Rack Slots
  extraRackSlots: "Mod Rack Slots",

  // unused
  hacking_speed: "",
  hacking_money: "",
  hacking_grow: "",
  hacknet_node_purchase_cost: "",
  faction_rep: "",
  dnet_money: "",
  bladeburner_max_stamina: "",
  bladeburner_stamina_gain: "",
  bladeburner_analysis: "",
  bladeburner_success_chance: "",
} as const;

export const statBonusLongNames: {
  [key in
    | keyof CyberdeckStats["playerMults"]
    | keyof CyberdeckStats["otherMults"]
    | keyof CyberdeckStats["endgameStats"]
    | keyof CyberdeckStats["consumableStats"]
    | "extraRackSlots"]: string;
} = {
  // Player Multipliers
  hacking: "Hack Lvl",
  hacking_chance: "Hack Success Chance",
  hacking_exp: "Hack Experience",
  strength: "Strength Level",
  strength_exp: "Strength Experience",
  defense: "Defense Level",
  defense_exp: "Defense Experience",
  dexterity: "Dexterity Level",
  dexterity_exp: "Dexterity Experience",
  agility: "Agility Level",
  agility_exp: "Agility Experience",
  charisma: "Charisma Level",
  charisma_exp: "Charisma Experience",
  hacknet_node_money: "Hacknet Money",
  hacknet_node_ram_cost: "Hacknet RAM Cost",
  hacknet_node_core_cost: "Hacknet Core Cost",
  hacknet_node_level_cost: "Hacknet Level Cost",
  company_rep: "Company/Work Reputation",
  work_money: "Work Money",
  crime_success: "Crime Success Chance",
  crime_money: "Crime Money",

  // Other Multipliers
  romProduction: "ROM Production Per Cycle",
  chipProduction: "Chip Production Per Cycle",
  neurodeProduction: "Neurode Production Per Cycle",
  program_creation_speed: "Program/.EXE Creation Speed",
  crime_speed: "Crime Speed",
  stock_fees: "Stock Commission Costs",
  cct_money: "Coding Contract .cct Money",
  IPvGO_power: "IPvGO Node Power",
  class_cost: "University/Gym Class Cost",

  // Consumable Stats
  netrunning_lvl: "Netrunning Loot Level",
  netrun_cooldown_lvl: "Netrun Trace Cooldown Level",
  mod_storage: "Mod Storage",
  crafting_lvl: "Mod Crafting Level",

  // Endgame Multipliers
  stamina_gain: "Bladeburner Stamina Gain",
  graft_speed: "Graft Speed",
  sleeve_sync: "Sleeve Sync Speed",
  stanek_charge: "Stanek Charge Boost",
  equipment_cost: "Gang Equipment Cost",

  // Extra Rack Slots
  extraRackSlots: "Extra Mod Rack Slots",

  // unused
  hacking_speed: "",
  hacking_money: "",
  hacking_grow: "",
  hacknet_node_purchase_cost: "",
  faction_rep: "",
  dnet_money: "",
  bladeburner_max_stamina: "",
  bladeburner_stamina_gain: "",
  bladeburner_analysis: "",
  bladeburner_success_chance: "",
} as const;