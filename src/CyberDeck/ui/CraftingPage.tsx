import React, { useEffect } from "react";

import { Button } from "@mui/material";
import { craftICEBreaker, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";
import { ComponentCost, ComponentSymbol } from "./ComponentCost";
import {
  componentSymbols,
  ICEBreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "../models/constants";
import { getModIconComponent } from "./Icons";
import { DeckMod } from "../Types";
import { ModType } from "../Enums";
import { Settings } from "../../Settings/Settings";
import { RewardsModal } from "./RewardsModal";
import {
  canUpgradeCyberdeckServerRam,
  getCyberdeckServerCoreUpgradeCost,
  getCyberdeckServerRamUpgradeCost,
  upgradeCyberdeckServerCores,
  upgradeCyberdeckServerRam,
} from "../models/cyberdeckServer";
import { CyberdeckEvents, CyberdeckState } from "../models/CyberdeckState";
import { useRerender } from "../../ui/React/hooks";
import { gainComponentMessage } from "./gainComponentToast";
import { completeCraftedIcebreakerTutorial } from "../models/tutorial";
import { TutorialChecklist } from "./TutorialChecklist";
import { SnackbarEvents } from "../../ui/React/Snackbar";
import { ToastVariant } from "@enums";

export function CraftingPage(): React.ReactElement {
  const render = useRerender();
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [craftingRewards, setCraftingRewards] = React.useState<DeckMod[]>([]);

  useEffect(() => {
    const clearSubscription = CyberdeckEvents.subscribe(() => render());
    return () => clearSubscription();
  }, [render]);

  function tryCraftPowerSupply() {
    craft(craftPowerSupply());
  }

  function tryCraftUplink() {
    craft(craftUplink());
  }

  function tryCraftProcessingModule() {
    craft(craftProcessingModule());
  }

  function tryCraftICEBreaker() {
    const success = craftICEBreaker();
    if (success) {
      gainComponentMessage({ iceBreakers: 10 });
      completeCraftedIcebreakerTutorial();
    } else {
      SnackbarEvents.emit(`Not enough components.`, ToastVariant.WARNING, 2000);
    }
  }

  function craft(results: DeckMod | null) {
    if (!results) {
      return;
    }
    setCraftingRewards([results]);
    setShowRewardsModal(true);
  }

  function tryUpgradeCores() {
    const result = upgradeCyberdeckServerCores();
    if (result) {
      SnackbarEvents.emit(`Cyberdeck server cores upgraded.`, ToastVariant.SUCCESS, 2000);
    } else {
      SnackbarEvents.emit(`Cannot afford upgrade.`, ToastVariant.WARNING, 2000);
    }
  }
  function tryUpgradeRam() {
    const result = upgradeCyberdeckServerRam();
    if (result) {
      SnackbarEvents.emit(`Cyberdeck server ram upgraded.`, ToastVariant.SUCCESS, 2000);
    } else {
      SnackbarEvents.emit(`Cannot afford upgrade.`, ToastVariant.WARNING, 2000);
    }
  }

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "row" }}>
      <RewardsModal
        title={"Crafting successful!"}
        open={showRewardsModal}
        rewards={{ mods: craftingRewards, components: {} }}
        onClose={() => setShowRewardsModal(false)}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginRight: "20px", width: "300px" }}>
        <Button onClick={tryCraftICEBreaker}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>
              Craft 10x <ComponentSymbol symbol={componentSymbols.iceBreakers} /> ICEBreaker
            </span>
            <ComponentCost cost={ICEBreakerCraftingCost} />
          </div>
        </Button>

        <Button onClick={tryUpgradeRam} disabled={!canUpgradeCyberdeckServerRam()}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>Upgrade cyberdeck Server RAM{!canUpgradeCyberdeckServerRam() && " (Maxed)"}</span>
            {canUpgradeCyberdeckServerRam() && (
              <ComponentCost
                cost={getCyberdeckServerRamUpgradeCost().componentCost}
                moneyCost={getCyberdeckServerRamUpgradeCost().moneyCost}
              />
            )}
          </div>
        </Button>
        <Button onClick={tryUpgradeCores}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>Upgrade cyberdeck Server Cores</span>
            <ComponentCost
              cost={getCyberdeckServerCoreUpgradeCost().componentCost}
              moneyCost={getCyberdeckServerCoreUpgradeCost().moneyCost}
            />
          </div>
        </Button>

        {!CyberdeckState.hasCompletedTutorial && <TutorialChecklist />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "300px" }}>
        <Button onClick={tryCraftPowerSupply}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>Craft {getModIconComponent(ModType.PowerSupply, 16)} Power Supply Mod</span>
            <ComponentCost cost={powerSupplyCraftingCost} />
          </div>
        </Button>
        <Button onClick={tryCraftUplink}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>Craft {getModIconComponent(ModType.Uplink, 16)} Uplink Mod</span>
            <ComponentCost cost={uplinkCraftingCost} />
          </div>
        </Button>
        <Button onClick={tryCraftProcessingModule}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: Settings.theme.maplocation,
              margin: "5px",
            }}
          >
            <span>Craft {getModIconComponent(ModType.ProcessingMod, 16)} Processing Mod</span>
            <ComponentCost cost={processingModuleCraftingCost} />
          </div>
        </Button>
      </div>
    </div>
  );
}
