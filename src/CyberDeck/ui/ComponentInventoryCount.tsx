import React from "react";
import { Typography, Tooltip } from "@mui/material";
import { Settings } from "../../Settings/Settings";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";
import { CyberdeckState } from "../models/CyberdeckState";
import { formatNumber } from "../../ui/formatNumber";

export function ComponentInventoryCount() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        margin: "10px 5px",
        gap: "15px",
      }}
    >
      <ComponentTooltip symbol={componentSymbols.ROM}>
        <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <ComponentSymbol symbol={componentSymbols.ROM} />:
          {formatNumber(Math.floor(CyberdeckState.components.ROM), 0, 1000)}
        </Typography>
      </ComponentTooltip>
      <ComponentTooltip symbol={componentSymbols.chips}>
        <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <ComponentSymbol symbol={componentSymbols.chips} />:
          {formatNumber(Math.floor(CyberdeckState.components.chips), 0, 1000)}
        </Typography>
      </ComponentTooltip>
      <ComponentTooltip symbol={componentSymbols.neurodes}>
        <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <ComponentSymbol symbol={componentSymbols.neurodes} />:
          {formatNumber(Math.floor(CyberdeckState.components.neurodes), 0, 1000)}
        </Typography>
      </ComponentTooltip>
      <ComponentTooltip symbol={componentSymbols.cores}>
        <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <ComponentSymbol symbol={componentSymbols.cores} />:
          {formatNumber(Math.floor(CyberdeckState.components.cores), 0, 1000)}
        </Typography>
      </ComponentTooltip>
      <ComponentTooltip symbol={componentSymbols.ICEBreakers}>
        <Typography sx={{ fontSize: "14px", color: Settings.theme.maplocation }}>
          <ComponentSymbol symbol={componentSymbols.ICEBreakers} />:
          {formatNumber(Math.floor(CyberdeckState.components.ICEBreakers), 0, 1000)}
        </Typography>
      </ComponentTooltip>
    </div>
  );
}

export function ComponentTooltip({ symbol, children }: { symbol: string; children: React.ReactElement }) {
  const details = getComponentDetails(symbol);

  return (
    <Tooltip
      title={
        <div>
          <h3 style={{ margin: "4px" }}>{details.name}</h3>
          <div style={{ margin: "10px 4px" }}>{details.description}</div>
          <div style={{ margin: "10px 4px", fontSize: "13px" }}>{details.source}</div>
          <div
            style={{
              margin: "10px 4px",
              color: Settings.theme.secondary,
              width: "500px",
              fontStyle: "italic",
              fontSize: "13px",
            }}
          >
            {details.lore}
          </div>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}

function getComponentDetails(symbol: string) {
  switch (symbol) {
    case componentSymbols.ROM:
      return {
        name: "ROM Components",
        description: "A component used for making cyberdeck mods.",
        source: "Obtained from some crime, backdooring servers, darknet caches, and creating programs.",
        lore: "Read-Only Memory cards have their contents flashed once and cannot be changed afterwards. This makes the software on them durable and resistant to tampering or data corruption.",
      };
    case componentSymbols.neurodes:
      return {
        name: "Neurodes",
        description: "A component used for making cyberdeck mods.",
        source: "Obtained from crime kills, attending classes, and completing coding contracts.",
        lore: "Neurodes are specialized neural interface components that allow a netrunner to receive and transmit data directly to and from their nervous system, enabling deep-dive interaction with the digital world.",
      };
    case componentSymbols.chips:
      return {
        name: "Chips",
        description: "A component used for making cyberdeck mods.",
        source: "Obtained from company work, IPvGO game completions, and hacknet profits.",
        lore: "A staple of cyberdeck mod construction. Chips are general-purpose programmable circuitboards used in a wide variety of digital applications.",
      };
    case componentSymbols.cores:
      return {
        name: "Cores",
        description: "Required for the construction of cyberdeck mods.",
        source: "Obtained from netrunning.",
        lore: "The core is the most integral part of a cyberdeck mod, handling both central processing as well as uplink data transfer.",
      };
    case componentSymbols.ICEBreakers:
      return {
        name: "ICEbreakers",
        description: "Digital defense-breakers used for netrunning.",
        source: "Crafted from ROM, neurodes, and chips.",
        lore: "ICE (Intrusion Countermeasure Executables) are defensive programs found almost everywhere in modern cyberspace. Netrunners create custom ICEbreakers to bypass these defenses and gain access to restricted areas, risking their minds and decks in the search for new mods.",
      };
    default:
      return {
        name: "Unknown Component",
        description: "No description available.",
        lore: "",
      };
  }
}
