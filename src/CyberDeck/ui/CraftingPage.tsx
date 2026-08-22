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
import { DeckModule, ModuleType } from "../Types";
import { Settings } from "../../Settings/Settings";
import { RewardsModal } from "./RewardsModal";
import {
  getCyberdeckServerCoreUpgradeCost,
  getCyberdeckServerRamUpgradeCost, upgradeCyberdeckServerCores,
  upgradeCyberdeckServerRam,
} from "../models/cyberdeckServer";
import { CyberdeckEvents } from "../models/CyberdeckState";
import { useRerender } from "../../ui/React/hooks";


export function CraftingPage(): React.ReactElement {
  const render = useRerender();
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [craftingRewards, setCraftingRewards] = React.useState<DeckModule[]>([]);

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

  function craft(results: DeckModule | null) {
    if (!results) { return; }
    setCraftingRewards([results]);
    setShowRewardsModal(true);
  }

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "row" }}>
      <RewardsModal
        title={"Crafting successful!"}
        open={showRewardsModal}
        rewards={{ success: true, modules: craftingRewards, components: {} }}
        onClose={() => setShowRewardsModal(false)}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px", width: "300px" }}>
        <Button onClick={() => craftICEbreaker()}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>
              Craft <ComponentSymbol symbol={componentSymbols.ICE} /> ICEbreaker
            </span>
            <ComponentCost cost={ICEbreakerCraftingCost} />
          </div>
        </Button>
        <Button onClick={tryCraftPowerSupply}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>Craft {getModIconComponent(ModuleType.PowerSupply, 16)} Power Supply Mod</span>
            <ComponentCost cost={powerSupplyCraftingCost} />
          </div>
        </Button>
        <Button onClick={tryCraftUplink}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>Craft {getModIconComponent(ModuleType.Uplink, 16)} Uplink Mod</span>
            <ComponentCost cost={uplinkCraftingCost} />
          </div>
        </Button>
        <Button onClick={tryCraftProcessingModule}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>Craft {getModIconComponent(ModuleType.ProcessingModule, 16)} Processing Mod</span>
            <ComponentCost cost={processingModuleCraftingCost} />
          </div>
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px", width: "300px" }}>
        <Button onClick={upgradeCyberdeckServerRam}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>Upgrade cyberdeck Server RAM</span>
            <ComponentCost
              cost={getCyberdeckServerRamUpgradeCost().componentCost}
              moneyCost={getCyberdeckServerRamUpgradeCost().moneyCost}
            />
          </div>
        </Button>
        <Button onClick={upgradeCyberdeckServerCores}>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", color: Settings.theme.maplocation, margin: "5px" }}
          >
            <span>Upgrade cyberdeck Server Cores</span>
            <ComponentCost
              cost={getCyberdeckServerCoreUpgradeCost().componentCost}
              moneyCost={getCyberdeckServerCoreUpgradeCost().moneyCost}
            />
          </div>
        </Button>
      </div>
    </div>
  );
}
