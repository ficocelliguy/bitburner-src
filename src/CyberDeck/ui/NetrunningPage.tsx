import React from "react";
import { NetrunMinigame } from "./NetrunMinigame";
import { NetrunningState } from "../models/NetrunningState";
import { NetrunningPortal } from "./NetrunningPortal";
import { RewardsModal } from "./RewardsModal";
import { NetrunningRewards } from "../Types";
import { netrunFlavorText } from "../models/constants";
import { netrunRewards } from "../models/netrunRewards";
import { initNetrunGrid } from "../models/netrunningMinigame";

export function NetrunningPage({corrupted = false}: {corrupted?: boolean}): React.ReactElement {
  const [showRewardsModal, setShowRewardsModal] = React.useState(false);
  const [netrunningModRewards, setNetrunningModRewards] = React.useState<NetrunningRewards>({
    success: false,
    mods: [],
    components: {},
  });


  function resetPortal() {
    setShowRewardsModal(false);
  }

  function startNetrun() {
    initNetrunGrid(corrupted);
  }

  function endNetrun() {
    NetrunningState.isNetrunning = false;

    // TODO-fico: reward scaling
    const rewards = netrunRewards(corrupted);
    if (!rewards.success) return;
    setNetrunningModRewards(rewards);
    setShowRewardsModal(true)
  }

  return (
    <>
      <RewardsModal
        open={showRewardsModal}
        onClose={() => resetPortal()}
        rewards={netrunningModRewards}
        title={"Netrunning Results"}
        flavorText={netrunFlavorText}
      />
      {NetrunningState.isNetrunning ? <NetrunMinigame complete={endNetrun}></NetrunMinigame> : <NetrunningPortal entered={startNetrun} />}
    </>
  );
}
