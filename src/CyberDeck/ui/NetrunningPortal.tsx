import React from "react";
import { Container, Typography } from "@mui/material";
import { portalStyles } from "./cyberdeckStyles";
import { RewardsModal } from "./RewardsModal";
import { NetrunningRewards } from "../Types";
import { CyberdeckState } from "../models/CyberdeckState";
import { formatNumber } from "../../ui/formatNumber";
import { Settings } from "../../Settings/Settings";
import { CorruptibleText } from "../../ui/React/CorruptibleText";
import { canNetrun, getCurrentNetrunningIceCost, getNetrunningTraceFraction, netRun } from "../models/netrun";
import { corruptedNetrunFlavorText, netrunFlavorText } from "../models/constants";
import { useRerender } from "../../ui/React/hooks";

export function NetrunningPortal({corrupted = false}: {corrupted?: boolean}): React.ReactElement {
  useRerender(200);
  const { classes } = portalStyles({});
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({ success: false, modules: [], components: {} });

  const disabled = !entering && !canNetrun(corrupted);

  async function handlePortalClick() {
    if (!canNetrun(corrupted)) return;
    setEntering(true);
    const rewards = await netRun(corrupted);
    if (!rewards.success) return;
    setNetrunningModRewards(rewards);
    setTimeout(() => { if (!entering) { setShowPortal(false); setShowRewardsModal(true); }}, 1200);
  }

  function resetPortal() {
    setShowRewardsModal(false);
    setEntering(false);
    setShowPortal(true);
  }

  function minimumCost(corrupted: boolean) {
    return corrupted ? 5 : 1;
  }

  return (
    <Container disableGutters maxWidth={false} className={corrupted ? classes.corruptedSkew : ""} sx={{ m: 3 }}>
      <RewardsModal
        open={showRewardsModal}
        onClose={() => resetPortal()}
        rewards={netrunningModRewards}
        title={"Netrunning Results"}
        flavorText={corrupted ? corruptedNetrunFlavorText : netrunFlavorText}
      />
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
              {CyberdeckState.modStorageSize < CyberdeckState.storedModules.length ? (
                <Typography sx={{ textAlign: "center", marginTop: "20px", color: Settings.theme.warning }}>
                  Module storage full!
                </Typography>
              ) : (
                <Typography sx={{ textAlign: "center", marginTop: "20px" }}>
                  {corrupted ? (
                    <CorruptibleText
                      content={`ICEbreakers needed: ${getCurrentNetrunningIceCost(corrupted)}`}
                      spoiler={false}
                    />
                  ) : (
                    `ICEbreakers needed: ${getCurrentNetrunningIceCost(corrupted)}`
                  )}
                </Typography>
              )}
              {getCurrentNetrunningIceCost(corrupted) > minimumCost(corrupted) && (
                <Typography sx={{ textAlign: "center", fontStyle: "italic", fontSize: "13px" }}>
                  Hostile trace risk: {formatNumber(getNetrunningTraceFraction() * 100, 2)}%
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}