import React, { useEffect } from "react";

import { Button, Tooltip, Typography } from "@mui/material";
import { craftICEBreaker, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";
import { ComponentCost, ComponentSymbol } from "./ComponentCost";
import {
  componentSymbols,
  getModuleDescription,
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
import { ComponentTooltip } from "./ComponentInventoryCount";

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
        <ComponentTooltip symbol={componentSymbols.iceBreakers}>
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
        </ComponentTooltip>

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
        <Tooltip
          title={
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "4px" }}>Craft a Power Supply mod for use on the cyberdeck rack</h3>
                <Typography sx={{ fontSize: "11px", color: Settings.theme.secondary, width: "350px" }}>
                  {getModuleDescription(ModType.PowerSupply, true)}
                </Typography>
              </div>
            </div>
          }
        >
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
        </Tooltip>

        <Tooltip
          title={
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "4px" }}>Craft an Uplink mod for use on the cyberdeck rack</h3>
                <Typography sx={{ fontSize: "11px", color: Settings.theme.secondary, width: "350px" }}>
                  {getModuleDescription(ModType.Uplink, true)}
                </Typography>
              </div>
            </div>
          }
        >
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
        </Tooltip>

        <Tooltip
          title={
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "4px" }}>Craft a Processing mod for use on the cyberdeck rack</h3>
                <Typography sx={{ fontSize: "11px", color: Settings.theme.secondary, width: "350px" }}>
                  {getModuleDescription(ModType.ProcessingMod, true)}
                </Typography>
              </div>
            </div>
          }
        >
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
        </Tooltip>
      </div>
    </div>
  );
}
