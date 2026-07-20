import React from "react";
import { Container } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { RewardsModal } from "./RewardsModal";
import { DeckModule } from "../Types";
import { createModule } from "../models/createModule";
import { CyberDeckState } from "../models/CyberDeckState";

export function NetrunningPortal(): React.ReactElement {
  const { classes } = cyberdeckStyles();
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningRewards, setNetrunningRewards] = React.useState<DeckModule[]>([]);

  function handlePortalClick() {
    setEntering(true);
    const rewards = [createModule(), createModule(), createModule()];
    CyberDeckState.storedModules.unshift(...rewards);
    setNetrunningRewards(rewards);
    setShowRewardsModal(true);
    setTimeout(() => { if (!entering) { setShowPortal(false) }}, 1500);
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
        <div
          className={`${classes.portalContainer} ${entering ? classes.enteringPortal : ""}`}
          onClick={handlePortalClick}
        >
          <div className={classes.portalRing}></div>
          <div className={`${classes.portalRing} ${classes.portalRingReverse}`}></div>
          <div className={`${classes.orbiter}`}></div>
        <div className={`${classes.portalCore}`}></div>
        </div>
      )}
    </Container>
  );
}