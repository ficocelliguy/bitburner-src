import React from "react";
import { Box, Container, Typography } from "@mui/material";
import {
  PORTAL_CONTAINER_CLASS,
  PORTAL_CORE_CLASS,
  PORTAL_RING_CLASS,
  PORTAL_RING_REVERSE_CLASS,
  usePortalStyles,
} from "./cyberdeckStyles";
import { CyberdeckState, hasCyberdeck } from "../models/CyberdeckState";
import { formatNumber } from "../../ui/formatNumber";
import { Settings } from "../../Settings/Settings";
import { CorruptibleText } from "../../ui/React/CorruptibleText";
import { canNetrun, getCurrentNetrunningIceCost, getNetrunningTraceFraction } from "../models/netrunRewards";
import { useRerender } from "../../ui/React/hooks";
import { dialogBoxCreate } from "../../ui/React/DialogBox";
import { NetrunningState } from "../models/NetrunningState";

export function NetrunningPortal({ entered, corrupted = false }: { entered: () => void, corrupted?: boolean }): React.ReactElement {
  useRerender(200);
  const styles = usePortalStyles();
  const [entering, setEntering] = React.useState(false);
  const [showPortal, setShowPortal] = React.useState(true);


  const disabled = !entering && !canNetrun(corrupted);

  function handlePortalClick() {
    if (!hasCyberdeck()) {
      dialogBoxCreate(
        <Box>
          <CorruptibleText
            content={"Netrunning without a cyberdeck? Are you trying to get yourself killed?"}
            spoiler={false}
          />
        </Box>,
      );
      return;
    }
    if (NetrunningState.isNetrunning && NetrunningState.corrupted !== corrupted) {
      dialogBoxCreate(
        <Box>
          <CorruptibleText
            content={"There is already a netrun in progress."}
            spoiler={false}
          />
        </Box>,
      );
      return;
    }
    if (!canNetrun(corrupted)) return;
    setEntering(true);
    if (corrupted) {
      CyberdeckState.hasDiscoveredGlitch = true;
    }
    setTimeout(() => {
      if (!entering) {
        setShowPortal(false);
      }
      entered();
    }, 1200);
  }

  function minimumCost(corrupted: boolean) {
    return corrupted ? 40 : 10;
  }

  return (
    <Container disableGutters maxWidth={false} sx={[{ m: 3 }, corrupted && styles.corruptedSkew]}>
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
          {!entering && hasCyberdeck() && (
            <>
              {CyberdeckState.modStorageSize < CyberdeckState.storedModules.length ? (
                <Typography sx={{ textAlign: "center", marginTop: "20px", color: Settings.theme.warning }}>
                  Module storage full!
                </Typography>
              ) : (
                <Typography sx={{ textAlign: "center", marginTop: "20px" }}>
                  {corrupted ? (
                    <CorruptibleText
                      content={`ICEBreakers needed: ${getCurrentNetrunningIceCost(corrupted)}`}
                      spoiler={false}
                    />
                  ) : (
                    `ICEBreakers needed: ${getCurrentNetrunningIceCost(corrupted)}`
                  )}
                </Typography>
              )}
              {getCurrentNetrunningIceCost(corrupted) > minimumCost(corrupted) && (
                <Typography sx={{ textAlign: "center", fontStyle: "italic", fontSize: "13px" }}>
                  Hostile trace risk: {formatNumber(getNetrunningTraceFraction(corrupted) * 10, 2)}%
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}
