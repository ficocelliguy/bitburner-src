import { createInitialModules } from "../utils/moduleUtilities";
import { Settings } from "../../Settings/Settings";
import { Connection, DeckModule } from "../Types";
import { EventEmitter } from "../../utils/EventEmitter";

/** Event emitter to allow the UI to subscribe to CyberDeck gameplay updates in order to trigger rerenders properly */
export const CyberDeckEvents = new EventEmitter<[]>();

export const CyberDeckState = {
  hasCyberdeck: true,
  baseRackSize: 6,
  installedModules: [] as DeckModule[],
  storedModules: [] as DeckModule[],
  connections: [] as Connection[],
  components: {
    ROM: 0,
    neurodes: 0,
    chips: 0,
  },
  netrunningBoost: 0
};

const t = Settings.theme;

export const socketColors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];

export function getChargedModuleIDs() : string[] {
  // TODO-fico: power port on deck rack instead of declaring that the first module is charged?
  if (!CyberDeckState.installedModules.length) return [];

  const chargedModules = [CyberDeckState.installedModules[0].id];
  for (const moduleId of chargedModules) {
    const connections = CyberDeckState.connections.filter(
      ([source, destination]) => source.moduleId === moduleId || destination.moduleId === moduleId,
    );
    for (const [source, destination] of connections) {
      if (!chargedModules.includes(source.moduleId)) {
        chargedModules.push(source.moduleId);
      }
      if (!chargedModules.includes(destination.moduleId)) {
        chargedModules.push(destination.moduleId);
      }
    }
  }
  return chargedModules;
}

// TODO-fico: this is temporary rack setup
createInitialModules();

/*
const themeColors = {
  primarylight: "#0f0",
  primary: "#0c0",
  primarydark: "#090",
  successlight: "#0f0",
  success: "#0c0",
  successdark: "#090",
  errorlight: "#f00",
  error: "#c00",
  errordark: "#900",
  secondarylight: "#AAA",
  secondary: "#888",
  secondarydark: "#666",
  warninglight: "#ff0",
  warning: "#cc0",
  warningdark: "#990",
  infolight: "#69f",
  info: "#36c",
  infodark: "#039",
  welllight: "#444",
  well: "#222",
  white: "#fff",
  black: "#000",
  hp: "#dd3434",
  money: "#ffd700",
  hack: "#adff2f",
  combat: "#faffdf",
  cha: "#a671d1",
  int: "#6495ed",
  rep: "#faffdf",
  disabled: "#66cfbc",
  backgroundprimary: "#000",
  backgroundsecondary: "#000",
  button: "#333",
  maplocation: "#ffffff",
  bnlvl0: "#ffff00",
  bnlvl1: "#ff0000",
  bnlvl2: "#48d1cc",
  bnlvl3: "#0000ff",
};
 */
