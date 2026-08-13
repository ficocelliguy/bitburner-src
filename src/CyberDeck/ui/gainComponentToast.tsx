import React from "react";
import { ComponentCounts } from "../Types";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";
import { ToastVariant } from "@enums";

export function gainComponentMessage(result: Partial<ComponentCounts>) {
  if (!result.chips && !result.ROM && !result.neurodes) {
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
      {!!result.ROM && (
        <>
          {" "}
          +{result.ROM} <ComponentSymbol symbol={componentSymbols.ROM} />
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