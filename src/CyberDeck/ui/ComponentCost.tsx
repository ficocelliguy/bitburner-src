import React, { useState } from "react";
import { ComponentCounts } from "../Types";
import { Settings } from "../../Settings/Settings";
import { CyberDeckState } from "../models/CyberDeckState";


export function ComponentCost({ cost }: { cost: ComponentCounts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {!!cost.ROM && (
        cost.ROM < CyberDeckState.components.ROM ? (
          <span style={{ color: Settings.theme.maplocation, marginRight: "5px" }}>{cost.ROM} ROM</span>
        ) : (
          <span style={{ color: Settings.theme.error, marginRight: "5px" }}>{Math.floor(CyberDeckState.components.ROM)}/{cost.ROM} ROM</span>
        )
      )}
      {!!cost.neurodes && (
        cost.neurodes < CyberDeckState.components.neurodes ? (
          <span style={{ color: Settings.theme.maplocation, marginRight: "5px" }}>{cost.neurodes} Neurodes</span>
        ) : (
          <span style={{ color: Settings.theme.error, marginRight: "5px" }}>{Math.floor(CyberDeckState.components.neurodes)}/{cost.neurodes} Neurodes</span>
        )
      )}
      {!!cost.chips && (
        cost.chips < CyberDeckState.components.chips ? (
          <span style={{ color: Settings.theme.maplocation, marginRight: "5px" }}>{cost.chips} Chips</span>
        ) : (
          <span style={{ color: Settings.theme.error, marginRight: "5px" }}>{Math.floor(CyberDeckState.components.chips)}/{cost.chips} Chips</span>
        )
      )}
      {!!cost.ICE && (
        cost.ICE < CyberDeckState.components.ICE ? (
          <span style={{ color: Settings.theme.maplocation, marginRight: "5px" }}>{cost.ICE} ICE</span>
        ) : (
          <span style={{ color: Settings.theme.error, marginRight: "5px" }}>{Math.floor(CyberDeckState.components.ICE)}/{cost.ICE} ICE</span>
        )
      )}
    </div>
  );
}
