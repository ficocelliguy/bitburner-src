import React from "react";
import { Container, Typography } from "@mui/material";
import { portalStyles } from "./cyberdeckStyles";
import { RewardsModal } from "./RewardsModal";
import { NetrunningRewards } from "../Types";
import { CyberdeckState } from "../models/CyberdeckState";
import {
  canNetrun,
  getCurrentNetrunningIceCost,
  getNetrunningTraceFraction,
  netRun,
} from "../models/componentEconomy";
import { formatNumber } from "../../ui/formatNumber";
import { Settings } from "../../Settings/Settings";

export function NetrunningPortal(): React.ReactElement {
  const { classes } = portalStyles({});
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({ success: false, modules: [], components: {} });

  const cost = getCurrentNetrunningIceCost();
  const disabled = !entering && !canNetrun();

  async function handlePortalClick() {
    if (!canNetrun()) return;
    setEntering(true);
    const rewards = await netRun();
    if (!rewards.success) return;
    setNetrunningModRewards(rewards);
    setTimeout(() => { if (!entering) { setShowPortal(false); setShowRewardsModal(true); }}, 1200);
  }

  function resetPortal() {
    setShowRewardsModal(false);
    setEntering(false);
    setShowPortal(true);
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ m: 3 }}>
      <RewardsModal open={showRewardsModal} onClose={() => resetPortal()} rewards={netrunningModRewards} />
      {showPortal && (
        <>
          <div
            className={`${classes.portalContainer} ${entering ? classes.enteringPortal : ""} ${
              disabled ? classes.portalDisabled : ""
            }`}
            onClick={() => void handlePortalClick()}
          >
            <div className={`${classes.portalRing}`}></div>
            <div className={`${classes.portalRing} ${classes.portalRingReverse}`}></div>
            <div className={`${classes.orbiter}`}></div>
            <div className={`${classes.portalCore}`}></div>
          </div>
          {!entering && (
            <>
              <Typography sx={{ textAlign: "center", marginTop: "20px" }}>{`ICEbreakers needed: ${cost}`}</Typography>
              {cost > 1 && (
                <Typography sx={{ textAlign: "center", fontStyle: "italic", fontSize: "13px" }}>
                  Hostile trace risk: {formatNumber(getNetrunningTraceFraction() * 100, 2)}%
                </Typography>
              )}
            </>
          )}
          {CyberdeckState.modStorageSize < CyberdeckState.storedModules.length && (
            <Typography sx={{ textAlign: "center", marginTop: "20px", color: Settings.theme.warning }}>Module storage full!</Typography>
          )}
        </>
      )}
    </Container>
  );
}