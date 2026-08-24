import React from "react";
import { DeckModule, ModuleType } from "../Types";
import MemoryIcon from "@mui/icons-material/Memory";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import AllInboxSharpIcon from "@mui/icons-material/AllInboxSharp";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import SimCardOutlinedIcon from "@mui/icons-material/SimCardOutlined";
import { Settings } from "../../Settings/Settings";
import hunter from "../assets/hunter.png";
import yogi from "../assets/yogi.png";
import idol from "../assets/idol.png";

export function getModuleIcon(module: DeckModule) {
  const size = Settings.CyberdeckWiFU ? 50 : 40;
  return (
    <div style={{ padding: "8px 2px", width: `40px`, height: `${size}px`, color: getRarityColor(module) }}>
      {Settings.CyberdeckWiFU ? getCustomModIcon(module, size) : getModIconComponent(module.type, size)}
    </div>
  );
}

export function getModIconComponent(moduleType: ModuleType, size: number = 50) {
  const style = { width: `${size}px`, height: `${size}px` };
  if (moduleType === ModuleType.ProcessingModule) {
    return <MemoryIcon style={style} />;
  }
  if (moduleType === ModuleType.PowerSupply) {
    return <LanOutlinedIcon style={style} />;
  }
  if (moduleType === ModuleType.RackExtension) {
    return <AllInboxSharpIcon style={style} />;
  }
  if (moduleType === ModuleType.Uplink) {
    return <SimCardOutlinedIcon style={style} />;
  }
  if (moduleType === ModuleType.SkillChip) {
    return <MedicalInformationSharpIcon style={style}/>;
  }
}

export function getCustomModIcon(module: DeckModule, size: number) {
  return (
    <img
      src={getCustomModIMage(module)}
      style={{ position: "relative", top: "-4px", left: "-2px" }}
      width={size}
      height={size}
    />
  );
}

function getCustomModIMage(module: DeckModule) {
  // TODO-fico
  if (module.type === ModuleType.Uplink) {
    return hunter;
  }
  if (module.type === ModuleType.ProcessingModule) {
    return yogi;
  }
  return idol;
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