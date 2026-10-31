import React from "react";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { StatBonus } from "./StatBonuses";
import { CyberdeckState } from "../models/CyberdeckState";
import { ChallengeDetail, getCyberdeckLevel } from "../models/challenges";
import { Challenges } from "@enums";
import { useRerender } from "../../ui/React/hooks";
import { Settings } from "../../Settings/Settings";
import { formatNumber } from "../../ui/formatNumber";

import { getCyberdeckStatBonuses } from "../utils/modStatsUtils";
import { componentStatsLabels, componentSymbols } from "../models/constants";
import { ComponentSymbol } from "./ComponentCost";
import type { ComponentStats } from "../Types";

export function StatsPage(): React.ReactElement {
  useRerender(1000);
  const bonuses = getCyberdeckStatBonuses();
  return (
    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div style={{ width: "380px" }}>
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
            Component Sources
          </Typography>
          <ComponentStatsTable />
        </div>
      </div>
      <CompletedChallengesTable />
    </div>
  );
}

function ComponentStatsTable(): React.ReactElement {
  const cellSx = { fontSize: "14px", color: Settings.theme.maplocation, py: 0.5, borderBottom: "none" };
  const headerSx = { ...cellSx, color: Settings.theme.primary };
  const components = Object.keys(componentStatsLabels) as (keyof ComponentStats)[];
  return (
    <Table size="small" sx={{ width: "250px" }}>
      <TableBody>
        {components.map((component, componentIndex) => {
          const stats: Record<string, number> = CyberdeckState.componentStats[component];
          const labels: Record<string, string> = componentStatsLabels[component].sources;
          const total = Object.values(stats).reduce((sum, value) => sum + value, 0);
          // Only draw a divider above each component group after the first
          const groupSx = componentIndex > 0 ? { ...headerSx, paddingTop: "20px" } : headerSx;
          return (
            <React.Fragment key={component}>
              <TableRow>
                <TableCell sx={groupSx}>
                  <ComponentSymbol symbol={componentSymbols[component]} /> {componentStatsLabels[component].name}
                </TableCell>
                <TableCell sx={groupSx} align="right">
                  {formatNumber(total, 0)}
                </TableCell>
              </TableRow>
              {Object.entries(stats).map(([source, value]) => (
                <TableRow key={source}>
                  <TableCell sx={{ ...cellSx, pl: 4 }}>{labels[source] ?? source}</TableCell>
                  <TableCell sx={cellSx} align="right">
                    {formatNumber(value, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

function CompletedChallengesTable(): React.ReactElement {
  const challenges = Object.values(Challenges);
  const level = getCyberdeckLevel();
  const nextChallenge = challenges[level];
  const rows = challenges.slice(0, level).reverse();
  const cellSx = { fontSize: "14px", color: Settings.theme.maplocation, py: 0.5 };
  const nextCellSx = { ...cellSx, color: Settings.theme.maplocation, fontStyle: "italic" };
  return (
    <div style={{ maxWidth: "600px" }}>
      <Typography variant="h4" gutterBottom>
        Deck Upgrades
      </Typography>
      {nextChallenge && (
        <Tooltip title={ChallengeDetail[nextChallenge].hint}>
          <Box
            sx={{ backgroundColor: Settings.theme.well, padding: "10px", borderRadius: "3px", marginBottom: "20px" }}
          >
            <Typography sx={{ color: Settings.theme.maplocation }}>
              Next challenge ({ChallengeDetail[nextChallenge].name}): {ChallengeDetail[nextChallenge].description}
            </Typography>
            <Typography sx={nextCellSx}>Reward: {ChallengeDetail[nextChallenge].reward}</Typography>
          </Box>
        </Tooltip>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, color: Settings.theme.primary }}>Completed Challenge</TableCell>
            <TableCell sx={{ ...cellSx, color: Settings.theme.primary }}>Rewards</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((challenge) => {
            return (
              <TableRow key={challenge}>
                <TableCell sx={cellSx} title={ChallengeDetail[challenge].description}>
                  {ChallengeDetail[challenge].name}
                </TableCell>
                <TableCell sx={cellSx}>{ChallengeDetail[challenge].reward}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
