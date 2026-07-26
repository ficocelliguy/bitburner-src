import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { DeckModule } from "../Types";
import { ModuleComponent } from "./ModuleComponent";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { ModuleLootCover } from "./ModuleLootCover";
import { ComponentSymbol } from "./ComponentCost";
import { componentSymbols } from "../models/constants";

type RewardsModalProps = {
  open: boolean;
  onClose: () => void;
  rewards: DeckModule[];
  componentRewards?: {
    chips: number;
    neurodes: number;
    ROM: number;
  } | null;
};

export function RewardsModal({ open, onClose, rewards, componentRewards }: RewardsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>Rewards</DialogTitle>
      <DialogContent>
        {rewards.length > 0 && (
          <>
            <Typography variant="h6">Modules:</Typography>
            <DragDropContext onDragEnd={() => {}}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div {...provided.droppableProps} style={{height: "300px"}} ref={provided.innerRef}>
                    {rewards.map((module, index) => (
                      <ModuleLootCover key={module.id} module={module} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
        {componentRewards && (
          <>
            <Typography variant="h6">Components:</Typography>
            <div>
              <ComponentSymbol symbol={componentSymbols.chips} />: {componentRewards.chips}, <ComponentSymbol symbol={componentSymbols.neurodes} />: {componentRewards.neurodes}, <ComponentSymbol symbol={componentSymbols.ROM} />: {componentRewards.ROM}
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}