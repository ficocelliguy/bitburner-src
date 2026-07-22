import React from "react";
import { Container, Typography } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { RewardsModal } from "./RewardsModal";
import { DeckModule } from "../Types";
import { createModule } from "../models/createModule";
import { CyberDeckState } from "../models/CyberDeckState";
import { getCurrentNetrunningIceCost } from "../models/componentEconomy";

export function NetrunningPortal(): React.ReactElement {
  const { classes } = cyberdeckStyles();
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningRewards, setNetrunningRewards] = React.useState<DeckModule[]>([]);

  function handlePortalClick() {
    setEntering(true);
    // TODO-fico: check if there is enough ICE to enter the portal
    // TODO-fico: move this to a shared location
    const rewards = [createModule(), createModule(), createModule()].sort((m1, m2) => m1.level - m2.level);
    CyberDeckState.storedModules.unshift(...rewards);
    CyberDeckState.lastNetrunningTimestamp = Date.now();
    setNetrunningRewards(rewards);
    setTimeout(() => { if (!entering) { setShowPortal(false); setShowRewardsModal(true); }}, 1200);
  }

  const cost = getCurrentNetrunningIceCost();

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
            className={`${classes.portalContainer} ${entering ? classes.enteringPortal : ""}`}
            onClick={handlePortalClick}
          >
            <div className={classes.portalRing}></div>
            <div className={`${classes.portalRing} ${classes.portalRingReverse}`}></div>
            <div className={`${classes.orbiter}`}></div>
            <div className={`${classes.portalCore}`}></div>
          </div>
          <Typography>ICEbreakers needed: {cost}</Typography>
        </>
      )}
    </Container>
  );
}