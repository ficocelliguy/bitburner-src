import React from "react";
import { Box, Container, Typography } from "@mui/material";
import {
  PORTAL_CONTAINER_CLASS,
  PORTAL_CORE_CLASS,
  PORTAL_RING_CLASS,
  PORTAL_RING_REVERSE_CLASS,
  usePortalStyles,
} from "./cyberdeckStyles";
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
  const styles = usePortalStyles();
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
    <Container disableGutters maxWidth={false} sx={[{ m: 3 }, corrupted && styles.corruptedSkew]}>
      <RewardsModal
        open={showRewardsModal}
        onClose={() => resetPortal()}
        rewards={netrunningModRewards}
        title={"Netrunning Results"}
        flavorText={corrupted ? corruptedNetrunFlavorText : netrunFlavorText}
      />
      {showPortal && (
        <>
          <Box
            className={PORTAL_CONTAINER_CLASS}
            sx={[styles.portalContainer, entering && styles.enteringPortal, disabled && styles.portalDisabled]}
            onClick={() => void handlePortalClick()}
          >
            <Box className={PORTAL_RING_CLASS} sx={styles.portalRing} />
            <Box
              className={`${PORTAL_RING_CLASS} ${PORTAL_RING_REVERSE_CLASS}`}
              sx={[styles.portalRing, styles.portalRingReverse]}
            />
            <Box sx={styles.orbiter} />
            <Box className={PORTAL_CORE_CLASS} sx={styles.portalCore} />
          </Box>
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
                  Hostile trace risk: {formatNumber(getNetrunningTraceFraction(corrupted) * 100, 2)}%
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}