import React, { useEffect } from "react";
import { NetrunMinigame } from "./NetrunMinigame";
import { NetrunningState } from "../models/NetrunningState";
import { NetrunningPortal } from "./NetrunningPortal";
import { RewardsModal } from "./RewardsModal";
import { NetrunningRewards } from "../Types";
import { corruptedNetrunFlavorText, netrunFlavorText } from "../models/constants";
import { netrunRewards } from "../models/netrunRewards";
import { initNetrunGrid } from "../models/netrunningMinigame";
import { useRerender } from "../../ui/React/hooks";
import { NetrunTargetSelect } from "./NetrunTargetSelect";
import { CyberdeckEvents } from "../models/CyberdeckState";

export function NetrunningPage({ corrupted = false }: { corrupted?: boolean }): React.ReactElement {
  const rerender = useRerender(1000);
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [showTargetSelect, setShowTargetSelect] = React.useState(false);
  const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({
    mods: [],
    components: {},
  });

  useEffect(() => {
    if (corrupted) {
      const clearSubscription = CyberdeckEvents.subscribe(() => rerender());
      return () => clearSubscription();
    }
  }, [rerender, corrupted]);

  function startNetrun() {
    if (corrupted) {
      setShowTargetSelect(false);
      initNetrunGrid(true);
    } else {
      setShowTargetSelect(true);
    }
  }

  function cancel() {
    setShowTargetSelect(false);
  }

  function endNetrun() {
    const rewards = netrunRewards();
    setNetrunningModRewards(rewards);
    setShowRewardsModal(true);
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
      {showTargetSelect ? (
        <NetrunTargetSelect closeSelection={cancel} />
      ) : NetrunningState.isNetrunning || NetrunningState.showNetrunOverride ? (
        <NetrunMinigame complete={endNetrun}></NetrunMinigame>
      ) : (
        <NetrunningPortal entered={startNetrun} corrupted={corrupted} />
      )}
    </>
  );
}
