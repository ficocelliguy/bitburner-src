import React from "react";
import { AutoExpandAccordion } from "../../ui/AutoExpand/AutoExpandAccordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  AccordionSummary,
  Button,
  Dialog,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Checkbox,
  Select,
  MenuItem,
} from "@mui/material";
import AccordionDetails from "@mui/material/AccordionDetails";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";
import { CyberdeckState, hasCyberdeck } from "../../CyberDeck/models/CyberdeckState";
import { gainCyberdeck } from "../../CyberDeck/models/cyberdeckServer";
import { gainComponentMessage } from "../../CyberDeck/ui/gainComponentToast";
import { getCorruptedNetrunningRewards, getNetrunningRewards } from "../../CyberDeck/models/netrunRewards";
import {
  ConsumableStats,
  DeckMod,
  EndgameMults,
  MiscMults,
  NetrunningRewards,
  SocketList,
} from "../../CyberDeck/Types";
import { ModType } from "@enums";
import { RewardsModal } from "../../CyberDeck/ui/RewardsModal";
import { corruptedNetrunFlavorText, netrunFlavorText } from "../../CyberDeck/models/constants";
import { prestigeCyberdeck } from "../../CyberDeck/utils/prestigeCyberdeck";
import {
  getID,
  getNextCraftingPowerSupplyWHRNG,
  getNextNetrunningCorruptedWHRNG,
  getNextNetrunningWHRNG,
} from "../../CyberDeck/utils/statRng";
import { createModule } from "../../CyberDeck/models/createModule";
import { Settings } from "../../Settings/Settings";
import { Multipliers } from "../../PersonObjects/Multipliers";
import {
  getDefaultConsumableStats,
  getDefaultEndgameMults,
  getDefaultMiscMults,
  getDefaultPlayerMults,
} from "../../CyberDeck/utils/modStatsUtils";
import { NumberInput } from "../../ui/React/NumberInput";

