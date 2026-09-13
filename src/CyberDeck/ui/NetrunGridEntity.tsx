import React from "react";
import { Box, Tooltip } from "@mui/material";
import {
  GRID_SIZE,
  NetrunEntity,
  netrunEntityVariant,
  NetrunningState,
} from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";
import { getEntityColor, getThreatColor } from "../models/netrunningMinigame";

export function NetrunGridEntity({ entity }: {entity: NetrunEntity}) {
  const color = getEntityColor(entity);

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

  const tooltip = !entity.visible ? "<unknown entity>" :
    entity.hasBomb ? "Active countermeasures were triggered here! This can still be broken, but will take more ICEBreakers." :
    entity.type == netrunEntityVariant.ice
      ? "ICE (Intrusion Countermeasure Executables): defensive programs found almost everywhere in modern cyberspace. May contain active countermeasures - watch your threat level!. Can be broken, if there are ICEBreakers still available." :
      entity.type == netrunEntityVariant.dataStore ? "A data cache! Grab it while you can!" :
        entity.type === netrunEntityVariant.firewall ? "Firewalls are fully passive defenses. They take multiple ICEBreakers to pierce" : "";

  const size = entity.type === netrunEntityVariant.empty ? GRID_SIZE : (1 - entity.hits * 0.1) * GRID_SIZE;

  return (
    <Tooltip title={tooltip}>
      <Box
        sx={{
          width: GRID_SIZE,
          height: GRID_SIZE,
          minHeight: GRID_SIZE,
          border: `1px solid transparent`,
          alignContent: "center",
        }}
      >
        <Box
          id={`netrun-entity-${entity.x},${entity.y}`}
          sx={{
            width: size,
            height: size,
            minHeight: size,
            borderTop: `1px solid ${borderTopColor}`,
            borderLeft: `1px solid ${borderLeftColor}`,
            borderBottom: `1px solid ${borderBottomColor}`,
            borderRight: `1px solid ${borderRightColor}`,
            margin: "auto",
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
              backgroundColor: getThreatColor(entity.threat),
              borderRadius: "2px",
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  );
}