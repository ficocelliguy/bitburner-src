import React from "react";
import { Box, Container, Typography } from "@mui/material";
import {
  PORTAL_CONTAINER_CLASS,
  PORTAL_CORE_CLASS,
  PORTAL_RING_CLASS,
  PORTAL_RING_REVERSE_CLASS,
  PORTAL_STAGE_CLASS,
  tickerLoop,
  useNetrunTargetStyles,
  usePortalStyles,
} from "./cyberdeckStyles";
import { CyberdeckState, hasCyberdeck } from "../models/CyberdeckState";
import { formatNumber } from "../../ui/formatNumber";
import { Settings } from "../../Settings/Settings";
import { CorruptibleText } from "../../ui/React/CorruptibleText";
import {
  canNetrun,
  getCurrentNetrunningIceCost,
  getNetrunningTraceFraction,
  minimumNetrunCost,
} from "../models/netrunRewards";
import { useRerender } from "../../ui/React/hooks";
import { dialogBoxCreate } from "../../ui/React/DialogBox";
import { NetrunningState } from "../models/NetrunningState";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { MARQUEE_LINES } from "../models/constants";
import { moduleStorageAvailable } from "../models/createModule";
import { WebBackground } from "../assets/web";

export function NetrunningPortal({
  entered,
  corrupted = false,
}: {
  entered: () => void;
  corrupted?: boolean;
}): React.ReactElement {
  useRerender(200);
  const styles = usePortalStyles();
  const netrunStyles = useNetrunTargetStyles();
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
          <CorruptibleText content={"There is already a netrun in progress."} spoiler={false} />
        </Box>,
      );
      return;
    }
    if (!moduleStorageAvailable()) {
      SnackbarEvents.emit("Module storage is full!", ToastVariant.WARNING, 2000);
      return;
    }
    if (CyberdeckState.components.iceBreakers < getCurrentNetrunningIceCost(corrupted)) {
      SnackbarEvents.emit(
        `Insufficient ICEBreakers: ${CyberdeckState.components.iceBreakers}/${getCurrentNetrunningIceCost(corrupted)}`,
        ToastVariant.WARNING,
        2000,
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
    }, 1000);
  }

  function getIcebreakerText() {
    return CyberdeckState.components.iceBreakers < getCurrentNetrunningIceCost(corrupted)
      ? `Insufficient ICEBreakers: ${CyberdeckState.components.iceBreakers}/${getCurrentNetrunningIceCost(corrupted)}`
      : `ICEBreakers needed: ${getCurrentNetrunningIceCost(corrupted)}`;
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ m: 3 }}>
      {showPortal && (
        <>
          <Box sx={styles.portalAnchor}>
            <Box sx={[netrunStyles.circuitry, styles.portalWebBackground, entering && styles.backgroundEnteringPortal]}>
              {WebBackground}
            </Box>
            <Box sx={[corrupted && styles.corruptedSkew]}>
              <Box className={PORTAL_STAGE_CLASS} sx={[styles.portalStage, entering && styles.enteringPortal]}>
                <Box sx={styles.portalBlackBackground} />
                <Box
                  className={PORTAL_CONTAINER_CLASS}
                  sx={[styles.portalContainer, disabled && styles.portalDisabled]}
                  onClick={() => void handlePortalClick()}
                >
                  <Box className={PORTAL_RING_CLASS} sx={styles.portalRing} />
                  <Box
                    className={`${PORTAL_RING_CLASS} ${PORTAL_RING_REVERSE_CLASS}`}
                    sx={[styles.portalRing, styles.portalRingReverse]}
                  />
                  <Box sx={styles.orbiter} />
                  <Box className={PORTAL_CORE_CLASS} sx={styles.portalCore} />
                  <Box aria-hidden sx={styles.portalTextMask}>
                    {MARQUEE_LINES.map((line, i) => (
                      <Box key={i} sx={{ overflow: "hidden", width: "100%" }}>
                        <Box
                          sx={{
                            display: "flex",
                            width: "max-content",
                            whiteSpace: "nowrap",
                            animation: `${tickerLoop} ${(corrupted ? 8 : 45) + (i % 4) * 12}s linear infinite`,
                            animationDirection: `${!corrupted || i % 4 ? "normal" : "reverse"}`,
                          }}
                        >
                          <Box component="span" sx={{ paddingRight: "2rem" }}>
                            {line}
                          </Box>
                          <Box component="span" sx={{ paddingRight: "2rem" }} aria-hidden>
                            {line}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          {!entering && hasCyberdeck() && (
            <>
              {!moduleStorageAvailable() && (
                <Typography sx={{ textAlign: "center", marginTop: "30px", color: Settings.theme.warning }}>
                  Module storage full!
                </Typography>
              )}

              <Typography sx={{ textAlign: "center", marginTop: "30px" }}>
                {corrupted ? <CorruptibleText content={getIcebreakerText()} spoiler={false} /> : getIcebreakerText()}
              </Typography>

              {getCurrentNetrunningIceCost(corrupted) > minimumNetrunCost(corrupted) && (
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
