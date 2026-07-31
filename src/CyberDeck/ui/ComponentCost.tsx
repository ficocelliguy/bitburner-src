import React from "react";
import { ComponentCounts } from "../Types";
import { Settings } from "../../Settings/Settings";
import { CyberdeckState } from "../models/CyberdeckState";
import { componentSymbols } from "../models/constants";


export function ComponentCost({ cost }: { cost: ComponentCounts }) {
  return (
  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
      <ComponentCostRow available={CyberdeckState.components.ROM} cost={cost.ROM} symbol={componentSymbols.ROM} />
      <ComponentCostRow available={CyberdeckState.components.neurodes} cost={cost.neurodes} symbol={componentSymbols.neurodes} />
      <ComponentCostRow available={CyberdeckState.components.chips} cost={cost.chips} symbol={componentSymbols.chips} />
      <ComponentCostRow available={CyberdeckState.components.cores} cost={cost.cores} symbol={componentSymbols.cores} />
      <ComponentCostRow available={CyberdeckState.components.ICE} cost={cost.ICE} symbol={componentSymbols.ICE} />
    </div>
  );
}

export function ComponentSymbol({symbol}: {symbol: string}) {
  const isROM = symbol === componentSymbols.ROM;
  return <span style={{ color: getSymbolColor(symbol), fontSize: "14px", marginTop: isROM ? "-4px" : "0" }}> {symbol}</span>;
}

export function ComponentCostRow({ available, cost, symbol }: { available: number; cost: number; symbol: string }) {
  if (cost <= 0) return <></>;
  return (
    <span style={{ color: available >= cost ? Settings.theme.maplocation : Settings.theme.error, marginRight: "5px" }}>
      <ComponentSymbol symbol={symbol} />
      <span style={{marginLeft: "3px"}}>{available >= cost ? "" : `${Math.floor(available)}/`}{cost}</span>
    </span>
  );
}

function getSymbolColor(symbol: string): string {
  switch (symbol) {
    case componentSymbols.ROM: // ROM
      return Settings.theme.cha;
    case componentSymbols.neurodes: // neurodes
      return Settings.theme.money;
    case componentSymbols.chips: // chips
      return Settings.theme.primary;
    case componentSymbols.ICE: // ICEbreakers
      return Settings.theme.infolight;
    case componentSymbols.cores: // cores
      return Settings.theme.rep;
    default:
      return Settings.theme.error;
  }
}