export function CyberdeckDev(): React.ReactElement {
  const [corrupted, setCorrupted] = React.useState(false);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [showCustomModModal, setShowCustomModModal] = React.useState(false);
  const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({
    mods: [],
    components: {},
  });

  function getSomeComponents() {
    CyberdeckState.components.chips += 100;
    CyberdeckState.components.rom += 100;
    CyberdeckState.components.neurodes += 100;
    CyberdeckState.components.cores += 5;
    CyberdeckState.components.iceBreakers += 30;
    gainComponentMessage({
      chips: 100,
      rom: 100,
      neurodes: 100,
      cores: 5,
      iceBreakers: 30,
    });
  }

  function getManyComponents() {
    CyberdeckState.components.chips += 1e6;
    CyberdeckState.components.rom += 1e6;
    CyberdeckState.components.neurodes += 1e6;
    CyberdeckState.components.cores += 1000;
    CyberdeckState.components.iceBreakers += 300;
    gainComponentMessage({
      chips: 1e6,
      rom: 1e6,
      neurodes: 1e6,
      cores: 1000,
      iceBreakers: 300,
    });
  }

  function getNetrunRewards() {
    const rewards = getNetrunningRewards(getNextNetrunningWHRNG(), 150);
    setCorrupted(false);
    setNetrunningModRewards({ mods: rewards, components: {} });
    setShowRewardsModal(true);
  }

  function getCorruptedNetrunRewards() {
    const rewards = getCorruptedNetrunningRewards(getNextNetrunningCorruptedWHRNG(), 150);
    setCorrupted(true);
    setNetrunningModRewards({ mods: rewards, components: {} });
    setShowRewardsModal(true);
  }

  function clearMods() {
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    SnackbarEvents.emit("Cleared all mods from your cyberdeck.", ToastVariant.SUCCESS, 2000);
  }

  function resetCyberdeck() {
    // TODO-fico: remove SF?
    prestigeCyberdeck(true);
    SnackbarEvents.emit("Cyberdeck Lost!", ToastVariant.SUCCESS, 2000);
  }

  function generateRandomMods() {
    CyberdeckState.installedModules = [];
    CyberdeckState.storedModules = [];
    CyberdeckState.connections = [];
    CyberdeckState.coveredSockets = [];
    CyberdeckState.netrunningLevel += 18;
    for (let i = 0; i < 4; i++) {
      CyberdeckState.installedModules.push(createModule(getNextNetrunningWHRNG()));
    }
    for (let i = 0; i < 4; i++) {
      CyberdeckState.storedModules.push(createModule(getNextNetrunningWHRNG()));
    }

    CyberdeckState.storedModules.push(createModule(getNextNetrunningWHRNG(), ModType.RackExtension, 8));
    CyberdeckState.netrunningLevel -= 18;
    CyberdeckState.components.rom = 25;
    CyberdeckState.components.chips = 25;
    CyberdeckState.components.neurodes = 25;
    CyberdeckState.components.iceBreakers = 40;
    CyberdeckState.components.cores = 4;
  }

  function addCustomMod(mod?: DeckMod | undefined) {
    setShowCustomModModal(false);
    if (mod) {
      CyberdeckState.storedModules.unshift(mod);
      setNetrunningModRewards({ mods: [mod], components: {} });
      setShowRewardsModal(true);
    }
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
      <CreateCustomModModal open={showCustomModModal} onClose={addCustomMod} />
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
          <Tooltip title={<Typography>Remove and reset the cyberdeck.</Typography>}>
            <span>
              <Button disabled={!hasCyberdeck()} onClick={resetCyberdeck}>
                Remove Cyberdeck
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
          <Tooltip
            title={
              <Typography>
                Remove existing mods, set components to a base level, and generate a number of random mods
              </Typography>
            }
          >
            <span>
              <Button
                onClick={() => {
                  generateRandomMods();
                }}
              >
                Reset And Get Random Mods
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
          <br />
          <br />
          <Tooltip title={<Typography>Build-a-bear, but way more cyberpunk</Typography>}>
            <span>
              <Button onClick={() => setShowCustomModModal(true)}>Create Custom Mod</Button>
            </span>
          </Tooltip>
        </AccordionDetails>
      </AutoExpandAccordion>
    </>
  );
}

function CreateCustomModModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (d?: DeckMod | undefined) => void;
}): React.ReactElement {
  const [type, setType] = React.useState<ModType>(ModType.ProcessingMod);
  const [sockets, setSockets] = React.useState<SocketList>([false, false, false, false, false, false, false, false]);
  const [playerMults, setPlayerMults] = React.useState<Multipliers>(getDefaultPlayerMults());
  const [otherMults, setOtherMults] = React.useState<MiscMults>(getDefaultMiscMults());
  const [consumables, setConsumables] = React.useState<ConsumableStats>(getDefaultConsumableStats());
  const [endgameMults, setEndgameMults] = React.useState<EndgameMults>(getDefaultEndgameMults());
  const [rackSlots, setRackSlots] = React.useState(0);

  function create() {
    onClose({
      type,
      id: getID(getNextCraftingPowerSupplyWHRNG()),
      rarity: 0,
      sockets,
      stats: {
        playerMults,
        otherMults,
        endgameMults,
        consumableStats: consumables,
        extraRackSlots: rackSlots,
      },
    });
  }

  function updateSockets(i: number) {
    sockets[i] = !sockets[i];
    setSockets([...sockets]);
  }

  function updatePlayerMult(key: string, value: number) {
    if (!Object.hasOwn(playerMults, key)) {
      throw new Error(`Invalid player mult key provided: ${key}`);
    }
    playerMults[key as keyof Multipliers] = value;
    setPlayerMults({ ...playerMults });
  }

  function updateOtherMult(key: string, value: number) {
    if (!Object.hasOwn(otherMults, key)) {
      throw new Error(`Invalid other mult key provided: ${key}`);
    }
    otherMults[key as keyof MiscMults] = value;
    setOtherMults({ ...otherMults });
  }

  function updateConsumables(key: string, value: number) {
    if (!Object.hasOwn(consumables, key)) {
      throw new Error(`Invalid consumable key provided: ${key}`);
    }
    consumables[key as keyof ConsumableStats] = value;
    setConsumables({ ...consumables });
  }

  function updateEndgameMults(key: string, value: number) {
    if (!Object.hasOwn(endgameMults, key)) {
      throw new Error(`Invalid endgame mult key provided: ${key}`);
    }
    endgameMults[key as keyof EndgameMults] = value;
    setEndgameMults({ ...endgameMults });
  }

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" sx={{ padding: "10px" }}>
      <div
        style={{
          width: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "60vh",
          overflow: "scroll",
        }}
      >
        <Typography>Create custom mod</Typography>
        <FormControl>
          <InputLabel id="type-select">Mod Type</InputLabel>
          <Select
            labelId="type-select"
            id="type-dropdown"
            onChange={(e) => setType(e.target.value as ModType)}
            value={type}
          >
            {Object.values(ModType).map((modType) => (
              <MenuItem key={modType} value={modType}>
                {modType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <Typography id="sockets-select">Select Sockets</Typography>
          <div style={{ display: "inline-flex" }}>
            {sockets.map((_, index) => (
              <Checkbox
                key={index}
                value={sockets[index]}
                onChange={() => updateSockets(index)}
                sx={{
                  color: Settings.theme.secondary,
                  "&.Mui-checked": {
                    color: Settings.theme.primary,
                  },
                }}
              />
            ))}
          </div>
        </FormControl>

        {type === ModType.SkillChip ? (
          <AutoExpandAccordion cacheKey={"consumable mults"} unmountOnExit={true}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Edit Consumable Stats...</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Object.keys(consumables).map((key, index) => (
                <div style={{ display: "inline-flex" }} key={index}>
                  <Typography sx={{ width: "260px" }}>{key}</Typography>
                  <NumberInput placeholder={key} onChange={(n) => updateConsumables(key, n)} />
                </div>
              ))}
            </AccordionDetails>
          </AutoExpandAccordion>
        ) : (
          <>
            <AutoExpandAccordion cacheKey={"player mults"} unmountOnExit={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Edit Player Mults...</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.keys(playerMults).map((key, index) => (
                  <div style={{ display: "inline-flex" }} key={index}>
                    <Typography sx={{ width: "260px" }}>{key}</Typography>
                    <NumberInput placeholder={key} onChange={(n) => updatePlayerMult(key, n)} />
                  </div>
                ))}
              </AccordionDetails>
            </AutoExpandAccordion>

            <AutoExpandAccordion cacheKey={"other mults"} unmountOnExit={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Edit Other Mults...</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.keys(otherMults).map((key, index) => (
                  <div style={{ display: "inline-flex" }} key={index}>
                    <Typography sx={{ width: "260px" }}>{key}</Typography>
                    <NumberInput placeholder={key} onChange={(n) => updateOtherMult(key, n)} />
                  </div>
                ))}
              </AccordionDetails>
            </AutoExpandAccordion>

            <AutoExpandAccordion cacheKey={"endgame mults"} unmountOnExit={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Edit Endgame Mults...</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.keys(endgameMults).map((key, index) => (
                  <div style={{ display: "inline-flex" }} key={index}>
                    <Typography sx={{ width: "260px" }}>{key}</Typography>
                    <NumberInput placeholder={key} onChange={(n) => updateEndgameMults(key, n)} />
                  </div>
                ))}
              </AccordionDetails>
            </AutoExpandAccordion>

            <div style={{ display: "inline-flex", margin: "10px" }}>
              <Typography sx={{ width: "260px" }}>Extra Rack SLots</Typography>
              <NumberInput placeholder={"Rack Slots"} onChange={(n) => setRackSlots(n)} />
            </div>
          </>
        )}
      </div>
      <div style={{ display: "inline-flex" }}>
        <Button onClick={create}>Create</Button>
        <Button onClick={() => onClose()}>Cancel</Button>
      </div>
    </Dialog>
  );
}
