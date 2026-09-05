import React, { useEffect } from "react";

import { Button } from "@mui/material";
import { craftICEbreaker, craftPowerSupply, craftProcessingModule, craftUplink } from "../models/createModule";
import { ComponentCost, ComponentSymbol } from "./ComponentCost";
import {
  componentSymbols,
  ICEbreakerCraftingCost,
  powerSupplyCraftingCost,
  processingModuleCraftingCost,
  uplinkCraftingCost,
} from "../models/constants";
import { getModIconComponent } from "./Icons";
import { DeckMod, ModType } from "../Types";
import { Settings } from "../../Settings/Settings";
import { RewardsModal } from "./RewardsModal";
import {
  canUpgradeCyberdeckServerRam,
  getCyberdeckServerCoreUpgradeCost,
  getCyberdeckServerRamUpgradeCost,
  upgradeCyberdeckServerCores,
  upgradeCyberdeckServerRam,
} from "../models/cyberdeckServer";
import { CyberdeckEvents } from "../models/CyberdeckState";
import { useRerender } from "../../ui/React/hooks";
import { gainComponentMessage } from "./gainComponentToast";

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

  function tryCraftICEbreaker() {
    const success = craftICEbreaker();
    if (success) {
      gainComponentMessage({ ICEBreakers: 1 });
    }
  }

  function craft(results: DeckMod | null) {
    if (!results) {
      return;
    }
    setCraftingRewards([results]);
    setShowRewardsModal(true);
  }

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "row" }}>
      <RewardsModal
        title={"Crafting successful!"}
        open={showRewardsModal}
        rewards={{ success: true, mods: craftingRewards, components: {} }}
        onClose={() => setShowRewardsModal(false)}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px", width: "300px" }}>
        <Button onClick={tryCraftICEbreaker}>
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
              Craft <ComponentSymbol symbol={componentSymbols.ICEBreakers} /> ICEbreaker
            </span>
            <ComponentCost cost={ICEbreakerCraftingCost} />
          </div>
        </Button>

        <Button onClick={upgradeCyberdeckServerRam} disabled={!canUpgradeCyberdeckServerRam()}>
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
        <Button onClick={upgradeCyberdeckServerCores}>
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
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px", width: "300px" }}>
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
