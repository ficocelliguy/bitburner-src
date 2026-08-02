import React, { useState, useRef, useEffect, useCallback } from "react";
import { Container, Typography, Box } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { getCyberdeckStatBonuses, StatBonus } from "./StatBonuses";
import { CyberdeckState } from "../models/CyberdeckState";
import { useRerender } from "../../ui/React/hooks";
import { Settings } from "../../Settings/Settings";


export function StatsPage() : React.ReactElement {
  useRerender(1000);
  const bonuses = getCyberdeckStatBonuses(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <Typography variant="h4" gutterBottom>
          Cyberdeck Bonuses
        </Typography>
        <Typography component="div" sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <StatBonus stats={bonuses} emptyMessage={"No current bonuses. Wire up some mods!"} />
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