import type { Multipliers } from "@nsdefs";
import { Brand, Challenges, ModType, NetrunDirection, NetrunEntityVariant } from "./Enums";

export type DeckMod = {
  id: string;
  rarity: number;
  sockets: SocketList;
  brand: Brand;
  type: ModType;
  stats: ModStats;
  favorite?: boolean;
  corrupted?: boolean;
  charged?: boolean;
};
export type SocketList = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Connection = [Socket, Socket];
export type Socket = {
  modId: string;
  socketIndex: number;
};

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
  endgameMults?: Partial<EndgameMults>;
};

export type ComponentCounts = {
  rom: number;
  neurodes: number;
  chips: number;
  cores: number;
  iceBreakers: number;
};

export type SimpleComponentCounts = {
  rom: number;
  neurodes: number;
  chips: number;
};

export type CyberdeckStats = {
  playerMults: Multipliers;
  otherMults: MiscMults;
  extraRackSlots: number;
  consumableStats: ConsumableStats;
  endgameMults: EndgameMults;
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
  int_exp: number;
};

export type ComponentStats = {
  rom: {
    backdoors: number;
    caches: number;
    pettyCrime: number;
    programs: number;
    netrunning: number;
    mods: number;
  };
  chips: {
    hacknet: number;
    companyWork: number;
    IPvGO: number;
    netrunning: number;
    mods: number;
  };
  neurodes: {
    kills: number;
    class: number;
    codingContracts: number;
    cortexShare: number;
    netrunning: number;
    mods: number;
  };
  cores: {
    netrunning: number;
  };
};

export type NetrunningRewards = {
  mods: DeckMod[];
  components: Partial<ComponentCounts>;
};

export type NetrunningResult = NetrunningRewards & {
  success: boolean;
};

export type NetrunEntity = {
  type: NetrunEntityVariant;
  group: number;
  hits: number;
  threat: number;
  hasBomb: boolean;
  flagged: boolean;
  visible: boolean;
  x: number;
  y: number;
};

export type NetrunStatus = {
  success: boolean;
  coordinates: number[];
  surroundings: Record<NetrunDirection, NetrunEntityVariant | null>;
  threat: number;
  threatCount: number;
  energy: number;
  score: number;
  isNetrunning: boolean;
};

export type ModKey =
  | keyof CyberdeckStats["playerMults"]
  | keyof CyberdeckStats["otherMults"]
  | keyof CyberdeckStats["endgameMults"]
  | keyof CyberdeckStats["consumableStats"]
  | "extraRackSlots";

export type StatBonusName = { shortName: string; longName: string; tooltip: string };

