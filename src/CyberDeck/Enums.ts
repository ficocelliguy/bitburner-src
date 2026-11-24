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
  Scrapper = "Salvage 5 mods",
  CleanRun = "Get a score of 80+ while netrunning",
  Homebrew = "Craft 5 mods",
  LevelUp = "Gain a netrunning level of 3, for improved mod drops",
  StrikeGold = "Find a rarity five mod",
  ShortBus = "Charge 2 mods from the same power supply",
  DaisyChain = "Charge a mod that is 3+ jumps away from the deck",
  ColdTrail = "Start a netrun with the hostile trace fully decayed",
  BombSquad = "Flag ICE with an active countermeasure, and finish the run",
  FullHouse = "Have a charged mod in every rack slot",
  Supplier = "Get crafting components from 8 unique sources",
  Jackpot = "Get a score of 120+ while netrunning",
  AutoWire = "Charge a mod via the API",
  AutoRun = "Complete a netrun using only the API",
  BigDeck = "Have 7 total rack slots",

  // Endgame-only achievements:

  Overclocked = "Get a 50% bonus in a single stat",
  ScriptedWin = "Get a score of 100+ using only the API",
  AutoBomber = "Flag ICE with an active countermeasure and finish the run with only the API",
  ArcHazard = "Charge a mod that is 6+ jumps away from the deck",
  Corruption = "Install a corrupted mod from the glitch",
  GlitchRun = "Get a score of 100+ at the glitch using only the API",
  Electrician = "Charge 4 mods from the same power supply",
  Collector = "Get crafting components from 12 unique sources",
  Impatient = "Start a netrun that costs at least 1000 ICEBreakers",
  Connoisseur = "Find a rarity ten mod",
}
