import React from "react";
import { DeckModule, ModuleType } from "../Types";
import MemoryIcon from "@mui/icons-material/Memory";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import AllInboxSharpIcon from "@mui/icons-material/AllInboxSharp";
import PodcastsOutlinedIcon from "@mui/icons-material/PodcastsOutlined";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import { Settings } from "../../Settings/Settings";

export function getModuleIcon(module: DeckModule) {
  return <div style={{padding: "5px", width: "30px", height: "30px", color:getRarityColor(module)}}>{getIconComponent(module)}</div>
}

function getIconComponent(module: DeckModule) {
  const style = {width: "30px", height: "30px"};
  if (module.type === ModuleType.ProcessingModule) {
    return <MemoryIcon style={style} />;
  }
  if (module.type === ModuleType.PowerSupply) {
    return <LanOutlinedIcon style={style} />;
  }
  if (module.type === ModuleType.RackExtension) {
    return <AllInboxSharpIcon style={style} />;
  }
  if (module.type === ModuleType.Uplink) {
    return <PodcastsOutlinedIcon style={style} />;
  }
  if (module.type === ModuleType.SkillChip) {
    return <MedicalInformationSharpIcon style={style}/>;
  }
}

export function getRarityColor(module: DeckModule) {
  const t = Settings.theme;
  const rarityColors = [
    t.rep,
    t.maplocation,
    t.secondarylight,
    t.infolight,
    t.info,
    t.warninglight,
    t.money,
    t.successlight,
    t.success,
    t.errordark,
    t.error,
  ];
  return rarityColors[module.level] ?? t.cha;
}


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