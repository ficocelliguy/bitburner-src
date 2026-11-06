import React from "react";
import { Tooltip, Typography } from "@mui/material";
import { ModKey, ModStats, statBonusDetails } from "../Types";
import { Settings } from "../../Settings/Settings";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";
import { getFormattedStatBonus, getStatBonusList, isBuff } from "../utils/modStatsUtils";

export function StatBonus({
  stats = {},
  emptyMessage = "",
  fontSize = 10,
  useShortStatNames = true,
  showTooltip = false,
}: {
  stats?: ModStats;
  emptyMessage?: string;
  fontSize?: number;
  useShortStatNames?: boolean;
  showTooltip?: boolean;
}) {
  // TODO-fico: cache this with useEffect or similar
  const results = getStatBonusList(stats);

  if (!results.length) return <div>{emptyMessage}</div>;

  return (
    <>
      {results.map(([key, value], index) => (
        <FormatStat
          key={index}
          keyName={key}
          value={value}
          useShortName={useShortStatNames}
          showTooltip={showTooltip}
          fontSize={fontSize}
        />
      ))}
    </>
  );
}

function FormatStat({
  keyName,
  value,
  fontSize = 10,
  useShortName = true,
  showTooltip = false,
}: {
  keyName: ModKey;
  value: number;
  fontSize?: number;
  useShortName?: boolean;
  showTooltip?: boolean;
}): JSX.Element {
  const { formattedKey, valueStr } = getFormattedStatBonus(keyName, value, useShortName);

  return (
    <Tooltip title={showTooltip ? statBonusDetails[keyName].tooltip : ""}>
      <Typography
        style={{
          fontSize: `${fontSize}px`,
          display: "flex",
          minWidth: 0,
          justifyContent: "space-between",
          padding: `${Math.ceil(fontSize / 10)}px 3px`,
          color: Settings.theme.maplocation,
          lineHeight: "11px",
        }}
      >
        <span>
          <FormattedKeyElement formattedKey={formattedKey} />:
        </span>
        <span
          style={{ color: isBuff(keyName, value) ? Settings.theme.primary : Settings.theme.hp, paddingLeft: "3px" }}
        >
          {value > 0 ? "+" : ""}
          {valueStr}
        </span>
      </Typography>
    </Tooltip>
  );
}

function FormattedKeyElement({ formattedKey }: { formattedKey: string }): JSX.Element {
  if (formattedKey === "Rom Production") {
    return <ComponentSymbol symbol={componentSymbols.rom} />;
  }
  if (formattedKey === "Chip Production") {
    return <ComponentSymbol symbol={componentSymbols.chips} />;
  }
  if (formattedKey === "Neurode Production") {
    return <ComponentSymbol symbol={componentSymbols.neurodes} />;
  }
  return <>{formattedKey}</>;
}
