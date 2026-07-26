import React from "react";
import { ComponentCounts } from "../Types";
import { Settings } from "../../Settings/Settings";
import { CyberDeckState } from "../models/CyberDeckState";
import { componentSymbols } from "../models/constants";


export function ComponentCost({ cost }: { cost: ComponentCounts }) {
  return (
  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
      <ComponentCostRow available={CyberDeckState.components.ROM} cost={cost.ROM} symbol={componentSymbols.ROM} />
      <ComponentCostRow available={CyberDeckState.components.neurodes} cost={cost.neurodes} symbol={componentSymbols.neurodes} />
      <ComponentCostRow available={CyberDeckState.components.chips} cost={cost.chips} symbol={componentSymbols.chips} />
      <ComponentCostRow available={CyberDeckState.components.ICE} cost={cost.ICE} symbol={componentSymbols.ICE} />
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
    default:
      return Settings.theme.error;
  }
}

