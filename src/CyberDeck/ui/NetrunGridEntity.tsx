import React from "react";
import { Box } from "@mui/material";
import {
  NetrunEntity,
  netrunEntityVariant,
  NetrunningState,
} from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";

export function NetrunGridEntity({ entity }: {entity: NetrunEntity}) {
  const color = getEntityColor();

  function getEntityColor() {
    const theme = Settings.theme;
    if (!entity.visible) {
      return theme.backgroundprimary;
    }
    if (entity.type === netrunEntityVariant.ice) {
      const variant = entity.group % 3;
      return [theme.infolight, theme.info, theme.infodark][variant];
    }
    if (entity.type === netrunEntityVariant.firewall) {
      return Settings.theme.cha;
    }
    return Settings.theme.welllight;
  }

  function getBorderColor(neighbor: NetrunEntity): string {
    if (!neighbor || !entity.visible) {
      return Settings.theme.well;
    }
    if (entity.type === netrunEntityVariant.firewall) {
      return Settings.theme.secondarydark;
    }
    if (
      neighbor.group === entity.group ||
      (entity.type === netrunEntityVariant.empty && neighbor.type === entity.type)
    ) {
      return color;
    }
    return Settings.theme.secondarydark;
  }

  const northNeighbor = NetrunningState.grid[entity.y -1]?.[entity.x]
  const borderTopColor = getBorderColor(northNeighbor);

  const eastNeighbor = NetrunningState.grid[entity.y]?.[entity.x +1]
  const borderRightColor = getBorderColor(eastNeighbor);

  const southNeighbor = NetrunningState.grid[entity.y + 1]?.[entity.x]
  const borderBottomColor = getBorderColor(southNeighbor);

  const westNeighbor = NetrunningState.grid[entity.y]?.[entity.x -1]
  const borderLeftColor = getBorderColor(westNeighbor);

  return (
    <Box
      sx={{
        width: 20,
        height: 20,
        minHeight: 20,
        borderTop: `1px solid ${borderTopColor}`,
        borderLeft: `1px solid ${borderLeftColor}`,
        borderBottom: `1px solid ${borderBottomColor}`,
        borderRight: `1px solid ${borderRightColor}`,
        backgroundColor: color,
      }}
    >
      {entity.group}
    </Box>
  );
}