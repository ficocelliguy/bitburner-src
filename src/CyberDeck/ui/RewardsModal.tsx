import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import { ComponentCounts, DeckModule, NetrunningRewards } from "../Types";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { ModuleLootCover } from "./ModuleLootCover";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";
import { Settings } from "../../Settings/Settings";
import { TRASH_CAN } from "./ModuleRackAndInventoryPage";
import { disassembleModule } from "../models/createModule";
import { TrashCan } from "./TrashCan";

type RewardsModalProps = {
  open: boolean;
  onClose: () => void;
  rewards: NetrunningRewards;
};

export function RewardsModal({ open, onClose, rewards }: RewardsModalProps) {
  const [displayedModules, setDisplayedModules] = React.useState<DeckModule[]>(rewards.modules);

  React.useEffect(() => {
    setDisplayedModules(rewards.modules);
  }, [rewards]);

  function rewardsHaveComponents(componentRewards: Partial<ComponentCounts>): boolean {
    return Object.values(componentRewards).some(value => value > 0);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination || result.destination.droppableId !== TRASH_CAN) return;
    const moduleToTrash = displayedModules.find((m) => m.id === result.draggableId);
    if (!moduleToTrash) return;
    disassembleModule(moduleToTrash, true);
    setDisplayedModules((mods) => mods.filter((m) => m.id !== moduleToTrash.id));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>Rewards</DialogTitle>
      <DialogContent>
        {rewardsHaveComponents(rewards.components) && (
          <>
            <Typography variant="h6">Components Found:</Typography>
            <Typography
              component="div"
              sx={{
                padding: "15px",
                border: `1px solid ${Settings.theme.button}`,
                marginBottom: "12px",
                color: Settings.theme.maplocation,
              }}
            >
              {!!rewards.components.chips && (
                <>
                  <ComponentSymbol symbol={componentSymbols.chips} />: {rewards.components.chips}{" "}
                </>
              )}
              {!!rewards.components.neurodes && (
                <>
                  <ComponentSymbol symbol={componentSymbols.neurodes} />: {rewards.components.neurodes}{" "}
                </>
              )}
              {!!rewards.components.ROM && (
                <>
                  <ComponentSymbol symbol={componentSymbols.ROM} />: {rewards.components.ROM}{" "}
                </>
              )}
              {!!rewards.components.cores && (
                <>
                  <ComponentSymbol symbol={componentSymbols.cores} />: {rewards.components.cores}
                </>
              )}
            </Typography>
          </>
        )}
        <Typography variant="h6">Modules Found:</Typography>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div {...provided.droppableProps} style={{ height: "300px", width: "470px" }} ref={provided.innerRef}>
                {displayedModules.map((module, index) => (
                  <ModuleLootCover key={module.id} module={module} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <TrashCan />
        </DragDropContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}