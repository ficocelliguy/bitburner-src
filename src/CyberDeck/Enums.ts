export enum ModType {
  CyberdeckIOPanel = "Deck I/O Panel",
  PowerSupply = "Power Supply",
  ProcessingMod = "Processing Mod",
  Uplink = "Uplink",
  RackExtension = "Rack Extension",
  SkillChip = "SkillChip",
}

export enum NetrunEntityVariant {
  empty = "empty",
  ice = "ice",
  firewall = "firewall",
  dataStore = "dataStore",
  offline = "offline",
  unknown = "unknown",
}

export enum NetrunDirection {
  up = "up",
  down = "down",
  left = "left",
  right = "right",
}

export enum NetrunTargets {
  OmegaSoftware = "Omega Software",
  BladeIndustries = "Blade Industries",
  BachmanAndAssociates = "Bachman & Associates",
  OmniaCybersystems = "Omnia Cybersystems",
}

export enum Brand {
  Hosaka = "Hosaka",
  OnoSendai = "Ono-Sendai",
  OmegaSoftware = "Omega Software",
  BladeIndustries = "Blade Industries",
  BachmanAndAssociates = "Bachman & Associates",
  OmniaCybersystems = "Omnia Cybersystems",
  ChurchOfTheMachineGod = "Church of the Machine God",
  Unknown = "Unknown",
}

export enum Challenges {
  CompletedTutorial = "Complete the tutorial",
  Scrapper = "Salvage at least 5 mods",
  CleanRun = "Get a score of 80+ while netrunning",
  Homebrew = "Craft 5 mods",
  DaisyChain = "Charge a mod that is 3+ jumps away from the deck",
  BombSquad = "Flag ICE with an active countermeasure, and finish the run",
  FullHouse = "Have a charged mod in every rack slot",
  Supplier = "Get crafting components from 8 sources",
  Jackpot = "Get a score of 120+ while netrunning",
  Overclocked = "Get a 50% bonus in a single stat",
  AutoWire = "Charge a mod via the API",
  BigDeck = "Have at least 7 rack slots",
  AutoRun = "Get a score of 100+ using only the API",
  AutoBomber = "Flag ICE with an active countermeasure and finish the run with only the API",
  ArcHazard = "Charge a mod that is 6+ jumps away from the deck",
  Corruption = "Install a mod from the glitch",
  GlitchRun = "Get a score of 100+ at the glitch using only the API",
}
