import React from "react";
import { ComponentCounts } from "../Types";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols, corruptedNetrunHintTexts } from "../models/constants";
import { ToastVariant } from "@enums";
import { CorruptibleText } from "../../ui/React/CorruptibleText";
import { Typography } from "@mui/material";

export function gainComponentMessage(result: Partial<ComponentCounts>) {
  if (!result.chips && !result.rom && !result.neurodes) {
    return;
  }
  SnackbarEvents.emit(
    <>
      Gained{" "}
      {!!result.chips && (
        <>
          +{result.chips} <ComponentSymbol symbol={componentSymbols.chips} />
        </>
      )}
      {!!result.rom && (
        <>
          {" "}
          +{result.rom} <ComponentSymbol symbol={componentSymbols.rom} />
        </>
      )}
      {!!result.neurodes && (
        <>
          {" "}
          +{result.neurodes} <ComponentSymbol symbol={componentSymbols.neurodes} />
        </>
      )}
    </>,
    ToastVariant.INFO,
    2000,
  );
}

export function getCorruptedHint(message: string = "") {
  const hint = message || corruptedNetrunHintTexts[Math.floor(Math.random() * corruptedNetrunHintTexts.length)];
  return (
    <Typography>
      <CorruptibleText content={hint} spoiler={false}></CorruptibleText>
    </Typography>
  );
}
