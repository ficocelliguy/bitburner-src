import React from "react";
import Button from "@mui/material/Button";

import { dialogBoxCreate } from "../../ui/React/DialogBox";

import { Player } from "@player";

import { Money } from "../../ui/React/Money";
import { hasCyberdeck } from "../models/CyberdeckState";
import { CyberdeckPurchasePrice } from "../models/constants";
import { gainCyberdeck } from "../effects";

/** Attempt to purchase a Cyberdeck using the button. */
export function purchaseCyberdeck(): void {
  if (hasCyberdeck()) {
    dialogBoxCreate(`You already have a cyberdeck!`);
    return;
  }
  if (!Player.canAfford(CyberdeckPurchasePrice)) {
    dialogBoxCreate("You cannot afford to purchase a cyberdeck!");
    return;
  }
  Player.loseMoney(CyberdeckPurchasePrice, "other");

  gainCyberdeck();
  dialogBoxCreate(
    "Hosaka cyberdecks: The finest that money can buy.\n" +
      "Congratulations the purchase of your new rig!\n" +
      "You can access it via the link in the left-hand panel.\n\n" +
      "Good luck out there, Netrunner.",
  );
}

interface IProps {
  rerender: () => void;
}

export function CyberdeckPurchaseButton(props: IProps): React.ReactElement {
  function buy(): void {
    purchaseCyberdeck();
    props.rerender();
  }

  return (
    <Button disabled={!Player.canAfford(CyberdeckPurchasePrice) || hasCyberdeck()} onClick={buy}>
      Purchase Cyberdeck -&nbsp;
      {hasCyberdeck() ? "Purchased" : <Money money={CyberdeckPurchasePrice} forPurchase={true} />}
    </Button>
  );
}
