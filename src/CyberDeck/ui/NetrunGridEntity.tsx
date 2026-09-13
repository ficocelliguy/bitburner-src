import React from "react";
import { Box } from "@mui/material";
import {
  GRID_SIZE,
  NetrunEntity,
  netrunEntityVariant,
  NetrunningState,
} from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";
import { clampNumber } from "../../utils/helpers/clampNumber";

export function NetrunGridEntity({ entity }: {entity: NetrunEntity}) {
  const color = getEntityColor();

  function getEntityColor() {
    const theme = Settings.theme;
    if (!entity.visible) {
      return theme.backgroundprimary;
    }
    if (entity.type === netrunEntityVariant.dataStore) {
      return Settings.theme.money;
    }
    if (entity.type === netrunEntityVariant.ice && entity.hasBomb && entity.hits) {
      return Settings.theme.error;
    }
    if (entity.type === netrunEntityVariant.ice) {
      const variant = entity.group % 2;
      return [theme.infolight, theme.info][variant];
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

  function interpolateColor(color1: number[], color2: number[], factor: number, opacity: number) {
    const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
    const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
    const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
    return `rgba(${r},${g},${b},${opacity})`;
  }

  function getThreatColor() {
    if (entity.threat === 0) {
      return "";
    }
    // Clamp threat between 0 and 1.5
    const threat = clampNumber(entity.threat, 0, 1.5);
    // Define RGB anchors: Green -> Red -> Purple
    const green = [0, 128, 0];
    const red = [255, 0, 0];
    const purple = [128, 0, 128];

    if (threat < 1) {
      // First half: Green to Red
      const opacity = clampNumber(entity.threat * 3, 0.4, 1);
      return interpolateColor(green, red, threat ** 2, opacity);
    } else {
      // Second half: Red to Purple
      return interpolateColor(red, purple, (threat - 1) * 2, 1);
    }
  }

  function getOpacity() {
    if (entity.type !== netrunEntityVariant.ice || entity.hits) {
      return 1;
    }
    return [0.6, 0.7, 0.8, 0.9, 1][entity.group % 5];
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
        width: GRID_SIZE,
        height: GRID_SIZE,
        minHeight: GRID_SIZE,
        borderTop: `1px solid ${borderTopColor}`,
        borderLeft: `1px solid ${borderLeftColor}`,
        borderBottom: `1px solid ${borderBottomColor}`,
        borderRight: `1px solid ${borderRightColor}`,
        backgroundColor: color,
        opacity: getOpacity(),
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          minHeight: 10,
          margin: "5px",
          backgroundColor: getThreatColor(),
          borderRadius: "2px",
        }}
      />
    </Box>
  );
}