import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { ComponentCounts, DeckMod, NetrunningRewards } from "../Types";
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
  title: string;
  flavorText?: string;
};

export function RewardsModal({ open, onClose = () => {}, rewards, flavorText = "", title }: RewardsModalProps) {
  const [displayedModules, setDisplayedModules] = React.useState<DeckMod[]>(rewards.mods);

  React.useEffect(() => {
    setDisplayedModules(rewards.mods);
  }, [rewards]);

  function rewardsHaveComponents(componentRewards: Partial<ComponentCounts>): boolean {
    return Object.values(componentRewards).some((value) => value > 0);
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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", overflow: "visible" }}>
        {flavorText && (
          <Typography
            sx={{ fontStyle: "italic", fontSize: "13px", marginBottom: "12px", color: Settings.theme.maplocation }}
          >
            {flavorText}
          </Typography>
        )}
        {rewardsHaveComponents(rewards.components) && (
          <>
            <Typography variant="h6">Components Found:</Typography>
            <Typography
              component="div"
              sx={{
                padding: "15px 25px",
                border: `1px solid ${Settings.theme.button}`,
                marginBottom: "12px",
                color: Settings.theme.maplocation,
              }}
            >
              {!!rewards.components.chips && (
                <span>
                  <ComponentSymbol symbol={componentSymbols.chips} />: {rewards.components.chips}{" "}
                </span>
              )}
              {!!rewards.components.neurodes && (
                <span>
                  <ComponentSymbol symbol={componentSymbols.neurodes} />: {rewards.components.neurodes}{" "}
                </span>
              )}
              {!!rewards.components.ROM && (
                <span>
                  <ComponentSymbol symbol={componentSymbols.ROM} />: {rewards.components.ROM}{" "}
                </span>
              )}
              {!!rewards.components.cores && (
                <span>
                  <ComponentSymbol symbol={componentSymbols.cores} />: {rewards.components.cores}
                </span>
              )}
            </Typography>
          </>
        )}
        <Typography variant="h6">Mods Gained:</Typography>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div {...provided.droppableProps} style={{ height: "300px", width: "470px" }} ref={provided.innerRef}>
                {displayedModules.map((module, index) => (
                  <div key={module.id} style={{ height: "80px" }}>
                    <ModuleLootCover module={module} index={index} />
                  </div>
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
