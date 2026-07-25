import React from "react";
import { DeckModule, ModuleType } from "../Types";
import MemoryIcon from "@mui/icons-material/Memory";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import AllInboxSharpIcon from "@mui/icons-material/AllInboxSharp";
import PodcastsOutlinedIcon from "@mui/icons-material/PodcastsOutlined";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import { Settings } from "../../Settings/Settings";

export function getModuleIcon(module: DeckModule) {
  return <div style={{padding: "5px", width: "50px", height: "50px", color:getRarityColor(module)}}>{getIconComponent(module)}</div>
}

function getIconComponent(module: DeckModule) {
  const style = { width: "50px", height: "50px" };
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
  if (module.level < 0) {
    return t.errordark;
  }
  const rarityColors = [
    t.secondarylight,
    t.secondarylight,
    t.maplocation,
    t.infolight,
    t.info,
    t.warninglight,
    t.money,
    t.successlight,
    t.success,
  ];
  return rarityColors[module.level] ?? t.cha;
}