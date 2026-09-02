import React from "react";
import { DeckMod, ModType } from "../Types";
import MemoryIcon from "@mui/icons-material/Memory";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import AllInboxSharpIcon from "@mui/icons-material/AllInboxSharp";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import SimCardOutlinedIcon from "@mui/icons-material/SimCardOutlined";
import { Settings } from "../../Settings/Settings";
import hunter from "../assets/hunter.png";
import yogi from "../assets/yogi.png";
import idol from "../assets/idol.png";

export function getModuleIcon(module: DeckMod) {
  const size = Settings.CyberdeckWiFU ? 50 : 40;
  return (
    <div style={{ padding: "8px 2px", width: `40px`, height: `${size}px`, color: getRarityColor(module) }}>
      {Settings.CyberdeckWiFU ? getCustomModIcon(module, size) : getModIconComponent(module.type, size)}
    </div>
  );
}

export function getModIconComponent(moduleType: ModType, size: number = 50) {
  const style = { width: `${size}px`, height: `${size}px` };
  if (moduleType === ModType.ProcessingMod) {
    return <MemoryIcon style={style} />;
  }
  if (moduleType === ModType.PowerSupply) {
    return <LanOutlinedIcon style={style} />;
  }
  if (moduleType === ModType.RackExtension) {
    return <AllInboxSharpIcon style={style} />;
  }
  if (moduleType === ModType.Uplink) {
    return <SimCardOutlinedIcon style={style} />;
  }
  if (moduleType === ModType.SkillChip) {
    return <MedicalInformationSharpIcon style={style} />;
  }
}

export function getCustomModIcon(module: DeckMod, size: number) {
  return (
    <img
      src={getCustomModIMage(module)}
      style={{ position: "relative", top: "-4px", left: "-2px" }}
      width={size}
      height={size}
    />
  );
}

function getCustomModIMage(module: DeckMod) {
  // TODO-fico
  if (module.type === ModType.Uplink) {
    return hunter;
  }
  if (module.type === ModType.ProcessingMod) {
    return yogi;
  }
  return idol;
}

export function getRarityColor(module: DeckMod) {
  const t = Settings.theme;
  if (module.corrupted) {
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
  return rarityColors[module.rarity] ?? t.cha;
}
