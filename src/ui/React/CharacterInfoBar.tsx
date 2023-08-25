// Root React Component for the Corporation UI
import React, { useMemo, useState, useEffect, ReactNode } from "react";

import { Theme, useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";
import { formatHp, formatMoney, formatSkill } from "../formatNumber";
import { Reputation } from "./Reputation";
import { KillScriptsModal } from "./KillScriptsModal";
import { convertTimeMsToTimeElapsedString } from "../../utils/StringHelperFunctions";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import { Settings } from "../../Settings/Settings";
import { Router } from "../GameRoot";
import { Page } from "../Router";
import { Player } from "@player";
import { StatsProgressOverviewCell } from "./StatsProgressBar";
import { currentNodeMults } from "../../BitNode/BitNodeMultipliers";

import {AppBar, Box, Container, Tooltip } from "@mui/material";

import { isClassWork } from "../../Work/ClassWork";
import { CONSTANTS } from "../../Constants";
import { isCreateProgramWork } from "../../Work/CreateProgramWork";
import { isGraftingWork } from "../../Work/GraftingWork";
import { isFactionWork } from "../../Work/FactionWork";
import { ReputationRate } from "./ReputationRate";
import { isCompanyWork } from "../../Work/CompanyWork";
import { isCrimeWork } from "../../Work/CrimeWork";
import { ActionIdentifier } from "../../Bladeburner/ActionIdentifier";
import { Skills } from "../../PersonObjects/Skills";
import { calculateSkillProgress } from "../../PersonObjects/formulas/skill";
import { EventEmitter } from "../../utils/EventEmitter";
import { useRerender } from "./hooks";
import {BladeburnerText, Work, Val} from "./CharacterOverview";

type SkillRowName = "Hack" | "Str" | "Def" | "Dex" | "Agi" | "Cha" | "Int";
type RowName = SkillRowName | "HP" | "Money";
const OverviewEventEmitter = new EventEmitter();

// These values aren't displayed, they're just used for comparison to check if state has changed
const valUpdaters: Record<RowName, () => any> = {
  HP: () => Player.hp.current + "|" + Player.hp.max, // This isn't displayed, it's just compared for updates.
  Money: () => Player.money,
  Hack: () => Player.skills.hacking,
  Str: () => Player.skills.strength,
  Def: () => Player.skills.defense,
  Dex: () => Player.skills.dexterity,
  Agi: () => Player.skills.agility,
  Cha: () => Player.skills.charisma,
  Int: () => Player.skills.intelligence,
};

//These formattedVals functions don't take in a value because of the weirdness around HP.
const formattedVals: Record<RowName, () => string> = {
  HP: () => `${formatHp(Player.hp.current)} / ${formatHp(Player.hp.max)}`,
  Money: () => formatMoney(Player.money),
  Hack: () => formatSkill(Player.skills.hacking),
  Str: () => formatSkill(Player.skills.strength),
  Def: () => formatSkill(Player.skills.defense),
  Dex: () => formatSkill(Player.skills.dexterity),
  Agi: () => formatSkill(Player.skills.agility),
  Cha: () => formatSkill(Player.skills.charisma),
  Int: () => formatSkill(Player.skills.intelligence),
};

const skillMultUpdaters: Record<SkillRowName, () => number> = {
  //Used by skill bars to calculate the mult
  Hack: () => Player.mults.hacking * currentNodeMults.HackingLevelMultiplier,
  Str: () => Player.mults.strength * currentNodeMults.StrengthLevelMultiplier,
  Def: () => Player.mults.defense * currentNodeMults.DefenseLevelMultiplier,
  Dex: () => Player.mults.dexterity * currentNodeMults.DexterityLevelMultiplier,
  Agi: () => Player.mults.agility * currentNodeMults.AgilityLevelMultiplier,
  Cha: () => Player.mults.charisma * currentNodeMults.CharismaLevelMultiplier,
  Int: () => 1,
};

const skillNameMap: Record<SkillRowName, keyof Skills> = {
  Hack: "hacking",
  Str: "strength",
  Def: "defense",
  Dex: "dexterity",
  Agi: "agility",
  Cha: "charisma",
  Int: "intelligence",
};

interface SkillBarProps {
  name: SkillRowName;
  color?: string;
}
function SkillBar({ name, color }: SkillBarProps): React.ReactElement {
  const [progress, setProgress] = useState(calculateSkillProgress(0));
  useEffect(() => {
    const clearSubscription = OverviewEventEmitter.subscribe(() => {
      const mult = skillMultUpdaters[name]();
      setProgress(calculateSkillProgress(Player.exp[skillNameMap[name]], mult));
    });

    return clearSubscription;
  }, [name]);

  return (
      <StatsProgressOverviewCell progress={progress} color={color} />
  );
}
interface DataRowProps {
  name: RowName; //name for UI display
  showBar: boolean;
  color?: string;
  cellType: "cellNone" | "cell";
}

export function DataCell({ name, showBar, color, cellType }: DataRowProps): React.ReactElement {
  const classes = useStyles();
  const isSkill = name in skillNameMap;
  const skillBar = showBar && isSkill ? <SkillBar name={name as SkillRowName} color={color} /> : <></>;
  return (
    <>
      <TableCell component="th" scope="row" classes={{ root: classes[cellType] }}>
        <Typography color={color}>{name}&nbsp;</Typography>
      </TableCell>
      <TableCell align="right" classes={{ root: classes[cellType] }}>
        <Val name={name} color={color} />
      </TableCell>
      <TableCell align="right" classes={{ root: classes[cellType] }}>
        <Typography id={"overview-" + name.toLowerCase() + "-hook"} color={color}>
          {}
        </Typography>
      </TableCell>
      {skillBar}
    </>
  );
}

interface OverviewProps {
  parentOpen: boolean;
  save: () => void;
  killScripts: () => void;
}

export function CharacterInfoBar({ parentOpen, save, killScripts }: OverviewProps): React.ReactElement {
  const [killOpen, setKillOpen] = useState(false);
  const [hasIntelligence, setHasIntelligence] = useState(Player.skills.intelligence > 0);
  const [showBars, setShowBars] = useState(!Settings.DisableOverviewProgressBars);
  useEffect(() => {
    if (!parentOpen) return; // No rerendering if overview is hidden, for performance
    const interval = setInterval(() => {
      setHasIntelligence(Player.skills.intelligence > 0);
      setShowBars(!Settings.DisableOverviewProgressBars);
      OverviewEventEmitter.emit(); // Tell every other updating component to update as well
    }, 600);
    return () => clearInterval(interval);
  }, [parentOpen]);
  const classes = useStyles();
  const theme = useTheme();
  return (
    <>
      <AppBar sx={{ bgcolor: "transparent"}}>
        <Container>
      <Table sx={{ display: "block", m: 1 }}>
        <TableBody>
          <TableRow>
            <DataCell name="HP" showBar={false} color={theme.colors.hp} cellType={"cellNone"} />
            <DataCell name="Money" showBar={false} color={theme.colors.money} cellType={"cell"} />
            <DataCell name="Hack" showBar={showBars} color={theme.colors.hack} cellType={"cell"} />
            <DataCell name="Str" showBar={showBars} color={theme.colors.combat} cellType={"cellNone"} />
            <DataCell name="Def" showBar={showBars} color={theme.colors.combat} cellType={"cellNone"} />
            <DataCell name="Dex" showBar={showBars} color={theme.colors.combat} cellType={"cellNone"} />
            <DataCell name="Agi" showBar={showBars} color={theme.colors.combat} cellType={"cell"} />
            <DataCell name="Cha" showBar={showBars} color={theme.colors.cha} cellType={"cell"} />
            {hasIntelligence ? (
              <DataCell name="Int" showBar={showBars} color={theme.colors.int} cellType={"cell"} />
            ) : (
              <></>
            )}
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" classes={{ root: classes.cell }}>
              <Typography id="overview-extra-hook-0" color={theme.colors.hack}>
                {}
              </Typography>
            </TableCell>
            <TableCell component="th" scope="row" align="right" classes={{ root: classes.cell }}>
              <Typography id="overview-extra-hook-1" color={theme.colors.hack}>
                {}
              </Typography>
            </TableCell>
            <TableCell component="th" scope="row" align="right" classes={{ root: classes.cell }}>
              <Typography id="overview-extra-hook-2" color={theme.colors.hack}>
                {}
              </Typography>
            </TableCell>
          </TableRow>
          <Work />
          <BladeburnerText />
        </TableBody>
      </Table>
      <Box sx={{ display: "flex", borderTop: `1px solid ${Settings.theme.welllight}` }}>
        <Box sx={{ display: "flex", flex: 1, justifyContent: "flex-start", alignItems: "center" }}>
          <IconButton aria-label="save game" onClick={save}>
            <Tooltip title={Settings.AutosaveInterval !== 0 ? "Save game" : "Save game (auto-saves are disabled!)"}>
              <SaveIcon color={Settings.AutosaveInterval !== 0 ? "primary" : "error"} />
            </Tooltip>
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <IconButton aria-label="kill all scripts" onClick={() => setKillOpen(true)}>
            <Tooltip title="Kill all running scripts">
              <ClearAllIcon color="error" />
            </Tooltip>
          </IconButton>
        </Box>
      </Box>
      <KillScriptsModal open={killOpen} onClose={() => setKillOpen(false)} killScripts={killScripts} />
        </Container>
      </AppBar>
    </>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    workCell: {
      textAlign: "center",
      maxWidth: "200px",
      borderBottom: "none",
      padding: 0,
      margin: 0,
    },

    workHeader: {
      fontSize: "0.9rem",
    },

    workSubtitles: {
      fontSize: "0.8rem",
    },

    cellNone: {
      borderBottom: "none",
      padding: "0 10px",
      margin: 0,
    },
    cell: {
      padding: "0 10px",
      margin: 0,
    },
    hp: {
      color: theme.colors.hp,
    },
    money: {
      color: theme.colors.money,
    },
    hack: {
      color: theme.colors.hack,
    },
    combat: {
      color: theme.colors.combat,
    },
    cha: {
      color: theme.colors.cha,
    },
    int: {
      color: theme.colors.int,
    },
  }),
);

export { useStyles };
