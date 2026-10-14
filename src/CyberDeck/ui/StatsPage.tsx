import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { StatBonus } from "./StatBonuses";
import { CyberdeckState } from "../models/CyberdeckState";
import { ChallengeDetail, getCyberdeckLevel } from "../models/challenges";
import { Challenges } from "@enums";
import { useRerender } from "../../ui/React/hooks";
import { Settings } from "../../Settings/Settings";
import { formatNumber } from "../../ui/formatNumber";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";

export function StatsPage(): React.ReactElement {
  useRerender(1000);
  const bonuses = getCyberdeckStatBonuses();
  return (
    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ width: "500px" }}>
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
            <span>Netrun trace cooldown level: {formatNumber(CyberdeckState.netrunningCooldownLevel, 2)}</span>
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
      <CompletedChallengesTable />
    </div>
  );
}

function CompletedChallengesTable(): React.ReactElement {
  const challenges = Object.values(Challenges);
  const level = getCyberdeckLevel();
  const nextChallenge = challenges[level];
  // Only challenges up to and including the next uncompleted one, highest-level first
  const rows = challenges.slice(0, level + 1).reverse();
  const cellSx = { fontSize: "14px", color: Settings.theme.maplocation, py: 0.5 };
  const nextCellSx = { ...cellSx, color: Settings.theme.secondary, fontStyle: "italic" };
  return (
    <div style={{ maxWidth: "600px" }}>
      <Typography variant="h4" gutterBottom>
        Challenges
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, color: Settings.theme.primary }}>Challenge</TableCell>
            <TableCell sx={{ ...cellSx, color: Settings.theme.primary }}>Reward</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((challenge) => {
            const isNext = challenge === nextChallenge;
            const sx = isNext ? nextCellSx : cellSx;
            return (
              <TableRow key={challenge}>
                <TableCell
                  sx={sx}
                  title={isNext ? ChallengeDetail[challenge].hint : ChallengeDetail[challenge].description}
                >
                  {isNext ? `Next: ${ChallengeDetail[challenge].description}` : ChallengeDetail[challenge].name}
                </TableCell>
                <TableCell sx={sx}>{ChallengeDetail[challenge].reward}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