export const statBonusDetails: Record<ModKey, StatBonusName> = {
  // Player Multipliers
  hacking: { shortName: "Hack Lvl", longName: "Hack Lvl", tooltip: "Multiplier to hacking level." },
  hacking_chance: {
    shortName: "Hack Chance",
    longName: "Hack Success Chance",
    tooltip: "Multiplier to hacking success chance.",
  },
  hacking_exp: { shortName: "Hack XP", longName: "Hack Experience", tooltip: "Multiplier to hacking experience gain." },
  hacking_speed: { shortName: "Hack Speed", longName: "Hack Speed", tooltip: "Multiplier to hack speed." },
  strength: { shortName: "Strength", longName: "Strength Level", tooltip: "Multiplier to strength level." },
  strength_exp: {
    shortName: "Strength XP",
    longName: "Strength Experience",
    tooltip: "Multiplier to strength experience gain.",
  },
  defense: { shortName: "Defense", longName: "Defense Level", tooltip: "Multiplier to defense level." },
  defense_exp: {
    shortName: "Defense XP",
    longName: "Defense Experience",
    tooltip: "Multiplier to defense experience gain.",
  },
  dexterity: { shortName: "Dexterity", longName: "Dexterity Level", tooltip: "Multiplier to dexterity level." },
  dexterity_exp: {
    shortName: "Dexterity XP",
    longName: "Dexterity Experience",
    tooltip: "Multiplier to dexterity experience gain.",
  },
  agility: { shortName: "Agility", longName: "Agility Level", tooltip: "Multiplier to agility level." },
  agility_exp: {
    shortName: "Agility XP",
    longName: "Agility Experience",
    tooltip: "Multiplier to agility experience gain.",
  },
  charisma: { shortName: "Charisma", longName: "Charisma Level", tooltip: "Multiplier to charisma level." },
  charisma_exp: {
    shortName: "Charisma XP",
    longName: "Charisma Experience",
    tooltip: "Multiplier to charisma experience gain.",
  },
  hacknet_node_money: {
    shortName: "Hnet Money",
    longName: "Hacknet Money",
    tooltip: "Multiplier to hacknet money gain.",
  },
  hacknet_node_ram_cost: {
    shortName: "Hnet RAM Cost",
    longName: "Hacknet RAM Cost",
    tooltip: "Multiplier to hacknet RAM cost.",
  },
  hacknet_node_core_cost: {
    shortName: "Hnet Core Cost",
    longName: "Hacknet Core Cost",
    tooltip: "Multiplier to hacknet core cost.",
  },
  hacknet_node_level_cost: {
    shortName: "Hnet Lvl Cost",
    longName: "Hacknet Level Cost",
    tooltip: "Multiplier to hacknet level cost.",
  },
  company_rep: {
    shortName: "Company Rep",
    longName: "Company/Work Reputation",
    tooltip: "Multiplier to company/work reputation.",
  },
  faction_rep: {
    shortName: "Faction Rep",
    longName: "Faction Reputation",
    tooltip: "Multiplier to faction reputation.",
  },
  work_money: { shortName: "Work Money", longName: "Work Money", tooltip: "Multiplier to work money gain." },
  crime_success: {
    shortName: "Crime Success",
    longName: "Crime Success Chance",
    tooltip: "Multiplier to crime success chance.",
  },
  crime_money: { shortName: "Crime Money", longName: "Crime Money", tooltip: "Multiplier to crime money gain." },

  // Other Multipliers
  romProduction: {
    shortName: "ROM/cycle",
    longName: "ROM Production Per Cycle",
    tooltip: "Rom produced per cyberdeck mechanic cycle (around two seconds).",
  },
  chipProduction: {
    shortName: "Chip/cycle",
    longName: "Chip Production Per Cycle",
    tooltip: "Chips produced per cyberdeck mechanic cycle (around two seconds).",
  },
  neurodeProduction: {
    shortName: "Neurode/cycle",
    longName: "Neurode Production Per Cycle",
    tooltip: "Neurode produced per cyberdeck mechanic cycle (around two seconds).",
  },
  program_creation_speed: {
    shortName: "Program Speed",
    longName: "Program/.EXE Creation Speed",
    tooltip: "Multiplier to the speed it takes to manually make programs.",
  },
  crime_speed: {
    shortName: "Crime Speed",
    longName: "Crime Speed",
    tooltip: "Multiplier to the time it takes to commit crimes.",
  },
  stock_fees: {
    shortName: "Stock Fees",
    longName: "Stock Commission Costs",
    tooltip: "Multiplier to stock commission costs.",
  },
  cct_money: {
    shortName: "CCT Money",
    longName: "Coding Contract .cct Money",
    tooltip: "Multiplier to coding contract money.",
  },
  IPvGO_power: {
    shortName: "IPvGO Power",
    longName: "IPvGO Node Power",
    tooltip: "Multiplier to IPvGO node power gained after each game.",
  },
  class_cost: {
    shortName: "Class Cost",
    longName: "University/Gym Class Cost",
    tooltip: "Multiplier to university/gym activity costs.",
  },

  // Consumable Stats
  netrunning_lvl: {
    shortName: "Netrun Lvl",
    longName: "Netrunning Loot Level",
    tooltip: "Increases the rarity of mods found while netrunning.",
  },
  netrun_cooldown_lvl: {
    shortName: "Trace CD",
    longName: "Netrun Trace Cooldown Level",
    tooltip: "Reduces the cooldown time for netrunning ICEBreaker costs.",
  },
  mod_storage: {
    shortName: "Mod Storage",
    longName: "Mod Storage",
    tooltip: "Increases the maximum number of mods that can be stored.",
  },
  crafting_lvl: {
    shortName: "Crafting Lvl",
    longName: "Mod Crafting Level",
    tooltip: "Increases the quality of crafted mods.",
  },

  // Endgame Multipliers
  stamina_gain: {
    shortName: "Stamina Gain",
    longName: "Bladeburner Stamina Gain",
    tooltip: "Multiplier to the amount of stamina gained from bladeburner activities.",
  },
  graft_speed: {
    shortName: "Graft Speed",
    longName: "Graft Speed",
    tooltip: "Multiplier to the speed at which you can graft augments.",
  },
  sleeve_sync: {
    shortName: "Sleeve Sync",
    longName: "Sleeve Sync Speed",
    tooltip: "Multiplier to the speed at which sleeves can synchronize.",
  },
  stanek_charge: {
    shortName: "Stanek Charge",
    longName: "Stanek Charge Boost",
    tooltip: "Multiplier to the charge gained from Stanek's Gift.",
  },
  equipment_cost: {
    shortName: "Equipment Cost",
    longName: "Gang Equipment Cost",
    tooltip: "Multiplier to the cost of purchasing gang equipment.",
  },
  int_exp: {
    shortName: "Int XP",
    longName: "Intelligence Experience",
    tooltip: "Multiplier to the experience gained for intelligence.",
  },

  // Extra Rack Slots
  extraRackSlots: {
    shortName: "Mod Rack Slots",
    longName: "Extra Mod Rack Slots",
    tooltip: "Increases the number of mod slots available.",
  },

  // unused
  hacking_money: { shortName: "Hack Money", longName: "Hack Money", tooltip: "" },
  hacking_grow: { shortName: "Hack Grow", longName: "Hack Grow", tooltip: "" },
  hacknet_node_purchase_cost: {
    shortName: "Hacknet Node Purchase Cost",
    longName: "Hacknet Node Purchase Cost",
    tooltip: "",
  },
  dnet_money: { shortName: "Darknet Money", longName: "Darknet Money", tooltip: "" },
  bladeburner_max_stamina: { shortName: "BB Max Stamina", longName: "Bladeburner Max Stamina", tooltip: "" },
  bladeburner_stamina_gain: { shortName: "BB Stamina Gain", longName: "Bladeburner Stamina Gain", tooltip: "" },
  bladeburner_analysis: { shortName: "BB Analysis", longName: "Bladeburner Analysis", tooltip: "" },
  bladeburner_success_chance: { shortName: "BB Success", longName: "Bladeburner Success Chance", tooltip: "" },
} as const;

export type ModImageSet = {
  white: string;
  blue: string;
  yellow: string;
  green: string;
  purple: string;
  red: string;
};

export type ChallengeDetails = { name: string; description: Challenges; hint: string; reward: string };
