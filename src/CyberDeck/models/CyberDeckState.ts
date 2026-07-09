import { createInitialModules } from "./moduleRack";
import { Settings } from "../../Settings/Settings";

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
};

export type DeckModule = {
  id: string;
  sockets: SocketList;
  type: string;
  stats?: null;
};
export type SocketList = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];

export type Connection = [Socket, Socket];
export type Socket = {
  moduleId: string;
  socketIndex: number;
};

const t = Settings.theme;

export const socketColors = [t.rep, t.cha, t.primary, t.hp, t.info, t.warning, t.bnlvl2, t.secondarylight];

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
