import React from "react";
import { ComponentCounts } from "../Types";
import { Settings } from "../../Settings/Settings";
import { CyberdeckState } from "../models/CyberdeckState";
import { componentSymbols } from "../models/constants";
import { Player } from "@player";
import { formatMoney } from "../../ui/formatNumber";
import { ComponentTooltip } from "./ComponentInventoryCount";

export function ComponentCost({
  cost,
  moneyCost = 0,
  disableTooltips = false,
}: {
  cost: ComponentCounts;
  moneyCost?: number;
  disableTooltips?: boolean;
}) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
        <ComponentCostRow
          available={CyberdeckState.components.rom}
          cost={cost.rom}
          symbol={componentSymbols.rom}
          disableTooltip={disableTooltips}
        />
        <ComponentCostRow
          available={CyberdeckState.components.neurodes}
          cost={cost.neurodes}
          symbol={componentSymbols.neurodes}
          disableTooltip={disableTooltips}
        />
        <ComponentCostRow
          available={CyberdeckState.components.chips}
          cost={cost.chips}
          symbol={componentSymbols.chips}
          disableTooltip={disableTooltips}
        />
        <ComponentCostRow
          available={CyberdeckState.components.cores}
          cost={cost.cores}
          symbol={componentSymbols.cores}
          disableTooltip={disableTooltips}
        />
        <ComponentCostRow
          available={CyberdeckState.components.iceBreakers}
          cost={cost.iceBreakers}
          symbol={componentSymbols.iceBreakers}
          disableTooltip={disableTooltips}
        />
      </div>
      {moneyCost > 0 && (
        <div
          style={{
            color: Player.money >= moneyCost ? Settings.theme.maplocation : Settings.theme.error,
            alignItems: "center",
          }}
        >
          {Player.money >= moneyCost ? "" : `${formatMoney(Math.floor(Player.money))}/`}
          {formatMoney(moneyCost)}
        </div>
      )}
    </>
  );
}

export function ComponentSymbol({ symbol, fontSize }: { symbol: string; fontSize?: string }) {
  const isROM = symbol === componentSymbols.rom;
  return (
    <span style={{ color: getSymbolColor(symbol), fontSize: fontSize || "16px", marginTop: isROM ? "-2px" : "0" }}>
      {" "}
      {symbol}
    </span>
  );
}

export function ComponentCostRow({
  available,
  cost,
  symbol,
  disableTooltip = false,
}: {
  available: number;
  cost: number;
  symbol: string;
  disableTooltip?: boolean;
}) {
  if (cost <= 0) return <></>;
  const row = (
    <span style={{ color: available >= cost ? Settings.theme.maplocation : Settings.theme.error, marginRight: "5px" }}>
      <ComponentSymbol symbol={symbol} />
      <span style={{ marginLeft: "3px" }}>
        {available >= cost ? "" : `${Math.floor(available)}/`}
        {Math.ceil(cost)}
      </span>
    </span>
  );
  return disableTooltip ? row : <ComponentTooltip symbol={symbol}>{row}</ComponentTooltip>;
}

function getSymbolColor(symbol: string): string {
  switch (symbol) {
    case componentSymbols.rom: // ROM
      return Settings.theme.cha;
    case componentSymbols.neurodes: // neurodes
      return Settings.theme.money;
    case componentSymbols.chips: // chips
      return Settings.theme.primary;
    case componentSymbols.iceBreakers: // ICEBreakers
      return Settings.theme.infolight;
    case componentSymbols.cores: // cores
      return Settings.theme.rep;
    default:
      return Settings.theme.error;
  }
}
