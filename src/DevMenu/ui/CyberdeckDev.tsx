import React from "react";
import { AutoExpandAccordion } from "../../ui/AutoExpand/AutoExpandAccordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AccordionSummary, Button, Tooltip, Typography } from "@mui/material";
import AccordionDetails from "@mui/material/AccordionDetails";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { CyberdeckState, hasCyberdeck } from "../../CyberDeck/models/CyberdeckState";
import { gainCyberdeck } from "../../CyberDeck/effects";
import { gainComponentMessage } from "../../CyberDeck/ui/gainComponentToast";
import { getCorruptedNetrunningRewards, getNetrunningRewards } from "../../CyberDeck/models/netrun";
import { NetrunningRewards } from "../../CyberDeck/Types";
import { RewardsModal } from "../../CyberDeck/ui/RewardsModal";
import { corruptedNetrunFlavorText, netrunFlavorText } from "../../CyberDeck/models/constants";

export function CyberdeckDev(): React.ReactElement {
  const [corrupted, setCorrupted] = React.useState(false);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({
    success: false,
    mods: [],
    components: {},
  });

  function getSomeComponents() {
    CyberdeckState.components.chips += 100;
    CyberdeckState.components.ROM += 100;
    CyberdeckState.components.neurodes += 100;
    CyberdeckState.components.cores += 5;
    gainComponentMessage({
      chips: 100,
      ROM: 100,
      neurodes: 100,
      cores: 5
    });
  }

  function getManyComponents() {
    CyberdeckState.components.chips += 1e6;
    CyberdeckState.components.ROM += 1e6;
    CyberdeckState.components.neurodes += 1e6;
    CyberdeckState.components.cores += 1000;
    gainComponentMessage({
      chips: 1e6,
      ROM: 1e6,
      neurodes: 1e6,
      cores: 1000,
    });
  }

  function getNetrunRewards() {
    const rewards = getNetrunningRewards();
    setCorrupted(false);
    setNetrunningModRewards({success: true, mods: rewards, components: {}});
    setShowRewardsModal(true);
  }

  function getCorruptedNetrunRewards() {
    const rewards = getCorruptedNetrunningRewards();
    setCorrupted(true);
    setNetrunningModRewards({success: true, mods: rewards, components: {}});
    setShowRewardsModal(true);
  }

  function clearMods() {
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    SnackbarEvents.emit("Cleared all mods from your cyberdeck.", ToastVariant.SUCCESS, 2000);
  }

  return (
    <>
      <RewardsModal
        open={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        rewards={netrunningModRewards}
        title={"Netrunning Results"}
        flavorText={corrupted ? corruptedNetrunFlavorText : netrunFlavorText}
      />
      <AutoExpandAccordion cacheKey="DEVMENU_CyberdeckDev" unmountOnExit={true}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Cyberdeck</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Tooltip title={<Typography>Acquire a cyberdeck and access to cyberdeck management.</Typography>}>
            <span>
              <Button
                disabled={hasCyberdeck()}
                onClick={() => {
                  gainCyberdeck();
                  SnackbarEvents.emit("Cyberdeck Get!", ToastVariant.SUCCESS, 2000);
                }}
              >
                Get Cyberdeck
              </Button>
            </span>
          </Tooltip>
          <br />
          <br />
          <Tooltip title={<Typography>Acquire some components for the cyberdeck.</Typography>}>
            <span>
              <Button
                onClick={() => {
                  getSomeComponents();
                }}
              >
                Get Some Components
              </Button>
            </span>
          </Tooltip>
          <br />
          <br />
          <Tooltip title={<Typography>Acquire lots of components for the cyberdeck.</Typography>}>
            <span>
              <Button
                onClick={() => {
                  getManyComponents();
                }}
              >
                Get Many Components
              </Button>
            </span>
          </Tooltip>
          <br />
          <br />
          <Tooltip title={<Typography>Acquire some mods from netrunning</Typography>}>
            <span>
              <Button
                onClick={() => {
                  getNetrunRewards();
                }}
              >
                Get Netrunning Rewards
              </Button>
            </span>
          </Tooltip>
          <br />
          <br />
          <Tooltip title={<Typography>Acquire some mods from netrunning at the Ishima Glitch</Typography>}>
            <span>
              <Button
                onClick={() => {
                  getCorruptedNetrunRewards();
                }}
              >
                Get Corrupted Netrunning Rewards
              </Button>
            </span>
          </Tooltip>
          <br />
          <br />
          <Tooltip title={<Typography>Remove all stored and installed mods from your cyberdeck</Typography>}>
            <span>
              <Button
                onClick={() => {
                  clearMods();
                }}
              >
                Remove all mods
              </Button>
            </span>
          </Tooltip>
        </AccordionDetails>
      </AutoExpandAccordion>
    </>
  );
}

