import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { cyberdeckStyles } from "./cyberdeckStyles";
import { DeckModule } from "../Types";
import { ModuleComponent } from "./ModuleComponent";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { ModuleLootCover } from "./ModuleLootCover";

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
  const { classes } = cyberdeckStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rewards</DialogTitle>
      <DialogContent>
        {rewards.length > 0 && (
          <>
            <Typography variant="h6">Modules:</Typography>
            <DragDropContext onDragEnd={() => {}}>
              <Droppable droppableId="modules" isDropDisabled>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
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
              Chips: {componentRewards.chips}, Neurodes: {componentRewards.neurodes}, ROM: {componentRewards.ROM}
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