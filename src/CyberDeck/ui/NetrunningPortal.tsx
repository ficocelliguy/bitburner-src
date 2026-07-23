import React from "react";
import { Container, Typography } from "@mui/material";
import {  portalStyles } from "./cyberdeckStyles";
import { RewardsModal } from "./RewardsModal";
import { DeckModule } from "../Types";
import { CyberDeckState } from "../models/CyberDeckState";
import { getCurrentNetrunningIceCost, netRun } from "../models/componentEconomy";

export function NetrunningPortal(): React.ReactElement {
  const { classes } = portalStyles({});
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningRewards, setNetrunningRewards] = React.useState<DeckModule[]>([]);

  const cost = getCurrentNetrunningIceCost();
  const disabled = !entering && CyberDeckState.components.ICE < cost;

  function handlePortalClick() {
    const rewards = netRun();
    if (!rewards) return;
    setEntering(true);

    setNetrunningRewards(rewards);
    setTimeout(() => { if (!entering) { setShowPortal(false); setShowRewardsModal(true); }}, 1200);
  }

  function resetPortal() {
    setShowRewardsModal(false);
    setEntering(false);
    setShowPortal(true);
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ m: 3 }}>
      <RewardsModal open={showRewardsModal} onClose={() => resetPortal()} rewards={netrunningRewards} />
      {showPortal && (
        <>
          <div
            className={`${classes.portalContainer} ${entering ? classes.enteringPortal : ""} ${disabled ? classes.portalDisabled : ""}`}
            onClick={handlePortalClick}
          >
            <div className={`${classes.portalRing}`}></div>
            <div
              className={`${classes.portalRing} ${classes.portalRingReverse}`}
            ></div>
            <div className={`${classes.orbiter}`}></div>
            <div className={`${classes.portalCore}`}></div>
          </div>
          <Typography>ICEbreakers needed: {cost}</Typography>
        </>
      )}
    </Container>
  );
}