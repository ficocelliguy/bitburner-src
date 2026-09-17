import React from "react";
import { Box, Tooltip } from "@mui/material";
import { GRID_SIZE, NetrunningState } from "../models/NetrunningState";
import { Settings } from "../../Settings/Settings";
import { flagEntity, getEntityColor, getThreatColor } from "../models/netrunningMinigame";
import { NetrunEntity } from "../Types";
import { NetrunEntityVariant } from "../Enums";
import { useCyberdeckStyles } from "./cyberdeckStyles";

export function NetrunGridEntity({ entity }: { entity: NetrunEntity }) {
  const styles = useCyberdeckStyles();
  const color = getEntityColor(entity);

  function getBorderColor(neighbor: NetrunEntity): string {
    if (!neighbor || !entity.visible) {
      return Settings.theme.well;
    }
    if (entity.type === NetrunEntityVariant.firewall) {
      return Settings.theme.secondarydark;
    }
    if (
      neighbor.group === entity.group ||
      (entity.type === NetrunEntityVariant.empty && neighbor.type === entity.type)
    ) {
      return color;
    }
    if (entity.flagged && entity.type === NetrunEntityVariant.ice) {
      return Settings.theme.errorlight;
    }
    return Settings.theme.secondarydark;
  }

  function getOpacity() {
    if (entity.type !== NetrunEntityVariant.ice || entity.hits) {
      return 1;
    }
    return [0.6, 0.7, 0.8, 0.9, 1][entity.group % 5];
  }

  function flag(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    flagEntity(entity);
  }

  const northNeighbor = NetrunningState.grid[entity.y - 1]?.[entity.x];
  const borderTopColor = getBorderColor(northNeighbor);

  const eastNeighbor = NetrunningState.grid[entity.y]?.[entity.x + 1];
  const borderRightColor = getBorderColor(eastNeighbor);

  const southNeighbor = NetrunningState.grid[entity.y + 1]?.[entity.x];
  const borderBottomColor = getBorderColor(southNeighbor);

  const westNeighbor = NetrunningState.grid[entity.y]?.[entity.x - 1];
  const borderLeftColor = getBorderColor(westNeighbor);

  const tooltip = !entity.visible
    ? "<unknown entity>"
    : entity.hasBomb
    ? "Active countermeasures were triggered here! This can still be broken, but will take more ICEBreakers."
    : entity.type == NetrunEntityVariant.ice
    ? "ICE (Intrusion Countermeasure Executables): defensive programs found almost everywhere in modern cyberspace. May contain active countermeasures - watch your threat level! Can be broken, if there are ICEBreakers still available."
    : entity.type == NetrunEntityVariant.dataStore
    ? "A data cache! Grab it while you can!"
    : entity.type === NetrunEntityVariant.firewall
    ? "Firewalls are fully passive defenses. They take multiple ICEBreakers to pierce"
    : "";

  const size = entity.type === NetrunEntityVariant.empty ? GRID_SIZE : (1 - entity.hits * 0.1) * GRID_SIZE;

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
        onClick={flag}
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
            ...(entity.type === NetrunEntityVariant.offline /* && entity.visible */ ? styles.offlineNode : {}),
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
