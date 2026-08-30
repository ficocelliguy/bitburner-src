import React from "react";
import { Typography } from "@mui/material";
import { StatBonus } from "./StatBonuses";
import { CyberdeckState } from "../models/CyberdeckState";
import { useRerender } from "../../ui/React/hooks";
import { Settings } from "../../Settings/Settings";
import { formatNumber } from "../../ui/formatNumber";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";

export function StatsPage(): React.ReactElement {
  useRerender(1000);
  const bonuses = getCyberdeckStatBonuses();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ width: "300px" }}>
        <Typography variant="h4" gutterBottom>
          Cyberdeck Bonuses
        </Typography>
        <Typography component="div" sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <StatBonus
            stats={bonuses}
            emptyMessage={"No current bonuses. Wire up some mods!"}
            fontSize={14}
            useShortStatNames={false}
          />
        </Typography>
      </div>
      <div>
        <Typography variant="h4" gutterBottom>
          Current Levels
        </Typography>
        <Typography component="div" sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <span>Netrunning level: {formatNumber(CyberdeckState.netrunningLevel, 2)}</span>
          <br />
          <span>Trace decay reduction level: {formatNumber(CyberdeckState.netrunningCooldownLevel, 2)}</span>
          <br />
          <span>Crafting level: {formatNumber(CyberdeckState.craftingLevel, 2)}</span>
          <br />
          <span>Mod storage: {formatNumber(CyberdeckState.modStorageSize, 2)}</span>
          <br />
        </Typography>
      </div>
      <div>
        <Typography variant="h4" gutterBottom>
          Component Stats
        </Typography>
        <Typography component="pre" sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          {JSON.stringify(CyberdeckState.componentStats, null, 2)}
        </Typography>
      </div>
    </div>
  );
}
