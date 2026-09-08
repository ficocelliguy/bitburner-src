import React from "react";
import { DeckMod, ModImageSet, ModType } from "../Types";
import MemoryIcon from "@mui/icons-material/Memory";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import AllInboxSharpIcon from "@mui/icons-material/AllInboxSharp";
import MedicalInformationSharpIcon from "@mui/icons-material/MedicalInformationSharp";
import SimCardOutlinedIcon from "@mui/icons-material/SimCardOutlined";
import { Settings } from "../../Settings/Settings";
import whiteProcessingMod from "../assets/ProcessingMod/White.png";
import yellowProcessingMod from "../assets/ProcessingMod/Yellow.png";
import redProcessingMod from "../assets/ProcessingMod/Red.png";
import purpleProcessingMod from "../assets/ProcessingMod/Purple.png";
import blueProcessingMod from "../assets/ProcessingMod/Blue.png";
import greenProcessingMod from "../assets/ProcessingMod/Green.png";
import whitePowerSupply from "../assets/PowerSupply/White.png";
import yellowPowerSupply from "../assets/PowerSupply/Yellow.png";
import redPowerSupply from "../assets/PowerSupply/Red.png";
import purplePowerSupply from "../assets/PowerSupply/Purple.png";
import bluePowerSupply from "../assets/PowerSupply/Blue.png";
import greenPowerSupply from "../assets/PowerSupply/Green.png";
import whiteRackExtension from "../assets/RackExtension/White.png";
import yellowRackExtension from "../assets/RackExtension/Yellow.png";
import redRackExtension from "../assets/RackExtension/Red.png";
import purpleRackExtension from "../assets/RackExtension/Purple.png";
import blueRackExtension from "../assets/RackExtension/Blue.png";
import greenRackExtension from "../assets/RackExtension/Green.png";
import whiteSkillChip from "../assets/Skillchip/White.png";
import yellowSkillChip from "../assets/Skillchip/Yellow.png";
import redSkillChip from "../assets/Skillchip/Red.png";
import purpleSkillChip from "../assets/Skillchip/Purple.png";
import blueSkillChip from "../assets/Skillchip/Blue.png";
import greenSkillChip from "../assets/Skillchip/Green.png";
import whiteUplink from "../assets/Uplink/White.png";
import yellowUplink from "../assets/Uplink/Yellow.png";
import redUplink from "../assets/Uplink/Red.png";
import purpleUplink from "../assets/Uplink/Purple.png";
import blueUplink from "../assets/Uplink/Blue.png";
import greenUplink from "../assets/Uplink/Green.png";


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


const modImagesByType: Record<ModType, ModImageSet> = {
  [ModType.ProcessingMod]: {
    white: whiteProcessingMod,
    blue: blueProcessingMod,
    yellow: yellowProcessingMod,
    green: greenProcessingMod,
    purple: purpleProcessingMod,
    red: redProcessingMod,
  },
  [ModType.PowerSupply]: {
    white: whitePowerSupply,
    blue: bluePowerSupply,
    yellow: yellowPowerSupply,
    green: greenPowerSupply,
    purple: purplePowerSupply,
    red: redPowerSupply,
  },
  [ModType.RackExtension]: {
    white: whiteRackExtension,
    blue: blueRackExtension,
    yellow: yellowRackExtension,
    green: greenRackExtension,
    purple: purpleRackExtension,
    red: redRackExtension,
  },
  [ModType.SkillChip]: {
    white: whiteSkillChip,
    blue: blueSkillChip,
    yellow: yellowSkillChip,
    green: greenSkillChip,
    purple: purpleSkillChip,
    red: redSkillChip,
  },
  [ModType.Uplink]: {
    white: whiteUplink,
    blue: blueUplink,
    yellow: yellowUplink,
    green: greenUplink,
    purple: purpleUplink,
    red: redUplink,
  },
  [ModType.CyberdeckIOPanel]: {
    white: whiteUplink,
    blue: blueUplink,
    yellow: yellowUplink,
    green: greenUplink,
    purple: purpleUplink,
    red: redUplink,
  },
};

function getCustomModIMage(module: DeckMod) {
  const images = modImagesByType[module.type];
  return getRarityImage(module, images);
}

function getRarityImage(module: DeckMod, images: ModImageSet) {
  if (module.corrupted) {
    return images.red;
  }
  if (module.rarity < 3) {
    return images.white;
  }
  if (module.rarity < 5) {
    return images.blue;
  }
  if (module.rarity < 7) {
    return images.yellow;
  }
  if (module.rarity < 9) {
    return images.green;
  }
  return images.purple;
}